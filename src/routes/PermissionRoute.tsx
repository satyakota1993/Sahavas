import { Navigate, Outlet } from "react-router-dom";

import { useSocietySession } from "@/providers/SocietyProvider";
import type { Permission } from "@/types/roles";

interface PermissionRouteProps {
  permission: Permission;
}

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { roleContext } = useSocietySession();

  if (!roleContext?.can(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
