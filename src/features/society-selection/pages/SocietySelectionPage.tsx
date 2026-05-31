import { Building2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageLoader } from "@/components/PageLoader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useSocietySession } from "@/providers/SocietyProvider";

export function SocietySelectionPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const {
    memberships,
    activeSocietyId,
    isLoading,
    error,
    selectSociety,
    refreshMemberships,
  } = useSocietySession();

  if (isLoading) {
    return <PageLoader message="Loading your societies" />;
  }

  function handleSelectSociety(societyId: string) {
    selectSociety(societyId);
    navigate("/app", { replace: true });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Sahavas access</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Select a society
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as {profile?.email ?? profile?.displayName ?? "Sahavas user"}.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void refreshMemberships()}>
              Refresh
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTitle>Membership lookup failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {memberships.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No active society membership found</CardTitle>
              <CardDescription>
                Ask your society admin for an invite link, then open it while signed in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => void refreshMemberships()}>
                Check again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {memberships.map((membership) => {
              const isActive = membership.societyId === activeSocietyId;

              return (
                <Card key={membership.id} className={isActive ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate">
                            {membership.society?.name ?? "Unnamed society"}
                          </CardTitle>
                          <CardDescription>
                            {membership.society?.city ?? "City not set"}
                            {membership.society?.state
                              ? `, ${membership.society.state}`
                              : ""}
                          </CardDescription>
                        </div>
                      </div>
                      {isActive && (
                        <Badge variant="success">
                          <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {membership.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                      {membership.unitIds.map((unitId) => (
                        <Badge key={unitId} variant="outline">
                          Unit {unitId}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      variant={isActive ? "secondary" : "default"}
                      onClick={() => handleSelectSociety(membership.societyId)}
                    >
                      {isActive ? "Continue" : "Use this society"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
