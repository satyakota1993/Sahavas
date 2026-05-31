import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/providers/AuthProvider";
import { getActiveMemberships } from "@/services/membership.service";
import { resolveRoleContext } from "@/services/role-resolution.service";
import type { MembershipWithSociety, RoleContext } from "@/types/membership";

const ACTIVE_SOCIETY_STORAGE_KEY = "sahavas.activeSocietyId";

interface SocietyContextValue {
  memberships: MembershipWithSociety[];
  activeSocietyId: string | null;
  activeMembership: MembershipWithSociety | null;
  roleContext: RoleContext | null;
  isLoading: boolean;
  error: string | null;
  selectSociety: (societyId: string) => void;
  refreshMemberships: () => Promise<void>;
}

const SocietyContext = createContext<SocietyContextValue | undefined>(undefined);

function readStoredSocietyId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_SOCIETY_STORAGE_KEY);
}

export function SocietyProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const queryClient = useQueryClient();
  const [activeSocietyId, setActiveSocietyId] = useState<string | null>(() =>
    readStoredSocietyId(),
  );

  const membershipsQuery = useQuery({
    queryKey: ["memberships", user?.uid],
    queryFn: () => getActiveMemberships(user?.uid ?? ""),
    enabled: status === "authenticated" && Boolean(user?.uid),
  });

  const memberships = useMemo(
    () => membershipsQuery.data ?? [],
    [membershipsQuery.data],
  );

  useEffect(() => {
    if (!membershipsQuery.isSuccess || memberships.length === 0) {
      return;
    }

    const storedSocietyIsValid = memberships.some(
      (membership) => membership.societyId === activeSocietyId,
    );

    if (!storedSocietyIsValid && memberships.length === 1) {
      setActiveSocietyId(memberships[0].societyId);
      window.localStorage.setItem(ACTIVE_SOCIETY_STORAGE_KEY, memberships[0].societyId);
    }
  }, [activeSocietyId, memberships, membershipsQuery.isSuccess]);

  const selectSociety = useCallback((societyId: string) => {
    setActiveSocietyId(societyId);
    window.localStorage.setItem(ACTIVE_SOCIETY_STORAGE_KEY, societyId);
  }, []);

  const roleContext = useMemo(() => {
    if (!user) {
      return null;
    }

    return resolveRoleContext(user.uid, memberships, activeSocietyId);
  }, [activeSocietyId, memberships, user]);

  const refreshMemberships = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["memberships", user?.uid] });
  }, [queryClient, user?.uid]);

  const value = useMemo<SocietyContextValue>(
    () => ({
      memberships,
      activeSocietyId,
      activeMembership: roleContext?.activeMembership ?? null,
      roleContext,
      isLoading: membershipsQuery.isLoading || membershipsQuery.isFetching,
      error:
        membershipsQuery.error instanceof Error
          ? membershipsQuery.error.message
          : null,
      selectSociety,
      refreshMemberships,
    }),
    [
      activeSocietyId,
      memberships,
      membershipsQuery.error,
      membershipsQuery.isFetching,
      membershipsQuery.isLoading,
      refreshMemberships,
      roleContext,
      selectSociety,
    ],
  );

  return <SocietyContext.Provider value={value}>{children}</SocietyContext.Provider>;
}

export function useSocietySession() {
  const context = useContext(SocietyContext);

  if (!context) {
    throw new Error("useSocietySession must be used within SocietyProvider.");
  }

  return context;
}
