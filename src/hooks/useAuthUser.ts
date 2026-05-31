import { useAuth } from "@/providers/AuthProvider";

export function useAuthUser() {
  const { user, profile, status, isAuthenticated } = useAuth();

  return {
    user,
    profile,
    status,
    isAuthenticated,
  };
}
