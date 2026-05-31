import { useMemo, useState } from "react";
import { Building2, ClipboardCheck, ExternalLink, FileText, LayoutDashboard } from "lucide-react";
import OnboardingPortal from "./App.jsx";

const tabs = [
  {
    id: "governance",
    label: "Governance Platform",
    icon: LayoutDashboard,
    subtitle: "Resident, committee, finance, notices, chat, billing, and trust-ledger modules",
  },
  {
    id: "onboarding",
    label: "Onboarding Portal",
    icon: ClipboardCheck,
    subtitle: "Society, owner, tenant, KYC, staff, vendor, move-in, and evidence gates",
  },
];

function ShellButton({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`unified-tab ${active ? "active" : ""}`}
    >
      <Icon size={17} />
      <span>{tab.label}</span>
    </button>
  );
}

export default function UnifiedApp() {
  const initialMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") === "onboarding" ? "onboarding" : "governance";
  }, []);
  const [mode, setMode] = useState(initialMode);
  const activeTab = tabs.find(tab => tab.id === mode) || tabs[0];

  const chooseMode = nextMode => {
    setMode(nextMode);
    const url = new URL(window.location.href);
    if (nextMode === "governance") url.searchParams.delete("view");
    else url.searchParams.set("view", nextMode);
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="unified-app">
      <header className="unified-header">
        <div className="unified-brand">
          <div className="unified-mark" aria-hidden="true">
            <Building2 size={18} />
          </div>
          <div>
            <div className="unified-title">Sahavas</div>
            <div className="unified-subtitle">{activeTab.subtitle}</div>
          </div>
        </div>

        <nav className="unified-tabs" aria-label="Sahavas workspace">
          {tabs.map(tab => (
            <ShellButton
              key={tab.id}
              tab={tab}
              active={mode === tab.id}
              onClick={() => chooseMode(tab.id)}
            />
          ))}
        </nav>

        <div className="unified-actions">
          <a className="unified-open" href="/docs/Sahavas_Apartment_Onboarding_SOP_1.docx" download>
            <FileText size={15} />
            <span>SOP</span>
          </a>
          <a className="unified-open" href="/sahavas_5.html" target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            <span>Open Demo</span>
          </a>
        </div>
      </header>

      <main className="unified-main">
        {mode === "governance" ? (
          <iframe
            title="Sahavas Governance Platform"
            className="governance-frame"
            src="/sahavas_5.html"
          />
        ) : (
          <section className="onboarding-pane" aria-label="Sahavas onboarding portal">
            <OnboardingPortal />
          </section>
        )}
      </main>
    </div>
  );
}
