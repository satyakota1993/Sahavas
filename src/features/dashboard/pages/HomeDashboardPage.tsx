import { KeyRound, ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useSocietySession } from "@/providers/SocietyProvider";

export function HomeDashboardPage() {
  const { profile } = useAuth();
  const { activeMembership, roleContext, memberships } = useSocietySession();
  const capabilityCount = roleContext
    ? Object.values(roleContext.capabilities).filter(Boolean).length
    : 0;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-normal">
          {activeMembership?.society?.name ?? "Sahavas dashboard"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Sprint 1 is connected to Firebase Auth and Firestore membership
          resolution. Feature modules will mount inside this protected shell.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
              Authentication
            </CardTitle>
            <CardDescription>Firebase Authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{profile?.email ?? "Email unavailable"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile?.emailVerified ? "Email verified" : "Email verification pending"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersRound className="h-4 w-4 text-primary" aria-hidden="true" />
              Membership
            </CardTitle>
            <CardDescription>Firestore society access</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{memberships.length} active membership(s)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeMembership?.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Role context
            </CardTitle>
            <CardDescription>Resolved permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {roleContext?.primaryRole ?? "No active role"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {capabilityCount} capability flag(s) enabled
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
