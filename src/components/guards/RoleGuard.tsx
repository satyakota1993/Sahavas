import type { ReactNode } from "react";

import { useSocietySession } from "@/providers/SocietyProvider";
import { normalizeRole, type CanonicalUserRole, type UserRole } from "@/types/roles";

interface RoleGuardProps {
  roles: CanonicalUserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { roleContext } = useSocietySession();
  const normalizedRoles =
    roleContext?.roles.map((role: UserRole) => normalizeRole(role)) ?? [];

  if (!normalizedRoles.some((role) => roles.includes(role))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
