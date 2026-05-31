import { CheckCircle2, Mail, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/AuthProvider";
import { useSocietySession } from "@/providers/SocietyProvider";
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle as signInGoogle,
} from "@/services/auth.service";
import { acceptInvite, getInviteByToken } from "@/services/invite.service";

type EmailMode = "sign-in" | "register";

export function InviteLoginPage() {
  const { societyId = "", token = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { refreshMemberships } = useSocietySession();
  const [mode, setMode] = useState<EmailMode>("register");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const inviteQuery = useQuery({
    queryKey: ["societyInvite", societyId, token],
    queryFn: () => getInviteByToken(societyId, token),
    enabled: Boolean(societyId && token),
    retry: false,
  });

  const invite = inviteQuery.data;
  const emailMismatch =
    invite?.email &&
    user?.email &&
    invite.email.toLowerCase() !== user.email.toLowerCase();

  useEffect(() => {
    if (invite?.email) {
      setEmail(invite.email);
    }
  }, [invite?.email]);

  async function handleGoogleLogin() {
    setBusyAction("google");
    setFormError(null);

    try {
      await signInGoogle();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google login failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("email");
    setFormError(null);

    try {
      if (mode === "register") {
        await registerWithEmail({ displayName, email, password });
      } else {
        await signInWithEmail({ email, password });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Email authentication failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAcceptInvite() {
    setBusyAction("accept");
    setFormError(null);

    try {
      await acceptInvite({ societyId, token });
      await queryClient.invalidateQueries({ queryKey: ["memberships", user?.uid] });
      await refreshMemberships();
      navigate("/select-society", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Invite acceptance failed. The acceptInvite Cloud Function must be deployed.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Accept society invite</CardTitle>
        <CardDescription>
          Authenticate first, then Sahavas will create membership through the
          secure invite function.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {inviteQuery.isLoading && (
          <Alert>
            <AlertTitle>Checking invite</AlertTitle>
            <AlertDescription>Validating this link against Firestore.</AlertDescription>
          </Alert>
        )}
        {inviteQuery.error instanceof Error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Invalid invite</AlertTitle>
            <AlertDescription>{inviteQuery.error.message}</AlertDescription>
          </Alert>
        )}
        {formError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        {invite && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {invite.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              This invite is scoped to society <span className="font-mono">{societyId}</span>
              {invite.email ? ` for ${invite.email}` : ""}.
            </p>
          </div>
        )}
        {emailMismatch && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTitle>Email does not match invite</AlertTitle>
            <AlertDescription>
              You are signed in as {user?.email}. The invite is for {invite?.email}.
              The server function should reject mismatched invites.
            </AlertDescription>
          </Alert>
        )}
        {!isAuthenticated ? (
          <>
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={() => void handleGoogleLogin()}
              disabled={Boolean(busyAction) || !invite}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Continue with Google
            </Button>
            <form className="space-y-4" onSubmit={(event) => void handleEmailSubmit(event)}>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="inviteDisplayName">Full name</Label>
                  <Input
                    id="inviteDisplayName"
                    autoComplete="name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitePassword">Password</Label>
                <Input
                  id="invitePassword"
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={Boolean(busyAction) || !invite}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                {mode === "register" ? "Create account" : "Sign in"}
              </Button>
            </form>
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "sign-in" ? "register" : "sign-in")}
            >
              {mode === "sign-in" ? "Create a new account" : "Use existing account"}
            </button>
          </>
        ) : (
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={() => void handleAcceptInvite()}
            disabled={Boolean(busyAction) || !invite || Boolean(emailMismatch)}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Accept invite
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
