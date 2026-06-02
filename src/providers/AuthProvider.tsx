import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { firebaseConfigReady } from "@/firebase/config";
import { getFirebaseAuth } from "@/firebase/auth";
import { EMAIL_NOT_VERIFIED_MESSAGE, signOutUser } from "@/services/auth.service";
import { ensureUserProfile, getUserProfile } from "@/services/user-profile.service";
import type { UserProfile } from "@/types/user";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "anonymous"
  | "configuration-error";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: firebaseConfigReady ? "loading" : "configuration-error",
    user: null,
    profile: null,
    error: null,
  });

  const refreshProfile = useCallback(async () => {
    const currentUser = getFirebaseAuth().currentUser;

    if (!currentUser) {
      setState({ status: "anonymous", user: null, profile: null, error: null });
      return;
    }

    const profile = await getUserProfile(currentUser.uid);
    setState({
      status: "authenticated",
      user: currentUser,
      profile,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!firebaseConfigReady) {
      return;
    }

    let active = true;

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (!active) {
        return;
      }

      if (!firebaseUser) {
        setState({ status: "anonymous", user: null, profile: null, error: null });
        return;
      }

      try {
        const profile = await ensureUserProfile(firebaseUser);

        const requiresEmailVerification =
          firebaseUser.providerData.some(
            (provider) => provider.providerId === "password",
          ) && !firebaseUser.emailVerified;

        if (requiresEmailVerification) {
          await firebaseSignOut(getFirebaseAuth());

          if (active) {
            setState({
              status: "anonymous",
              user: null,
              profile: null,
              error: EMAIL_NOT_VERIFIED_MESSAGE,
            });
          }

          return;
        }

        if (active) {
          setState({
            status: "authenticated",
            user: firebaseUser,
            profile,
            error: null,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            status: "authenticated",
            user: firebaseUser,
            profile: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load the signed-in user profile.",
          });
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: state.status === "authenticated" && Boolean(state.user),
      refreshProfile,
      signOut: signOutUser,
    }),
    [refreshProfile, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
