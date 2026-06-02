import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

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
import { resetPassword, verifyPasswordReset } from "@/services/auth.service";
import { validatePassword } from "@/services/password-policy";

export function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyCode() {
      if (!oobCode) {
        setError("Password reset link is missing a verification code.");
        return;
      }

      try {
        const verifiedEmail = await verifyPasswordReset(oobCode);

        if (active) {
          setEmail(verifiedEmail);
        }
      } catch (verificationError) {
        if (active) {
          setError(
            verificationError instanceof Error
              ? verificationError.message
              : "Password reset link is invalid or expired.",
          );
        }
      }
    }

    void verifyCode();

    return () => {
      active = false;
    };
  }, [oobCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const passwordResult = validatePassword(password);

    if (!passwordResult.valid) {
      setBusy(false);
      setError(passwordResult.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setBusy(false);
      setError("Password and confirm password must match.");
      return;
    }

    try {
      await resetPassword({ oobCode, password });
      setMessage("Password updated. You can now login.");
      setPassword("");
      setConfirmPassword("");
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : "Password reset failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter a new password for {email ?? "your Sahavas account"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Unable to reset password</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {!message && (
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                disabled={!email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                disabled={!email}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !email}>
              Update Password
            </Button>
          </form>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Back to Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
