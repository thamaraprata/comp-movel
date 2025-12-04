import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { ThemeProvider } from "./providers/theme-provider";
import { PWAProvider } from "./providers/pwa-provider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PWAProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </PWAProvider>
  </React.StrictMode>
);

