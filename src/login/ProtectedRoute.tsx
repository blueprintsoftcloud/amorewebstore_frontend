import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, also checks that the user's role matches one of these values (case-insensitive). */
  requiredRoles?: string[];
  /**
   * Where to redirect when the user IS authenticated but has the wrong role.
   * Defaults to "/" (customer home) when not specified.
   */
  redirectTo?: string;
  /**
   * Where to redirect when the user is NOT authenticated (never logged in, or the
   * session expired before this page loaded — e.g. a direct visit/refresh with a
   * dead token, which never goes through AuthContext's logout()). Defaults to
   * "/login" for admin/staff/shared routes; customer-only routes pass "/" so an
   * expired customer session lands back on the storefront, not the admin login form.
   */
  unauthenticatedRedirectTo?: string;
}

const ProtectedRoute = ({
  children,
  requiredRoles,
  redirectTo = "/",
  unauthenticatedRedirectTo = "/login",
}: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user || user.isInitialLoad) return null;

  if (!user.isAuthenticated) return <Navigate to={unauthenticatedRedirectTo} replace />;

  if (
    requiredRoles &&
    requiredRoles.length > 0 &&
    (!user.role ||
      !requiredRoles
        .map((r) => r.toUpperCase())
        .includes(user.role.toUpperCase()))
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
