import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { useThemeStore } from "./stores/themeStore";

console.log("🚀 main.tsx loaded");
console.log("Root element:", document.getElementById("root"));

// Initialize theme before rendering
useThemeStore.getState().mode; // This triggers initialization

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  throw new Error("Root element not found");
}

console.log("✅ Creating React root...");
const root = ReactDOM.createRoot(rootElement);

console.log("✅ Rendering App...");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("✅ App rendered!");
