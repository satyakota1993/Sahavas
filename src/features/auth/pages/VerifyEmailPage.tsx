import { useEffect, useState } from "react";
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
import { verifyEmail } from "@/services/auth.service";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!oobCode) {
        setStatus("error");
        setError("Email verification link is missing a verification code.");
        return;
      }

      try {
        await verifyEmail(oobCode);

        if (active) {
          setStatus("success");
        }
      } catch (verificationError) {
        if (active) {
          setStatus("error");
          setError(
            verificationError instanceof Error
              ? verificationError.message
              : "Email verification failed.",
          );
        }
      }
    }

    void verify();

    return () => {
      active = false;
    };
  }, [oobCode]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          Sahavas is confirming your email verification link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {status === "loading" && (
          <Alert>
            <AlertTitle>Checking link</AlertTitle>
            <AlertDescription>Please wait while Firebase verifies your email.</AlertDescription>
          </Alert>
        )}
        {status === "success" && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <AlertTitle>Email verified</AlertTitle>
            <AlertDescription>You can now login to Sahavas.</AlertDescription>
          </Alert>
        )}
        {status === "error" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Verification failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button asChild className="w-full">
          <Link to="/login">Go to Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
