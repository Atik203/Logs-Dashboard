import { Navigate, Outlet } from "react-router-dom";

import { authService } from "@api/auth";

export function ProtectedRoute() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
