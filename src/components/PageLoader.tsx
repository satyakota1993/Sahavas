import { Loader2 } from "lucide-react";

export function PageLoader({ message = "Loading Sahavas" }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
