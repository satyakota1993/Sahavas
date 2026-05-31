import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { queryClient } from "@/app/query-client";
import { firebaseConfigReady } from "@/firebase/config";
import { setupAppCheck } from "@/firebase/app-check";
import { AuthProvider } from "@/providers/AuthProvider";
import { SocietyProvider } from "@/providers/SocietyProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (firebaseConfigReady) {
      setupAppCheck();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocietyProvider>{children}</SocietyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
