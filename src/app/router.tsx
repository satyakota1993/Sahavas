import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { InviteLoginPage } from "@/features/auth/pages/InviteLoginPage";
import { UnauthorizedPage } from "@/features/auth/pages/UnauthorizedPage";
import { HomeDashboardPage } from "@/features/dashboard/pages/HomeDashboardPage";
import { SocietySelectionPage } from "@/features/society-selection/pages/SocietySelectionPage";
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
        path: "/unauthorized",
        element: <UnauthorizedPage />,
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
