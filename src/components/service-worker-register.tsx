"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only, to avoid caching dev assets).
 * Renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Registration failures are non-fatal; the app still works online.
    });
  }, []);

  return null;
}
