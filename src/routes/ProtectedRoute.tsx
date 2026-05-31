import { Navigate, Outlet, useLocation } from "react-router-dom";

import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/providers/AuthProvider";

export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageLoader message="Checking your Sahavas session" />;
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return <Outlet />;
}
