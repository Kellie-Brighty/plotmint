// Custom Rich Text Editor

import React, { useState, useRef, useEffect } from "react";
import {
  EditorHistory,
  handleKeyboardShortcuts,
  cleanPastedHTML,
  normalizeEditorContent,
  setupIMESupport,
  autoLinkURLs,
  getCleanEditorContent,
} from "./RichTextEditorHelpers";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

// Custom formatting commands
const COMMANDS = {
  BOLD: "bold",
  ITALIC: "italic",
  UNDERLINE: "underline",
  HEADING: "heading",
  QUOTE: "quote",
  UNORDERED_LIST: "unorderedList",
  ORDERED_LIST: "orderedList",
  ALIGN_LEFT: "alignLeft",
  ALIGN_CENTER: "alignCenter",
  ALIGN_RIGHT: "alignRight",
} as const;

type CommandType = (typeof COMMANDS)[keyof typeof COMMANDS];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your story...",
  className = "",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentSelection, setCurrentSelection] = useState<Range | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [activeCommands, setActiveCommands] = useState<Set<CommandType>>(
    new Set()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const historyRef = useRef(new EditorHistory());

  // Set initial content and handle placeholder visibility
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      // Set initial HTML content
      if (value) {
        editorRef.current.innerHTML = value;
        setShowPlaceholder(false);
      } else {
        editorRef.current.innerHTML = "";
        setShowPlaceholder(true);
      }

      // Initialize history with current content
      historyRef.current.addState(editorRef.current.innerHTML);

      // Setup IME support for international languages
      if (editorRef.current) {
        setupIMESupport({ current: editorRef.current });
      }

      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // Save selection when user selects text
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (isSelectionInEditor(range)) {
        setCurrentSelection(range.cloneRange());
        // Update active formats for current selection
        updateActiveFormats();
      }
    }
  };

  // Check if selection is inside the editor
  const isSelectionInEditor = (range: Range): boolean => {
    return editorRef.current?.contains(range.commonAncestorContainer) || false;
  };

  // Restore previously saved selection
  const restoreSelection = () => {
    if (currentSelection && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(currentSelection.cloneRange());
      }
    }
  };

  // Update which formatting commands are currently active
  const updateActiveFormats = () => {
    const newActiveCommands = new Set<CommandType>();

    if (document.queryCommandState("bold")) {
      newActiveCommands.add(COMMANDS.BOLD);
    }
    if (document.queryCommandState("italic")) {
      newActiveCommands.add(COMMANDS.ITALIC);
    }
    if (document.queryCommandState("underline")) {
      newActiveCommands.add(COMMANDS.UNDERLINE);
    }

    // Check for block formats
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.parentNode;
      }

      if (node) {
        const element = node as Element;

        // Check for headings
        if (/^H[1-6]$/.test(element.tagName)) {
          newActiveCommands.add(COMMANDS.HEADING);
        }

        // Check for blockquote
        if (element.closest("blockquote")) {
          newActiveCommands.add(COMMANDS.QUOTE);
        }

        // Check for lists
        if (element.closest("ul")) {
          newActiveCommands.add(COMMANDS.UNORDERED_LIST);
        }
        if (element.closest("ol")) {
          newActiveCommands.add(COMMANDS.ORDERED_LIST);
        }

        // Check for alignment
        const textAlign = window.getComputedStyle(element).textAlign;
        if (textAlign === "center") {
          newActiveCommands.add(COMMANDS.ALIGN_CENTER);
        } else if (textAlign === "right") {
          newActiveCommands.add(COMMANDS.ALIGN_RIGHT);
        } else if (textAlign === "left" || textAlign === "start") {
          newActiveCommands.add(COMMANDS.ALIGN_LEFT);
        }
      }
    }

    setActiveCommands(newActiveCommands);
  };

  // Execute formatting command
  const executeCommand = (command: CommandType) => {
    // Restore selection before executing command
    restoreSelection();

    switch (command) {
      case COMMANDS.BOLD:
        document.execCommand("bold", false);
        break;
      case COMMANDS.ITALIC:
        document.execCommand("italic", false);
        break;
      case COMMANDS.UNDERLINE:
        document.execCommand("underline", false);
        break;
      case COMMANDS.HEADING:
        // Toggle between h2 and normal paragraph
        if (activeCommands.has(COMMANDS.HEADING)) {
          document.execCommand("formatBlock", false, "p");
        } else {
          document.execCommand("formatBlock", false, "h2");
        }
        break;
      case COMMANDS.QUOTE:
        // Toggle blockquote
        if (activeCommands.has(COMMANDS.QUOTE)) {
          document.execCommand("formatBlock", false, "p");
        } else {
          document.execCommand("formatBlock", false, "blockquote");
        }
        break;
      case COMMANDS.UNORDERED_LIST:
        document.execCommand("insertUnorderedList", false);
        break;
      case COMMANDS.ORDERED_LIST:
        document.execCommand("insertOrderedList", false);
        break;
      case COMMANDS.ALIGN_LEFT:
        document.execCommand("justifyLeft", false);
        break;
      case COMMANDS.ALIGN_CENTER:
        document.execCommand("justifyCenter", false);
        break;
      case COMMANDS.ALIGN_RIGHT:
        document.execCommand("justifyRight", false);
        break;
      default:
        break;
    }

    // Update active formats after executing command
    updateActiveFormats();

    // Save to history and update parent component
    if (editorRef.current) {
      // Add the new state to history
      historyRef.current.addState(editorRef.current.innerHTML);

      // Normalize content
      if (editorRef.current) {
        normalizeEditorContent({ current: editorRef.current });
      }

      // Notify parent component of content change
      if (editorRef.current) {
        onChange(getCleanEditorContent({ current: editorRef.current }));
      }
    }

    // Focus editor after command execution
    editorRef.current?.focus();
  };

  // Handle input event
  const handleInput = () => {
    if (editorRef.current) {
      // Make sure editor content is well-formed
      normalizeEditorContent({ current: editorRef.current });

      // Update content via callback
      const contentToSave = getCleanEditorContent({
        current: editorRef.current,
      });
      onChange(contentToSave);

      // Check if editor is empty to control placeholder visibility
      setShowPlaceholder(
        editorRef.current.textContent?.trim() === "" ||
          editorRef.current.innerHTML === "<p><br></p>"
      );

      // Add current state to history
      historyRef.current.addState(editorRef.current.innerHTML);

      // Update active formats
      updateActiveFormats();

      // Auto-convert URLs to links
      autoLinkURLs({ current: editorRef.current });
    }
  };

  // Handle focus event
  const handleFocus = () => {
    setShowPlaceholder(false);
  };

  // Handle blur event
  const handleBlur = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setShowPlaceholder(content === "" || content === "<br>");
    }
  };

  // Handle paste to strip unwanted formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    // Get HTML or text from clipboard
    let content = "";

    if (e.clipboardData.types.includes("text/html")) {
      // Get HTML content
      content = e.clipboardData.getData("text/html");

      // Clean the HTML
      content = cleanPastedHTML(content);

      // Insert at current position
      document.execCommand("insertHTML", false, content);
    } else {
      // Get plain text
      content = e.clipboardData.getData("text/plain");

      // Insert text at current position
      document.execCommand("insertText", false, content);
    }

    // Save to history
    if (editorRef.current) {
      historyRef.current.addState(editorRef.current.innerHTML);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    handleKeyboardShortcuts(
      e,
      { current: editorRef.current },
      historyRef.current,
      saveSelection
    );
  };

  return (
    <div className="relative">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-parchment-100 dark:bg-dark-800 rounded-t-md border border-parchment-300 dark:border-dark-600">
        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.BOLD)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.BOLD)}
          title="Bold (Ctrl+B)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.ITALIC)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.ITALIC)}
          title="Italic (Ctrl+I)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.UNDERLINE)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.UNDERLINE)}
          title="Underline (Ctrl+U)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
            <line x1="4" y1="21" x2="20" y2="21"></line>
          </svg>
        </button>

        <div className="h-6 w-px mx-1.5 bg-parchment-300 dark:bg-dark-600"></div>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.HEADING)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.HEADING)}
          title="Heading"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M6 12h12"></path>
            <path d="M6 5h12"></path>
            <path d="M6 19h12"></path>
          </svg>
        </button>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.QUOTE)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.QUOTE)}
          title="Quote"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.UNORDERED_LIST)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.UNORDERED_LIST)}
          title="Bullet List"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.ORDERED_LIST)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.ORDERED_LIST)}
          title="Numbered List"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </button>

        <div className="h-6 w-px mx-1.5 bg-parchment-300 dark:bg-dark-600"></div>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.ALIGN_LEFT)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.ALIGN_LEFT)}
          title="Align Left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="17" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="17" y1="18" x2="3" y2="18"></line>
          </svg>
        </button>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.ALIGN_CENTER)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.ALIGN_CENTER)}
          title="Align Center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="18" y1="10" x2="6" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="18" y1="18" x2="6" y2="18"></line>
          </svg>
        </button>

        <button
          type="button"
          className={`p-1.5 rounded ${
            activeCommands.has(COMMANDS.ALIGN_RIGHT)
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
              : "text-ink-700 dark:text-ink-300 hover:bg-parchment-200 dark:hover:bg-dark-700"
          }`}
          onClick={() => executeCommand(COMMANDS.ALIGN_RIGHT)}
          title="Align Right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <line x1="21" y1="10" x2="7" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="7" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        className={`min-h-[300px] p-4 border border-parchment-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-800 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 overflow-auto prose prose-sm max-w-none prose-p:my-1 prose-headings:mt-4 prose-headings:mb-2 ${className}`}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        suppressContentEditableWarning
      ></div>

      {/* Placeholder */}
      {showPlaceholder && (
        <div className="absolute top-[48px] left-0 p-4 text-ink-400 dark:text-ink-500 pointer-events-none">
          {placeholder}
        </div>
      )}

      {/* Writing Tips */}
      <div className="mt-2 text-xs text-ink-500 dark:text-ink-400 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Tip: Use{" "}
          <kbd className="px-1 py-0.5 bg-parchment-100 dark:bg-dark-700 rounded text-[10px] font-mono">
            Ctrl+B
          </kbd>{" "}
          for bold,{" "}
          <kbd className="px-1 py-0.5 bg-parchment-100 dark:bg-dark-700 rounded text-[10px] font-mono">
            Ctrl+I
          </kbd>{" "}
          for italic,{" "}
          <kbd className="px-1 py-0.5 bg-parchment-100 dark:bg-dark-700 rounded text-[10px] font-mono">
            Ctrl+Z
          </kbd>{" "}
          to undo.
        </span>
      </div>

      {/* Custom Styles for Editor Content */}
      <style>
        {`
        [contenteditable] {
          -webkit-user-modify: read-write;
          overflow-wrap: break-word;
          -webkit-line-break: after-white-space;
          line-break: auto;
        }
        
        [contenteditable] h1, 
        [contenteditable] h2, 
        [contenteditable] h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        [contenteditable] h2 {
          font-size: 1.5em;
        }
        
        [contenteditable] blockquote {
          border-left: 3px solid #9CA3AF;
          padding-left: 1em;
          margin-left: 0;
          color: #6B7280;
        }
        
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }
        
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }

        [contenteditable] a {
          color: #3B82F6;
          text-decoration: underline;
        }
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;
