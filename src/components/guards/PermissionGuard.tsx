import type { ReactNode } from "react";

import { useSocietySession } from "@/providers/SocietyProvider";
import type { Permission } from "@/types/roles";

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { roleContext } = useSocietySession();

  if (!roleContext?.can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
