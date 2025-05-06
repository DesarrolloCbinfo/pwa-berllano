import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import App from "./app/App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
