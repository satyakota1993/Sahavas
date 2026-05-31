import { Building2, LayoutDashboard, LogOut, UsersRound } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useSocietySession } from "@/providers/SocietyProvider";

const appNavigation = [
  {
    label: "Dashboard",
    to: "/app",
    icon: LayoutDashboard,
  },
];

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const { activeMembership } = useSocietySession();
  const societyName = activeMembership?.society?.name ?? "Selected society";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">Sahavas</p>
              <p className="truncate text-sm text-muted-foreground">{societyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeMembership ? (
              <Badge variant="secondary">{activeMembership.primaryRole}</Badge>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/select-society">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
                Society
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {appNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Signed in as {profile?.email ?? profile?.displayName ?? "Sahavas user"}
            </p>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
