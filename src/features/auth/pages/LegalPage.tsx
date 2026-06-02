import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LegalPage() {
  const location = useLocation();
  const isPrivacy = location.pathname === "/privacy";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isPrivacy ? "Privacy Policy" : "Terms of Service"}</CardTitle>
        <CardDescription>
          This document will be finalized before production launch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full" variant="outline">
          <Link to="/login">Back to Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
