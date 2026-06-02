import { ArrowLeft, Mail, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

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
import { useAuth } from "@/providers/AuthProvider";
import {
  EMAIL_NOT_VERIFIED_MESSAGE,
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle as signInGoogle,
} from "@/services/auth.service";
import { validatePassword } from "@/services/password-policy";

type AuthView = "welcome" | "email-login" | "create-account" | "forgot-password";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, error: authError } = useAuth();
  const returnTo = searchParams.get("returnTo") || "/select-society";
  const [view, setView] = useState<AuthView>("welcome");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);

  function resetMessages() {
    setFormError(null);
    setFormMessage(null);
  }

  async function handleGoogleLogin() {
    setBusyAction("google");
    resetMessages();

    try {
      await signInGoogle();
      navigate(returnTo, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google login failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("email-login");
    resetMessages();

    try {
      await signInWithEmail({ email, password });
      navigate(returnTo, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email login failed.";
      setFormError(message);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("create-account");
    resetMessages();

    const passwordResult = validatePassword(password);

    if (!passwordResult.valid) {
      setBusyAction(null);
      setFormError(passwordResult.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setBusyAction(null);
      setFormError("Password and confirm password must match.");
      return;
    }

    try {
      await registerWithEmail({ firstName, lastName, email, password });
      setView("email-login");
      setPassword("");
      setConfirmPassword("");
      setFormMessage("Account created. Please verify your email before continuing.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Account creation failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("forgot-password");
    resetMessages();

    try {
      await sendPasswordReset(email);
      setFormMessage("If this email exists, a password reset link has been sent.");
    } catch {
      setFormMessage("If this email exists, a password reset link has been sent.");
    } finally {
      setBusyAction(null);
    }
  }

  const errorMessage = formError ?? authError;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {view === "welcome" ? "Welcome to Sahavas" : "Sign in to Sahavas"}
        </CardTitle>
        <CardDescription>
          Google Sign-In is primary. Email and password is available as a
          secondary login method.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>
              {errorMessage}
              {errorMessage === EMAIL_NOT_VERIFIED_MESSAGE ? (
                <span className="mt-2 block">
                  Use the verification link in your inbox before logging in.
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        )}
        {formMessage && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>{formMessage}</AlertDescription>
          </Alert>
        )}

        {view === "welcome" && (
          <div className="space-y-3">
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
            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={() => {
                resetMessages();
                setView("email-login");
              }}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Login with Email
            </Button>
            <Button
              type="button"
              className="w-full"
              variant="secondary"
              onClick={() => {
                resetMessages();
                setView("create-account");
              }}
            >
              Create Account
            </Button>
          </div>
        )}

        {view === "email-login" && (
          <form className="space-y-4" onSubmit={(event) => void handleEmailLogin(event)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={Boolean(busyAction)}>
              Login with Email
            </Button>
          </form>
        )}

        {view === "create-account" && (
          <form className="space-y-4" onSubmit={(event) => void handleCreateAccount(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registerEmail">Email</Label>
              <Input
                id="registerEmail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registerPassword">Password</Label>
              <Input
                id="registerPassword"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={Boolean(busyAction)}>
              Create Account
            </Button>
          </form>
        )}

        {view === "forgot-password" && (
          <form className="space-y-4" onSubmit={(event) => void handleForgotPassword(event)}>
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email Address</Label>
              <Input
                id="resetEmail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={Boolean(busyAction)}>
              Send reset link
            </Button>
          </form>
        )}

        {view !== "welcome" && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              onClick={() => {
                resetMessages();
                setView("welcome");
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back
            </button>
            {view === "email-login" && (
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  resetMessages();
                  setView("forgot-password");
                }}
              >
                Forgot Password?
              </button>
            )}
          </div>
        )}

        <footer className="flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="underline-offset-4 hover:text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="underline-offset-4 hover:text-primary hover:underline">
            Terms of Service
          </Link>
        </footer>
      </CardContent>
    </Card>
  );
}
