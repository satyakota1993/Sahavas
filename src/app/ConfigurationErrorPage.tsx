import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfigurationErrorPage({ missingKeys }: { missingKeys: string[] }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle>Firebase environment is not configured</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTitle>Missing required values</AlertTitle>
            <AlertDescription>
              Add these keys to <code className="font-mono">.env.local</code> using the
              Firebase web app config for Sahavas.
            </AlertDescription>
          </Alert>
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {missingKeys.map((key) => (
              <li
                key={key}
                className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs"
              >
                {key}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
