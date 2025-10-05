import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { Toaster } from "sonner";
import "./app.css";

import DashboardLayout from "@components/DashboardLayout";
import { ProtectedRoute } from "@components/ProtectedRoute";
import { ThemeProvider } from "@components/ThemeProvider";
import CreateLog from "@pages/CreateLog";
import Dashboard from "@pages/Dashboard";
import LogDetail from "@pages/LogDetail";
import Login from "@pages/Login";
import LogList from "@pages/LogList";
import Register from "@pages/Register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: <Dashboard />,
          },
          {
            path: "/logs",
            element: <LogList />,
          },
          {
            path: "/logs/create",
            element: <CreateLog />,
          },
          {
            path: "/logs/:id",
            element: <LogDetail />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="logs-dashboard-theme">
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        expand={false}
        richColors
        closeButton
        theme="system"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border",
            title: "text-foreground",
            description: "text-muted-foreground",
            actionButton: "bg-primary text-primary-foreground",
            cancelButton: "bg-muted text-muted-foreground",
          },
        }}
      />
    </ThemeProvider>
  </React.StrictMode>
);
