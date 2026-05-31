import { RouterProvider } from "react-router-dom";

import { ConfigurationErrorPage } from "@/app/ConfigurationErrorPage";
import { router } from "@/app/router";
import { firebaseConfigReady, missingFirebaseEnv } from "@/firebase/config";
import { AppProviders } from "@/providers/AppProviders";

export function App() {
  if (!firebaseConfigReady) {
    return <ConfigurationErrorPage missingKeys={missingFirebaseEnv} />;
  }

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
