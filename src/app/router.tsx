import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { InviteLoginPage } from "@/features/auth/pages/InviteLoginPage";
import { LegalPage } from "@/features/auth/pages/LegalPage";
import { PasswordResetPage } from "@/features/auth/pages/PasswordResetPage";
import { UnauthorizedPage } from "@/features/auth/pages/UnauthorizedPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { CommunityConfigurationPage } from "@/features/community-configuration/pages/CommunityConfigurationPage";
import { HomeDashboardPage } from "@/features/dashboard/pages/HomeDashboardPage";
import { SocietySelectionPage } from "@/features/society-selection/pages/SocietySelectionPage";
import { PermissionRoute } from "@/routes/PermissionRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { SocietyRoute } from "@/routes/SocietyRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/invite/:societyId/:token",
        element: <InviteLoginPage />,
      },
      {
        path: "/reset-password",
        element: <PasswordResetPage />,
      },
      {
        path: "/verify-email",
        element: <VerifyEmailPage />,
      },
      {
        path: "/unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        path: "/privacy",
        element: <LegalPage />,
      },
      {
        path: "/terms",
        element: <LegalPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/select-society",
        element: <SocietySelectionPage />,
      },
      {
        element: <SocietyRoute />,
        children: [
          {
            path: "/app",
            element: <AppLayout />,
            children: [
              {
                index: true,
                element: <HomeDashboardPage />,
              },
              {
                element: <PermissionRoute permission="communities.update" />,
                children: [
                  {
                    path: "configuration",
                    element: <CommunityConfigurationPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/app" replace />,
  },
]);
