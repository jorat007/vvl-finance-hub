import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Dev/preview safety: unregister Service Workers to avoid cached Vite chunks
// causing duplicate React instances (invalid hook call / useRef on null).
if (!import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });

  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys
        .filter((k) => k.startsWith("vvl-crm-"))
        .forEach((k) => caches.delete(k));
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
