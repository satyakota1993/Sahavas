import { Navigate, Outlet } from "react-router-dom";

import { useSocietySession } from "@/providers/SocietyProvider";
import { normalizeRole, type CanonicalUserRole } from "@/types/roles";

interface RoleRouteProps {
  roles: CanonicalUserRole[];
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { roleContext } = useSocietySession();
  const normalizedRoles = roleContext?.roles.map(normalizeRole) ?? [];

  if (!normalizedRoles.some((role) => roles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
