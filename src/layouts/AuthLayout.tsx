import { Building2, ShieldCheck } from "lucide-react";
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(360px,0.9fr)_minmax(440px,1fr)]">
      <section className="hidden border-r border-border bg-primary px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold">Sahavas</p>
              <p className="text-sm text-white/72">Community operations platform</p>
            </div>
          </div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-normal">
            Secure society operations for residents, admins, guards, and vendors.
          </h1>
        </div>
        <div className="flex max-w-md items-start gap-3 rounded-lg border border-white/20 bg-white/10 p-4 text-sm text-white/82">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
          <p>
            Sprint 1 uses Firebase Authentication and Firestore-backed membership
            resolution. Access is decided by live society membership records.
          </p>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-4 py-10">
        <Outlet />
      </section>
    </main>
  );
}
