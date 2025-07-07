import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log("🔍 PWA Install Hook: Initializing...");

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (
        window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches
      ) {
        console.log(
          "✅ PWA Install Hook: App is already installed (standalone mode)"
        );
        setIsInstalled(true);
        return true;
      }
      if ((window.navigator as any).standalone === true) {
        console.log(
          "✅ PWA Install Hook: App is already installed (iOS standalone)"
        );
        setIsInstalled(true);
        return true;
      }
      console.log("ℹ️ PWA Install Hook: App is not installed");
      return false;
    };

    // Don't show install button if already installed
    if (checkIfInstalled()) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("🎯 PWA Install Hook: beforeinstallprompt event fired!", e);
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
      console.log("✅ PWA Install Hook: Install button should now be visible");
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("🎉 PWA Install Hook: App has been installed!");
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    // Debug: Check if we're in a supported browser
    const userAgent = navigator.userAgent;
    console.log("🌐 PWA Install Hook: Browser:", {
      userAgent,
      isChrome: userAgent.includes("Chrome"),
      isEdge: userAgent.includes("Edge"),
      isFirefox: userAgent.includes("Firefox"),
      isSafari: userAgent.includes("Safari") && !userAgent.includes("Chrome"),
    });

    // Debug: Check for service worker support
    if ("serviceWorker" in navigator) {
      console.log("✅ PWA Install Hook: Service Worker is supported");
    } else {
      console.log("❌ PWA Install Hook: Service Worker is NOT supported");
    }

    // Debug: Check for manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      console.log(
        "✅ PWA Install Hook: Manifest link found:",
        manifestLink.getAttribute("href")
      );
    } else {
      console.log(
        "❌ PWA Install Hook: No manifest link found in document head"
      );
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Debug: Set a timeout to check if event fired
    setTimeout(() => {
      if (!isInstallable && !isInstalled) {
        console.log(
          "⚠️ PWA Install Hook: beforeinstallprompt event has not fired after 3 seconds"
        );
        console.log("💡 PWA Install Hook: This could mean:");
        console.log("   - Browser doesn't support PWA installation");
        console.log(
          "   - PWA criteria not met (manifest, service worker, HTTPS)"
        );
        console.log("   - App is already installed");
        console.log("   - Browser has dismissed the prompt previously");
      }
    }, 3000);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      console.log("❌ PWA Install Hook: No install prompt available");
      return false;
    }

    try {
      console.log("🚀 PWA Install Hook: Triggering install prompt...");
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;

      console.log("📝 PWA Install Hook: User choice:", choiceResult.outcome);

      if (choiceResult.outcome === "accepted") {
        console.log("✅ PWA Install Hook: User accepted installation");
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      } else {
        console.log("❌ PWA Install Hook: User dismissed installation");
      }
      return false;
    } catch (error) {
      console.error("❌ PWA Install Hook: Error during installation:", error);
      return false;
    }
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log("📊 PWA Install Hook: State update:", {
      isInstallable: isInstallable && !isInstalled,
      isInstalled,
      hasPrompt: !!installPrompt,
    });
  }, [isInstallable, isInstalled, installPrompt]);

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    handleInstall,
  };
};
