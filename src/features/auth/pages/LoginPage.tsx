import { Mail, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle as signInGoogle,
} from "@/services/auth.service";
import { useAuth } from "@/providers/AuthProvider";

type EmailMode = "sign-in" | "register";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, error: authError } = useAuth();
  const returnTo = searchParams.get("returnTo") || "/select-society";
  const [mode, setMode] = useState<EmailMode>("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);

  async function handleGoogleLogin() {
    setBusyAction("google");
    setFormError(null);
    setFormMessage(null);

    try {
      await signInGoogle();
      navigate(returnTo, { replace: true });
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
    setFormMessage(null);

    try {
      if (mode === "register") {
        await registerWithEmail({ displayName, email, password });
        setFormMessage("Account created. Check your inbox for email verification.");
      } else {
        await signInWithEmail({ email, password });
      }

      navigate(returnTo, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Email login failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setFormError("Enter your email address before requesting a reset link.");
      return;
    }

    setBusyAction("reset");
    setFormError(null);
    setFormMessage(null);

    try {
      await sendPasswordReset(email);
      setFormMessage("Password reset email sent.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to Sahavas</CardTitle>
        <CardDescription>
          Use Google or email. Phone OTP is reserved for verification and recovery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {(formError || authError) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>{formError ?? authError}</AlertDescription>
          </Alert>
        )}
        {formMessage && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>{formMessage}</AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={() => void handleGoogleLogin()}
          disabled={Boolean(busyAction)}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Continue with Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or email</span>
          </div>
        </div>
        <form className="space-y-4" onSubmit={(event) => void handleEmailSubmit(event)}>
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Full name</Label>
              <Input
                id="displayName"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={Boolean(busyAction)}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            {mode === "register" ? "Create account" : "Sign in with email"}
          </Button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "sign-in" ? "register" : "sign-in")}
          >
            {mode === "sign-in" ? "Create an email account" : "Use existing account"}
          </button>
          <button
            type="button"
            className="font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            onClick={() => void handlePasswordReset()}
            disabled={busyAction === "reset"}
          >
            Forgot password?
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
