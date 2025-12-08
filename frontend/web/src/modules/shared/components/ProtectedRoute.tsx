// frontend/web/src/modules/shared/components/ProtectedRoute.tsx

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate page based on role
    if (role === "supervisor" || role === "admin") {
      return <Navigate to="/supervisor/dashboard" replace />;
    }
    // For guards/users, redirect to their division attendance
    const division = user?.division || "security";
    return <Navigate to={`/${division}/attendance/checkin`} replace />;
  }

  return <>{children}</>;
}

