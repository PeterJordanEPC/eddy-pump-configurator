import React from "react";
import { createRoot } from "react-dom/client";
import { createApiClient } from "./api/client.js";
import { App } from "./components/App.jsx";

const api = createApiClient({ apiBase: __API_BASE__, fallbackApiBase: __API_FALLBACK_BASE__ });
createRoot(document.getElementById("root")).render(<App api={api} />);
