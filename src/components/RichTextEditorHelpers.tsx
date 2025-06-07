import type { RefObject } from "react";

interface HistoryState {
  html: string;
  cursorPosition?: {
    startNode: Node | null;
    startOffset: number;
    endNode: Node | null;
    endOffset: number;
  };
}

// History management class for undo/redo functionality
export class EditorHistory {
  private states: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxStates: number = 100;
  private shouldIgnoreNextChange: boolean = false;

  // Add a new state to history
  public addState(html: string): void {
    if (this.shouldIgnoreNextChange) {
      this.shouldIgnoreNextChange = false;
      return;
    }

    // Save current selection if available
    const selection = window.getSelection();
    let cursorPosition = undefined;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPosition = {
        startNode: range.startContainer,
        startOffset: range.startOffset,
        endNode: range.endContainer,
        endOffset: range.endOffset,
      };
    }

    // If we're not at the end of the history, remove future states
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.states.push({ html, cursorPosition });
    this.currentIndex = this.states.length - 1;

    // Limit history size
    if (this.states.length > this.maxStates) {
      this.states.shift();
      this.currentIndex--;
    }
  }

  // Undo the last change
  public undo(editorRef: RefObject<HTMLDivElement>): boolean {
    if (this.currentIndex <= 0 || !editorRef.current) {
      return false;
    }

    this.currentIndex--;
    this.shouldIgnoreNextChange = true;
    editorRef.current.innerHTML = this.states[this.currentIndex].html;

    // Try to restore cursor position
    this.restoreCursorPosition(this.states[this.currentIndex], editorRef);

    return true;
  }

  // Redo the last undone change
  public redo(editorRef: RefObject<HTMLDivElement>): boolean {
    if (this.currentIndex >= this.states.length - 1 || !editorRef.current) {
      return false;
    }

    this.currentIndex++;
    this.shouldIgnoreNextChange = true;
    editorRef.current.innerHTML = this.states[this.currentIndex].html;

    // Try to restore cursor position
    this.restoreCursorPosition(this.states[this.currentIndex], editorRef);

    return true;
  }

  // Restore cursor position from history state
  private restoreCursorPosition(
    state: HistoryState,
    editorRef: RefObject<HTMLDivElement>
  ): void {
    if (!state.cursorPosition || !editorRef.current) return;

    // Find equivalent nodes in the current DOM
    const findEquivalentNode = (
      originalNode: Node | null,
      currentRoot: Node,
      originalRoot: Node | null
    ): { node: Node | null; offset: number } => {
      if (!originalNode || !originalRoot) {
        return { node: currentRoot, offset: 0 };
      }

      // If the original node was the editor itself
      if (originalNode === originalRoot) {
        return { node: currentRoot, offset: 0 };
      }

      // Try to find the node at the same path
      const path: number[] = [];
      let current = originalNode;
      while (current && current !== originalRoot && current.parentNode) {
        const parent = current.parentNode;
        const childNodes = Array.from(parent.childNodes);
        const index = childNodes.indexOf(current as ChildNode);
        if (index !== -1) {
          path.unshift(index);
        }
        current = parent;
      }

      // Navigate to the equivalent node in the current DOM
      current = currentRoot;
      for (const index of path) {
        if (current.childNodes.length > index) {
          current = current.childNodes[index];
        } else {
          // If the exact path doesn't exist, return the closest parent
          break;
        }
      }

      // Return the node and keep the original offset if possible
      const startOffset = state.cursorPosition?.startOffset || 0;
      const endOffset = state.cursorPosition?.endOffset || 0;
      const offset =
        originalNode === state.cursorPosition?.startNode
          ? startOffset
          : endOffset;
      return { node: current, offset };
    };

    try {
      const selection = window.getSelection();
      if (!selection) return;

      const { startNode, endNode } = state.cursorPosition;
      const start = findEquivalentNode(startNode, editorRef.current, null);
      const end = findEquivalentNode(endNode, editorRef.current, null);

      if (start.node && end.node) {
        const range = document.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);

        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error("Failed to restore cursor position:", error);
    }
  }

  // Reset history
  public reset(): void {
    this.states = [];
    this.currentIndex = -1;
  }
}

// Process keyboard shortcuts
export const handleKeyboardShortcuts = (
  e: React.KeyboardEvent,
  editorRef: RefObject<HTMLDivElement | null>,
  editorHistory: EditorHistory,
  saveSelection: () => void
): boolean => {
  // Check if meta key (cmd on Mac, ctrl on Windows) is pressed
  const metaKey = e.metaKey || e.ctrlKey;

  // Handle undo/redo
  if (metaKey) {
    if (e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        // Redo (Cmd/Ctrl+Shift+Z)
        return editorHistory.redo(editorRef as RefObject<HTMLDivElement>);
      } else {
        // Undo (Cmd/Ctrl+Z)
        return editorHistory.undo(editorRef as RefObject<HTMLDivElement>);
      }
    } else if (e.key === "y") {
      // Redo (Cmd/Ctrl+Y) - alternative shortcut
      e.preventDefault();
      return editorHistory.redo(editorRef as RefObject<HTMLDivElement>);
    }
  }

  // Save selection after user interaction
  setTimeout(saveSelection, 0);
  return false;
};

// Clean HTML when pasting
export const cleanPastedHTML = (html: string): string => {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove all style attributes and classes
  const allElements = tempDiv.querySelectorAll("*");
  allElements.forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("class");

    // Remove data attributes
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("data-")) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Remove unsupported elements
  const unsupportedTags = [
    "script",
    "style",
    "iframe",
    "frame",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "select",
    "option",
    "textarea",
    "meta",
  ];

  unsupportedTags.forEach((tag) => {
    const elements = tempDiv.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  // Convert divs to paragraphs
  const divs = tempDiv.querySelectorAll("div");
  divs.forEach((div) => {
    const p = document.createElement("p");
    p.innerHTML = div.innerHTML;
    div.parentNode?.replaceChild(p, div);
  });

  return tempDiv.innerHTML;
};

// Sanitize HTML before saving
export const sanitizeHTML = (html: string): string => {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove all event handlers
  const allElements = tempDiv.querySelectorAll("*");
  allElements.forEach((el) => {
    // Remove all attributes that start with 'on'
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Remove all script tags
  const scripts = tempDiv.querySelectorAll("script");
  scripts.forEach((script) => script.remove());

  return tempDiv.innerHTML;
};

// Fix common formatting issues
export const normalizeEditorContent = (
  editorRef: RefObject<HTMLDivElement | null>
): void => {
  if (!editorRef.current) return;

  // Fix empty editor - ensure there's always at least one paragraph
  if (
    editorRef.current.innerHTML.trim() === "" ||
    editorRef.current.innerHTML === "<br>"
  ) {
    editorRef.current.innerHTML = "<p><br></p>";

    // Place cursor in the empty paragraph
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      const p = editorRef.current.querySelector("p");
      if (p) {
        range.setStart(p, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  // Ensure all text is wrapped in block elements
  const childNodes = Array.from(editorRef.current.childNodes);
  let textNodeFound = false;

  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      textNodeFound = true;
      break;
    }
  }

  if (textNodeFound) {
    // Wrap loose text nodes in paragraphs
    const fragment = document.createDocumentFragment();
    let currentP: HTMLParagraphElement | null = null;

    childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!currentP) {
          currentP = document.createElement("p");
          fragment.appendChild(currentP);
        }
        currentP.appendChild(node.cloneNode(true));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        currentP = null;
        fragment.appendChild(node.cloneNode(true));
      }
    });

    editorRef.current.innerHTML = "";
    editorRef.current.appendChild(fragment);
  }

  // Fix sequential BR tags (commonly created when pressing Enter multiple times)
  const brs = editorRef.current.querySelectorAll("br + br");
  brs.forEach((br) => {
    const parent = br.parentNode;
    if (parent && parent.nodeName.toLowerCase() !== "p") {
      const p = document.createElement("p");
      p.innerHTML = "<br>";
      parent.replaceChild(p, br);
    }
  });
};

// Handle IME (Input Method Editor) for languages like Chinese, Japanese, Korean
export const setupIMESupport = (
  editorRef: RefObject<HTMLDivElement | null>
): void => {
  if (!editorRef.current) return;

  editorRef.current.addEventListener("compositionstart", () => {
    // Mark that IME composition has started
    editorRef.current?.setAttribute("data-composing", "true");
  });

  editorRef.current.addEventListener("compositionend", () => {
    // Mark that IME composition has ended
    editorRef.current?.removeAttribute("data-composing");
  });
};

// Handle auto links
export const autoLinkURLs = (
  editorRef: RefObject<HTMLDivElement | null>
): void => {
  if (!editorRef.current) return;

  // Get current selection to restore it later
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const currentRange = selection.getRangeAt(0).cloneRange();

  // Find text nodes in the editor
  const textNodes: Node[] = [];
  const findTextNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        findTextNodes(node.childNodes[i]);
      }
    }
  };

  findTextNodes(editorRef.current);

  // URL regex pattern
  const urlRegex = /https?:\/\/[^\s\<\>]+/g;

  // Process each text node
  let hasChanges = false;

  for (const textNode of textNodes) {
    const text = textNode.textContent || "";
    const matches = text.match(urlRegex);

    if (matches && matches.length > 0) {
      hasChanges = true;
      let lastIndex = 0;
      const fragment = document.createDocumentFragment();

      for (const match of matches) {
        const matchIndex = text.indexOf(match, lastIndex);

        // Add text before the URL
        if (matchIndex > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastIndex, matchIndex))
          );
        }

        // Create link for the URL
        const link = document.createElement("a");
        link.href = match;
        link.textContent = match;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        fragment.appendChild(link);

        lastIndex = matchIndex + match.length;
      }

      // Add remaining text after the last URL
      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex))
        );
      }

      // Replace the original text node with the fragment
      textNode.parentNode?.replaceChild(fragment, textNode);
    }
  }

  // Restore selection if changes were made
  if (hasChanges && selection) {
    try {
      selection.removeAllRanges();
      selection.addRange(currentRange);
    } catch (error) {
      console.error(
        "Failed to restore selection after auto-linking URLs",
        error
      );
    }
  }
};

// Utility function to get HTML content with proper sanitization
export const getCleanEditorContent = (
  editorRef: RefObject<HTMLDivElement | null>
): string => {
  if (!editorRef.current) return "";

  // Clone the editor content to avoid modifying the actual DOM
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = editorRef.current.innerHTML;

  // Remove zero-width spaces used for cursor positioning
  const removeZeroWidthSpaces = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = node.textContent?.replace(/\u200B/g, "") || "";
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        removeZeroWidthSpaces(node.childNodes[i]);
      }
    }
  };

  removeZeroWidthSpaces(tempDiv);

  // Apply other sanitization
  return sanitizeHTML(tempDiv.innerHTML);
};
