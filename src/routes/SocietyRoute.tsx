import { Navigate, Outlet } from "react-router-dom";

import { PageLoader } from "@/components/PageLoader";
import { useSocietySession } from "@/providers/SocietyProvider";

export function SocietyRoute() {
  const { isLoading, roleContext } = useSocietySession();

  if (isLoading) {
    return <PageLoader message="Loading your society access" />;
  }

  if (!roleContext) {
    return <Navigate to="/select-society" replace />;
  }

  return <Outlet />;
}
