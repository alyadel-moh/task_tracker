import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import router from "./routing/routes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  },
});
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1c1c1f",
            color: "#f5f5f5",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            fontFamily: "inherit",
          },
          success: {
            iconTheme: {
              primary: "#4ade80", // vibrant green icon
              secondary: "#1c1c1f",
            },
            style: {
              border: "1px solid rgba(74, 222, 128, 0.2)",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff9b9b", // soft red icon matching field-error color
              secondary: "#1c1c1f",
            },
            style: {
              border: "1px solid rgba(224, 90, 90, 0.25)",
            },
          },
        }}
      />
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
