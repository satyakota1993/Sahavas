import { useState, useReducer, useCallback, useEffect, useId, useRef, createContext, useContext } from "react";
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Upload, Shield, FileText, Users, Building2, UserPlus, Truck, HardHat, Home, LogOut, LogIn, ClipboardCheck, AlertTriangle, Lock, ArrowRight, X, Menu, Check, Clock, MapPin, Key, Fingerprint, BadgeCheck, ShieldCheck, BookOpen, Landmark, CreditCard, Briefcase, Hash, Phone, Camera, UserCheck, Bell, Eye, QrCode, Heart, Archive, Download, RefreshCw } from "lucide-react";

const T = {
  ink: "#1a2e1f", inkSoft: "#4a5e4f", muted: "#7a8e7f",
  green: "#1f6f54", greenD: "#174f3c", greenL: "#e8f5ee", greenAccent: "#25a06e",
  gold: "#c5972c", goldL: "#fff8ec", goldD: "#a07820",
  navy: "#1b2a4a", teal: "#1a8a7d",
  red: "#c0392b", redL: "#fdeaea",
  cream: "#f6f7f4", paper: "#ffffff", line: "#e2e8e4",
  shadow: "0 2px 16px rgba(0,0,0,.06)", shadowLg: "0 8px 32px rgba(0,0,0,.10)",
  radius: "8px", radiusSm: "8px",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
};

const STORAGE_KEY = "sahavas-onboarding-portal:v1";

const initState = {
  page: "hub", sidebarOpen: false, toasts: [],
  activeSociety: "Brigade Gardenia CHS",
  society: { step: 0, docs: {}, form: {} },
  owner: { docs: {}, form: {}, method: "invite", otpSent: false, otpVerified: false },
  tenant: {
    step: 0,
    docs: {},
    form: {},
    otpSent: false,
    otpVerified: false,
    ownerApproved: false,
    committeeApprovals: { president: true, secretary: true, treasurer: false, member1: false, member2: false },
    ownerESigned: false,
    tenantESigned: false,
    inspection: [false,false,false,false,false,false,false,false,false,false],
  },
  kyc: { aadhaarDone: false, digilockerDone: false, policeDone: false, esignDone: false },
  movein: { gates: [false,false,false,false,false,false,false] },
  moveout: { gates: [false,false,false,false,false] },
  staff: { docs: {}, form: {} },
  vendor: { docs: {}, form: {} },
  domestic: { docs: {}, form: {}, list: [
    { name: "Lakshmi B.", aadhaar: true, flats: ["A-1204","B-302"], entry: "8:15 AM", exit: null },
    { name: "Raju K.", aadhaar: true, flats: ["A-1204"], entry: "7:30 AM", exit: "11:45 AM" },
    { name: "Meena S.", aadhaar: false, flats: ["A-1204"], entry: null, exit: null },
  ]},
  family: { members: [
    { name: "Priya Menon", relation: "Spouse", phone: "+91 98765 43211", photo: true },
    { name: "Arjun Menon", relation: "Son", phone: "+91 98765 43212", photo: true },
  ]},
  vault: { entries: [
    { id: "EV-001", type: "Agreement", title: "Rental Agreement — A-1204", date: "15 Jan 2026", actor: "S. Menon", hash: "a3f7c9...e2b1", status: "Verified" },
    { id: "EV-002", type: "KYC", title: "Aadhaar KYC — Tenant R. Patel", date: "16 Jan 2026", actor: "System", hash: "b8d2e1...f4a3", status: "Verified" },
    { id: "EV-003", type: "Financial", title: "Security Deposit 1,50,000", date: "16 Jan 2026", actor: "R. Iyer (Treasurer)", hash: "c1f4a7...d3b2", status: "Verified" },
    { id: "EV-004", type: "Inspection", title: "Move-In Flat Inspection A-1204", date: "18 Jan 2026", actor: "S. Menon", hash: "d4e2b8...a1c5", status: "Verified" },
    { id: "EV-005", type: "Resolution", title: "Committee Approval Tenant R. Patel", date: "17 Jan 2026", actor: "Committee (3/5 quorum)", hash: "e5a3c1...b2d4", status: "Verified" },
  ]},
  auditLog: [],
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeDefaults(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) return Array.isArray(savedValue) ? savedValue : defaultValue;
  if (!defaultValue || typeof defaultValue !== "object") return savedValue ?? defaultValue;
  const merged = { ...defaultValue };
  if (!savedValue || typeof savedValue !== "object") return merged;
  for (const key of Object.keys(savedValue)) {
    merged[key] = key in defaultValue ? mergeDefaults(defaultValue[key], savedValue[key]) : savedValue[key];
  }
  return merged;
}

function createInitialState() {
  return deepClone(initState);
}

function loadInitialState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? mergeDefaults(createInitialState(), JSON.parse(stored)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function createId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.floor(Math.random() * 100000)}`}`;
}

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function audit(state, message, kind = "system") {
  return {
    ...state,
    auditLog: [
      {
        id: createId("audit"),
        message,
        kind,
        at: new Date().toISOString(),
      },
      ...(state.auditLog || []),
    ].slice(0, 100),
  };
}

function reducer(s, a) {
  switch (a.type) {
    case "NAV": return { ...s, page: a.page, sidebarOpen: false };
    case "SIDEBAR": return { ...s, sidebarOpen: a.open };
    case "AUDIT": return audit(s, a.message, a.kind || "system");
    case "RESET": return createInitialState();
    case "TOAST": return { ...s, toasts: [...s.toasts, { id: createId("toast"), msg: a.msg, kind: a.kind || "success" }] };
    case "DISMISS_TOAST": return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) };
    case "SET": {
      const ns = { ...s };
      const path = a.path.split(".");
      let o = ns;
      for (let i = 0; i < path.length - 1; i++) { o[path[i]] = { ...o[path[i]] }; o = o[path[i]]; }
      o[path[path.length - 1]] = a.val;
      return ns;
    }
    case "TOGGLE_DOC": {
      const ns = { ...s };
      const sec = a.section;
      ns[sec] = { ...ns[sec], docs: { ...ns[sec].docs, [a.key]: ns[sec].docs[a.key] ? null : { name: a.docName || "document.pdf", size: "2.4 MB", time: new Date().toLocaleTimeString() } } };
      return audit(ns, `${ns[sec].docs[a.key] ? "Attached" : "Removed"} ${a.docName || a.key}`, "document");
    }
    case "UPLOAD_DOC": {
      const sec = a.section;
      const file = a.file;
      const nextDocs = {
        ...s[sec].docs,
        [a.key]: file ? {
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || "application/octet-stream",
          lastModified: file.lastModified,
          time: new Date().toLocaleTimeString(),
        } : null,
      };
      const next = { ...s, [sec]: { ...s[sec], docs: nextDocs } };
      return audit(next, `${file ? "Uploaded" : "Removed"} ${a.docName || a.key}`, "document");
    }
    case "TOGGLE_GATE": {
      const sec = a.section;
      const i = a.index;
      const gates = [...s[sec].gates];
      if (i > 0 && !gates[i - 1]) return s;
      gates[i] = !gates[i];
      if (!gates[i]) for (let j = i + 1; j < gates.length; j++) gates[j] = false;
      return audit({ ...s, [sec]: { ...s[sec], gates } }, `${a.section} gate ${i + 1} ${gates[i] ? "cleared" : "reopened"}`, "gate");
    }
    default: return s;
  }
}

const Ctx = createContext();
const useApp = () => useContext(Ctx);

const SECTIONS = [
  { label: "Platform", pages: [{ id: "hub", label: "Onboarding Hub", icon: Home, desc: "Overview & status" }] },
  { label: "Layer 1 — Society", pages: [{ id: "society", label: "Society Onboarding", icon: Building2, desc: "Register your society" }] },
  { label: "Layer 2 — People", pages: [
    { id: "owner", label: "Owner Onboarding", icon: UserPlus, desc: "Flat owner registration" },
    { id: "tenant", label: "Tenant Onboarding", icon: Key, desc: "Highest-risk flow" },
    { id: "family", label: "Family / Co-Occupant", icon: Heart, desc: "Linked members" },
    { id: "kyc", label: "KYC & Verification", icon: Fingerprint, desc: "Identity verification" },
    { id: "staff", label: "Staff Onboarding", icon: HardHat, desc: "Committee-initiated" },
    { id: "vendor", label: "Vendor Onboarding", icon: Truck, desc: "Service provider reg." },
    { id: "domestic", label: "Domestic Help", icon: Users, desc: "Resident-introduced" },
  ]},
  { label: "Checklists", pages: [
    { id: "movein", label: "Move-In Checklist", icon: LogIn, desc: "7-gate entry process" },
    { id: "moveout", label: "Move-Out Checklist", icon: LogOut, desc: "Exit & settlement" },
  ]},
  { label: "Records", pages: [{ id: "vault", label: "Evidence Vault", icon: Archive, desc: "Trust Ledger & docs" }] },
];
const ALL_PAGES = SECTIONS.flatMap(s => s.pages);
const TENANT_REQUIRED_FIELDS = ["name", "society", "flat", "emergency", "emergencyPhone"];
const TENANT_REQUIRED_DOCS = ["aadhaar", "agreement", "photo"];
const AGREEMENT_FIELDS = ["rent", "deposit", "lockin", "notice", "startDate", "endDate"];
const FINANCIAL_FIELDS = ["depositPaid", "advancePaid", "payMode", "txnRef"];

function isFilled(value) {
  return String(value || "").trim().length > 0;
}

function countTruthy(values) {
  return Object.values(values || {}).filter(Boolean).length;
}

function parseAmount(value) {
  const normalized = String(value || "").replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function committeeApprovalCount(approvals) {
  return countTruthy(approvals);
}

function tenantGateStatus(state) {
  const { tenant, kyc } = state;
  const docsOk = TENANT_REQUIRED_DOCS.every(key => tenant.docs[key]);
  const registrationOk = tenant.otpVerified && TENANT_REQUIRED_FIELDS.every(key => isFilled(tenant.form[key])) && docsOk;
  const agreementOk = AGREEMENT_FIELDS.every(key => isFilled(tenant.form[key])) && tenant.ownerESigned && tenant.tenantESigned;
  const financialsFilled = FINANCIAL_FIELDS.every(key => isFilled(tenant.form[key]));
  const depositMatches = !isFilled(tenant.form.deposit) || parseAmount(tenant.form.depositPaid) === parseAmount(tenant.form.deposit);
  const rentCovered = !isFilled(tenant.form.rent) || parseAmount(tenant.form.advancePaid) >= parseAmount(tenant.form.rent);
  const financialsOk = financialsFilled && depositMatches && rentCovered;
  const inspectionOk = (tenant.inspection || []).every(Boolean);

  return [
    { ok: registrationOk, message: "Verify OTP, complete tenant details, and upload Aadhaar, agreement, and photo." },
    { ok: !!tenant.ownerApproved, message: "Record owner approval before committee review." },
    { ok: committeeApprovalCount(tenant.committeeApprovals) >= 3, message: "At least 3 of 5 committee approvals are required." },
    { ok: !!kyc.aadhaarDone, message: "Complete Aadhaar KYC before eSign." },
    { ok: agreementOk, message: "Complete agreement terms and capture both owner and tenant eSign confirmations." },
    { ok: financialsOk, message: depositMatches ? "Record deposit, advance rent, payment mode, and transaction reference." : "Security deposit paid must match the agreement deposit." },
    { ok: inspectionOk, message: "Complete every inspection photo checkpoint." },
    { ok: true, message: "All gates cleared." },
  ];
}

/* ── Shared Components ── */
const Pill = ({ children, color = T.green, bg }) => (
  <span style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,fontFamily:T.mono,letterSpacing:".5px",textTransform:"uppercase",color,background:bg||color+"18",padding:"4px 10px",borderRadius:20 }}>{children}</span>
);
const StatusDot = ({ status }) => {
  const c = { complete:T.greenAccent,pending:T.gold,blocked:T.red,active:T.teal };
  return <span style={{ width:8,height:8,borderRadius:"50%",background:c[status]||T.muted,display:"inline-block",flexShrink:0 }} />;
};
const Card = ({ children, style, onClick, hover }) => {
  const [h,setH] = useState(false);
  const interactive = typeof onClick === "function";
  const onKeyDown = event => {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event);
    }
  };
  return <div
    role={interactive ? "button" : undefined}
    tabIndex={interactive ? 0 : undefined}
    onKeyDown={onKeyDown}
    onMouseEnter={()=>setH(true)}
    onMouseLeave={()=>setH(false)}
    onClick={onClick}
    style={{ background:T.paper,border:`1px solid ${T.line}`,borderRadius:T.radius,padding:24,boxShadow:h&&hover?T.shadowLg:T.shadow,transition:"all .25s",cursor:interactive?"pointer":"default",transform:h&&hover?"translateY(-2px)":"none",...style }}>{children}</div>;
};
const PageHeader = ({ icon:Icon, title, subtitle, tag, tagColor }) => (
  <div style={{ marginBottom:32 }}>
    <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:8,flexWrap:"wrap" }}>
      {Icon && <div style={{ width:44,height:44,borderRadius:12,background:T.greenL,display:"grid",placeItems:"center",flexShrink:0 }}><Icon size={22} color={T.green} /></div>}
      <h1 style={{ fontFamily:T.serif,fontSize:"clamp(22px,3vw,30px)",fontWeight:700,color:T.ink,margin:0,lineHeight:1.2 }}>{title}</h1>
      {tag && <Pill color={tagColor}>{tag}</Pill>}
    </div>
    {subtitle && <p style={{ fontSize:14,color:T.muted,margin:0,maxWidth:640,lineHeight:1.6 }}>{subtitle}</p>}
  </div>
);
const LegalNote = ({ children }) => (
  <div style={{ display:"flex",gap:10,padding:"14px 18px",background:T.goldL,border:`1px solid ${T.gold}30`,borderLeft:`4px solid ${T.gold}`,borderRadius:T.radiusSm,marginTop:16,fontSize:13,color:T.inkSoft,lineHeight:1.6 }}>
    <Shield size={16} color={T.gold} style={{ flexShrink:0,marginTop:2 }} /><div>{children}</div>
  </div>
);
const AlertBox = ({ title, children, type="warning" }) => {
  const c = type==="danger"?T.red:type==="success"?T.greenAccent:T.gold;
  return <div style={{ padding:"18px 20px",background:c+"0a",border:`1px solid ${c}30`,borderLeft:`4px solid ${c}`,borderRadius:T.radiusSm,marginBottom:20 }}>
    <div style={{ fontFamily:T.mono,fontSize:11,fontWeight:700,color:c,letterSpacing:1,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:6 }}><AlertTriangle size={14}/> {title}</div>
    <div style={{ fontSize:13,color:T.inkSoft,lineHeight:1.6 }}>{children}</div>
  </div>;
};
const DocRow = ({ name, purpose, mandatory=true, docData, section, docKey, docName }) => {
  const { dispatch } = useApp();
  const inputRef = useRef(null);
  const inputId = useId();
  const uploaded = !!docData;
  return <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:`1px solid ${T.line}`,flexWrap:"wrap" }}>
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      aria-label={`Upload ${name}`}
      style={{ position:"absolute",opacity:0,pointerEvents:"none",width:1,height:1 }}
      onChange={event => {
        const file = event.target.files?.[0];
        if (!file) return;
        dispatch({type:"UPLOAD_DOC",section,key:docKey,docName:docName||name,file});
        dispatch({type:"TOAST",msg:`${name} uploaded`});
        event.target.value = "";
      }}
    />
    <div style={{ width:36,height:36,borderRadius:10,background:uploaded?T.greenL:T.cream,display:"grid",placeItems:"center",flexShrink:0 }}>
      {uploaded ? <CheckCircle size={18} color={T.greenAccent}/> : <FileText size={18} color={T.muted}/>}
    </div>
    <div style={{ flex:1,minWidth:160 }}>
      <div style={{ fontSize:14,fontWeight:600,color:T.ink }}>{name}</div>
      <div style={{ fontSize:12,color:T.muted }}>{purpose}</div>
      {uploaded && docData.name && <div style={{ fontSize:11,fontFamily:T.mono,color:T.teal,marginTop:3 }}>{docData.name} · {docData.size} · {docData.time}</div>}
    </div>
    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
      {mandatory ? <Pill color={T.red} bg={T.redL}>Required</Pill> : <Pill color={T.muted}>Optional</Pill>}
      <button type="button" onClick={()=>inputRef.current?.click()}
        style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:uploaded?T.greenAccent:T.green,background:uploaded?T.greenL:T.green+"12",border:`1px solid ${uploaded?T.greenAccent:T.green}30`,borderRadius:8,padding:"6px 12px",cursor:"pointer" }}>
        {uploaded?<><Upload size={13}/> Replace</>:<><Upload size={13}/> Upload</>}
      </button>
      {uploaded && <button type="button" aria-label={`Remove ${name}`} onClick={()=>dispatch({type:"UPLOAD_DOC",section,key:docKey,docName:docName||name,file:null})}
        style={{ display:"grid",placeItems:"center",width:34,height:34,color:T.red,background:T.redL,border:`1px solid ${T.red}25`,borderRadius:8,cursor:"pointer" }}>
        <X size={14}/>
      </button>}
    </div>
  </div>;
};
const StepIndicator = ({ steps, current }) => (
  <div style={{ display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:8 }}>
    {steps.map((s,i)=><div key={i} style={{ display:"flex",alignItems:"center",flexShrink:0 }}>
      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
        <div style={{ width:26,height:26,borderRadius:"50%",background:i<current?T.greenAccent:i===current?T.green:T.line,display:"grid",placeItems:"center",fontSize:11,fontWeight:700,color:i<=current?"#fff":T.muted,transition:"all .3s" }}>
          {i<current?<Check size={13}/>:i+1}
        </div>
        <span style={{ fontSize:11,fontWeight:i===current?700:500,color:i===current?T.ink:T.muted,whiteSpace:"nowrap" }}>{s}</span>
      </div>
      {i<steps.length-1 && <div style={{ width:20,height:2,background:i<current?T.greenAccent:T.line,margin:"0 4px",flexShrink:0 }}/>}
    </div>)}
  </div>
);
const GateCheck = ({ label, sublabel, enforcer, complete, locked, onToggle }) => (
  <div role={!locked ? "button" : undefined} tabIndex={!locked ? 0 : undefined} onKeyDown={event=>{ if(!locked && (event.key==="Enter" || event.key===" ")){ event.preventDefault(); onToggle?.(); } }} onClick={!locked?onToggle:undefined} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:complete?T.greenL:locked?T.cream:T.paper,border:`1px solid ${complete?T.greenAccent+"40":T.line}`,borderRadius:T.radiusSm,cursor:locked?"not-allowed":"pointer",opacity:locked?.6:1,transition:"all .2s",marginBottom:8 }}>
    <div style={{ width:26,height:26,borderRadius:"50%",border:`2px solid ${complete?T.greenAccent:locked?T.muted:T.green}`,background:complete?T.greenAccent:"transparent",display:"grid",placeItems:"center",flexShrink:0 }}>
      {complete?<Check size={13} color="#fff"/>:locked?<Lock size={11} color={T.muted}/>:null}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:14,fontWeight:600,color:complete?T.greenD:T.ink }}>{label}</div>
      <div style={{ fontSize:12,color:T.muted }}>{sublabel}</div>
    </div>
    {enforcer && <span style={{ fontSize:10,fontFamily:T.mono,color:T.teal,background:T.teal+"14",padding:"3px 8px",borderRadius:6,whiteSpace:"nowrap" }}>{enforcer}</span>}
    {complete && <Pill color={T.greenAccent}>Cleared</Pill>}
    {locked && <Pill color={T.muted}>Locked</Pill>}
  </div>
);
const FormField = ({ label, placeholder, type="text", required, value, onChange }) => {
  const id = useId();
  return <div style={{ marginBottom:16 }}>
    <label htmlFor={id} style={{ display:"block",fontSize:13,fontWeight:600,color:T.inkSoft,marginBottom:6 }}>{label} {required && <span style={{ color:T.red }}>*</span>}</label>
    <input id={id} type={type} placeholder={placeholder} aria-required={required || undefined} value={value||""} onChange={e=>onChange?.(e.target.value)}
      style={{ width:"100%",fontFamily:T.sans,fontSize:14,padding:"12px 14px",border:`1px solid ${T.line}`,borderRadius:8,outline:"none",boxSizing:"border-box",background:T.paper,transition:"border .2s" }}
      onFocus={e=>e.target.style.borderColor=T.green} onBlur={e=>e.target.style.borderColor=T.line} />
  </div>;
};
const PrimaryBtn = ({ children, onClick, disabled }) => (
  <button type="button" disabled={disabled} onClick={disabled?undefined:onClick} style={{ display:"inline-flex",alignItems:"center",gap:8,fontFamily:T.sans,fontSize:14,fontWeight:700,color:"#fff",background:disabled?T.muted:T.green,border:"none",borderRadius:10,padding:"13px 28px",cursor:disabled?"not-allowed":"pointer",transition:"all .2s",opacity:disabled?.7:1 }}>{children}</button>
);
const SecBtn = ({ children, onClick }) => (
  <button type="button" onClick={onClick} style={{ display:"inline-flex",alignItems:"center",gap:6,fontFamily:T.sans,fontSize:13,fontWeight:600,color:T.green,background:T.greenL,border:`1px solid ${T.green}25`,borderRadius:10,padding:"10px 20px",cursor:"pointer" }}>{children}</button>
);
const SectionTitle = ({ children, icon:Icon }) => (
  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16,marginTop:28 }}>
    {Icon && <Icon size={18} color={T.teal}/>}<h2 style={{ fontFamily:T.serif,fontSize:18,fontWeight:700,color:T.ink,margin:0 }}>{children}</h2>
  </div>
);
const Breadcrumb = ({ page }) => {
  const { dispatch } = useApp();
  const pg = ALL_PAGES.find(p=>p.id===page);
  const sec = SECTIONS.find(s=>s.pages.some(p=>p.id===page));
  if (page==="hub") return null;
  return <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:20,fontSize:12,color:T.muted }}>
    <button type="button" onClick={()=>dispatch({type:"NAV",page:"hub"})} style={{ cursor:"pointer",color:T.green,fontWeight:600,background:"none",border:0,padding:0,fontSize:12 }}>Hub</button>
    <ChevronRight size={12}/>{sec&&<><span>{sec.label}</span><ChevronRight size={12}/></>}
    <span style={{ color:T.ink,fontWeight:600 }}>{pg?.label}</span>
  </div>;
};
const OTPVerify = ({ sent, verified, onSend, onVerify }) => (
  <Card style={{ marginBottom:20,border:`1px solid ${verified?T.greenAccent+"40":T.line}`,background:verified?T.greenL:T.paper }}>
    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
      <div style={{ width:40,height:40,borderRadius:10,background:verified?T.greenAccent+"18":T.teal+"14",display:"grid",placeItems:"center" }}>
        {verified?<BadgeCheck size={20} color={T.greenAccent}/>:<Phone size={20} color={T.teal}/>}
      </div>
      <div><div style={{ fontSize:15,fontWeight:700,color:T.ink,fontFamily:T.serif }}>Mobile OTP Verification</div>
        <div style={{ fontSize:12,color:T.muted }}>Primary auth — passwordless, OTP-first</div></div>
      {verified && <Pill color={T.greenAccent}>Verified</Pill>}
    </div>
    {!sent&&!verified&&<div style={{ display:"flex",gap:10,alignItems:"flex-end" }}><div style={{ flex:1 }}><FormField label="Mobile Number" placeholder="+91 98765 43210" type="tel" required/></div><PrimaryBtn onClick={onSend}>Send OTP</PrimaryBtn></div>}
    {sent&&!verified&&<div style={{ display:"flex",gap:10,alignItems:"flex-end" }}><div style={{ flex:1 }}><FormField label="Enter 6-digit OTP" placeholder="------" required/></div><PrimaryBtn onClick={onVerify}>Verify</PrimaryBtn></div>}
    {verified&&<div style={{ fontSize:13,color:T.greenD,fontWeight:600 }}>Mobile number verified. Identity confirmed.</div>}
  </Card>
);

/* ══ HUB ══ */
function HubPage() {
  const { state, dispatch } = useApp();
  const nav = id => dispatch({type:"NAV",page:id});
  const socD = Object.values(state.society.docs).filter(Boolean).length;
  const ownD = Object.values(state.owner.docs).filter(Boolean).length;
  const miP = Math.round((state.movein.gates.filter(Boolean).length/7)*100);
  const moP = Math.round((state.moveout.gates.filter(Boolean).length/5)*100);
  const flows = [
    { id:"society",icon:Building2,title:"Society Onboarding",desc:"Register your apartment community. Upload documents, configure structure.",status:socD>0?"active":"pending",progress:Math.round((socD/7)*100),color:T.navy },
    { id:"owner",icon:UserPlus,title:"Owner Onboarding",desc:"Flat owners register with ownership proof for voting rights.",status:ownD>0?"active":"pending",progress:Math.round((ownD/4)*100),color:T.green },
    { id:"tenant",icon:Key,title:"Tenant Onboarding",desc:"Highest-risk flow. Full KYC, eSigned agreement, deposit required.",status:state.tenant.step>0?"active":"pending",progress:Math.round((state.tenant.step/8)*100),color:T.red },
    { id:"family",icon:Heart,title:"Family / Co-Occupant",desc:"Link family with lightweight verification. Limited permissions.",status:state.family.members.length>0?"active":"pending",progress:state.family.members.length>0?60:0,color:T.teal },
    { id:"kyc",icon:Fingerprint,title:"KYC & Verification",desc:"Aadhaar/DigiLocker identity verification. Mandatory for tenants, staff.",status:state.kyc.aadhaarDone?"active":"pending",progress:[state.kyc.aadhaarDone,state.kyc.digilockerDone,state.kyc.policeDone,state.kyc.esignDone].filter(Boolean).length*25,color:T.teal },
    { id:"movein",icon:LogIn,title:"Move-In Checklist",desc:"7-gate sequential checklist. System-enforced.",status:miP>0?"active":"blocked",progress:miP,color:T.gold },
    { id:"moveout",icon:LogOut,title:"Move-Out Checklist",desc:"Rent, inspection, deposit, exit certificate.",status:moP>0?"active":"blocked",progress:moP,color:T.goldD },
    { id:"staff",icon:HardHat,title:"Staff Onboarding",desc:"Committee-initiated. Never self-serve.",status:"pending",progress:Math.round((Object.values(state.staff.docs).filter(Boolean).length/4)*100),color:T.greenD },
    { id:"vendor",icon:Truck,title:"Vendor Onboarding",desc:"GST/PAN verified. Committee-approved.",status:"pending",progress:Math.round((Object.values(state.vendor.docs).filter(Boolean).length/5)*100),color:T.inkSoft },
    { id:"domestic",icon:Users,title:"Domestic Help",desc:"Aadhaar-mandatory. Resident-introduced.",status:"active",progress:70,color:T.navy },
    { id:"vault",icon:Archive,title:"Evidence Vault",desc:"Immutable audit trail. Court-ready evidence.",status:"active",progress:100,color:T.greenD },
  ];
  return <div>
    <PageHeader icon={Home} title="Apartment Onboarding Hub" subtitle={`End-to-end onboarding for ${state.activeSociety}. Every step is a gate.`} tag="LIVE" tagColor={T.greenAccent}/>
    <AlertBox title="CEO MANDATE">No resident, tenant, staff, or vendor gains access until every verification gate is cleared. Enforced in code.</AlertBox>
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16 }}>
      {flows.map(f=><Card key={f.id} hover onClick={()=>nav(f.id)} style={{ position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:f.color }}/>
        <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:12 }}>
          <div style={{ width:38,height:38,borderRadius:10,background:f.color+"14",display:"grid",placeItems:"center",flexShrink:0 }}><f.icon size={18} color={f.color}/></div>
          <div><div style={{ fontSize:14,fontWeight:700,color:T.ink,fontFamily:T.serif }}>{f.title}</div>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:3 }}><StatusDot status={f.status}/><span style={{ fontSize:10,fontFamily:T.mono,textTransform:"uppercase",letterSpacing:".5px",color:T.muted }}>{f.status}</span></div></div>
        </div>
        <p style={{ fontSize:12,color:T.muted,lineHeight:1.5,margin:"0 0 12px" }}>{f.desc}</p>
        <div style={{ height:4,borderRadius:2,background:T.line,overflow:"hidden" }}><div style={{ height:"100%",width:`${f.progress}%`,background:f.color,borderRadius:2,transition:"width .5s" }}/></div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10 }}>
          <span style={{ fontSize:10,fontFamily:T.mono,color:T.muted }}>{f.progress}%</span>
          <span style={{ fontSize:12,fontWeight:600,color:T.green,display:"flex",alignItems:"center",gap:4 }}>Open <ChevronRight size={14}/></span>
        </div>
      </Card>)}
    </div>
    <LegalNote><strong>Core Rule:</strong> If it is not recorded in Sahavas, it did not happen.</LegalNote>
  </div>;
}

/* ══ SOCIETY ══ */
function SocietyPage() {
  const { state, dispatch } = useApp();
  const { step, docs, form } = state.society;
  const setStep = v => dispatch({type:"SET",path:"society.step",val:v});
  const setField = (k,v) => dispatch({type:"SET",path:"society.form",val:{...form,[k]:v}});
  const steps = ["Application","Documents","Structure","Fund Setup","Review"];
  const reqDocs = [
    {key:"reg",name:"Society Registration Certificate",purpose:"Legally registered body"},
    {key:"pan",name:"Society PAN Card",purpose:"Financial/tax identity"},
    {key:"bylaws",name:"Registered Bylaws",purpose:"Governance rules"},
    {key:"bank",name:"Bank Account + Cancelled Cheque",purpose:"Treasury setup"},
    {key:"committee",name:"Committee List (with roles)",purpose:"Role assignment"},
    {key:"address",name:"Address Proof / Property Tax",purpose:"Location verification"},
    {key:"auth",name:"Authorisation Letter",purpose:"Committee resolution"},
  ];
  const docCount = Object.values(docs).filter(Boolean).length;
  const canNext = step===0?(form.name&&form.regNo):step===1?docCount===7:true;
  return <div>
    <Breadcrumb page="society"/>
    <PageHeader icon={Building2} title="Society Onboarding" subtitle="Register your apartment community as a legal entity." tag="LAYER 1" tagColor={T.navy}/>
    <Card style={{ marginBottom:24,padding:"18px 22px",overflowX:"auto" }}><StepIndicator steps={steps} current={step}/></Card>
    {step===0&&<Card><SectionTitle icon={Landmark}>Society Information</SectionTitle>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"0 20px" }}>
        <FormField label="Society Name" placeholder="e.g. Brigade Gardenia CHS" required value={form.name} onChange={v=>setField("name",v)}/>
        <FormField label="Registration Number" placeholder="MH/HSG/TC/12345" required value={form.regNo} onChange={v=>setField("regNo",v)}/>
        <FormField label="Registration Date" type="date" required value={form.regDate} onChange={v=>setField("regDate",v)}/>
        <FormField label="Address" placeholder="Full address" required value={form.addr} onChange={v=>setField("addr",v)}/>
        <FormField label="PIN Code" placeholder="560001" required value={form.pin} onChange={v=>setField("pin",v)}/>
        <FormField label="Total Flats" placeholder="240" type="number" required value={form.flats} onChange={v=>setField("flats",v)}/>
      </div></Card>}
    {step===1&&<Card><SectionTitle icon={FileText}>Documents ({docCount}/7)</SectionTitle>
      <AlertBox title="ALL 7 REQUIRED">Activation cannot proceed until all documents are uploaded and verified.</AlertBox>
      {reqDocs.map(d=><DocRow key={d.key} name={d.name} purpose={d.purpose} docData={docs[d.key]} section="society" docKey={d.key}/>)}</Card>}
    {step===2&&<Card><SectionTitle icon={Building2}>Structure Setup</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:16 }}>Configure towers, floors, flats, parking, and shared assets.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:16 }}>
        {[{i:Building2,l:"Towers/Wings",d:"A-B-C"},{i:Hash,l:"Floors",d:"G+14"},{i:Home,l:"Flats/Floor",d:"4 per floor"},{i:MapPin,l:"Parking",d:"Covered/Open/Stilt"}].map((s,j)=>
          <div key={j} style={{ padding:16,background:T.cream,borderRadius:T.radiusSm,border:`1px dashed ${T.line}` }}>
            <s.i size={18} color={T.teal}/><div style={{ fontSize:13,fontWeight:700,color:T.ink,marginTop:8 }}>{s.l}</div><div style={{ fontSize:11,color:T.muted }}>{s.d}</div></div>)}
      </div>
      <SectionTitle icon={ClipboardCheck}>Shared Assets</SectionTitle>
      <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
        {["Lifts","DG Set","Water Tanks","STP/WTP","Clubhouse","Gym","Pool","Community Hall","Play Area"].map(a=>
          <label key={a} style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.inkSoft,padding:"7px 12px",background:T.cream,borderRadius:8,cursor:"pointer",border:`1px solid ${T.line}` }}>
            <input type="checkbox" style={{ accentColor:T.green }}/> {a}</label>)}
      </div></Card>}
    {step===3&&<Card><SectionTitle icon={CreditCard}>Fund Configuration</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:16 }}>Ring-fenced funds. No cross-transfer without dual-signatory approval.</p>
      {["Corpus Fund","Sinking Fund","Welfare Fund","Festival Fund"].map((f,i)=>
        <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:14,borderBottom:`1px solid ${T.line}` }}>
          <div style={{ width:34,height:34,borderRadius:8,background:[T.navy,T.teal,T.green,T.gold][i]+"18",display:"grid",placeItems:"center" }}><CreditCard size={15} color={[T.navy,T.teal,T.green,T.gold][i]}/></div>
          <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600,color:T.ink }}>{f}</div><div style={{ fontSize:11,color:T.muted }}>Ring-fenced, auditable, dual-signatory</div></div>
          <Pill color={T.teal}>Configure</Pill></div>)}</Card>}
    {step===4&&<Card><SectionTitle icon={ClipboardCheck}>Review & Submit</SectionTitle>
      <AlertBox title="APPROVAL WORKFLOW" type="success">Application → Document Review → Compliance → Activation.</AlertBox>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:14 }}>
        {[`Info: ${form.name?"OK":"Missing"}`,`Docs: ${docCount}/7`,"Structure: OK","Funds: OK"].map((c,i)=>
          <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:12,background:T.greenL,borderRadius:T.radiusSm,border:`1px solid ${T.greenAccent}30` }}>
            <CheckCircle size={16} color={T.greenAccent}/><span style={{ fontSize:12,fontWeight:600,color:T.greenD }}>{c}</span></div>)}
      </div></Card>}
    <div style={{ display:"flex",justifyContent:"space-between",marginTop:24,flexWrap:"wrap",gap:10 }}>
      <SecBtn onClick={()=>setStep(Math.max(0,step-1))}><ChevronLeft size={16}/> Previous</SecBtn>
      {step<4?<PrimaryBtn onClick={()=>{if(canNext)setStep(step+1);else dispatch({type:"TOAST",msg:"Complete required fields first",kind:"error"});}} disabled={!canNext}>Next <ChevronRight size={16}/></PrimaryBtn>
        :<PrimaryBtn onClick={()=>dispatch({type:"TOAST",msg:"Society submitted for approval!"})}>Submit <ArrowRight size={16}/></PrimaryBtn>}
    </div>
  </div>;
}

/* ══ OWNER ══ */
function OwnerPage() {
  const { state, dispatch } = useApp();
  const { docs, form, method, otpSent, otpVerified } = state.owner;
  const setField = (k,v) => dispatch({type:"SET",path:"owner.form",val:{...form,[k]:v}});
  return <div>
    <Breadcrumb page="owner"/>
    <PageHeader icon={UserPlus} title="Owner Onboarding" subtitle="Register as a flat owner for voting rights, financial transparency, and tenant approval."/>
    <div style={{ display:"flex",gap:12,marginBottom:20,flexWrap:"wrap" }}>
      {[{id:"self",label:"Self Registration",desc:"Search by name/PIN"},{id:"invite",label:"Invite-Based (Preferred)",desc:"Use invite code or QR"}].map(m=>
        <button type="button" key={m.id} aria-pressed={method===m.id} onClick={()=>dispatch({type:"SET",path:"owner.method",val:m.id})} style={{ flex:"1 1 220px",padding:16,borderRadius:T.radiusSm,border:`2px solid ${method===m.id?T.green:T.line}`,background:method===m.id?T.greenL:T.paper,cursor:"pointer",textAlign:"left" }}>
          <div style={{ fontSize:14,fontWeight:700,color:T.ink }}>{m.label}</div><div style={{ fontSize:12,color:T.muted,marginTop:2 }}>{m.desc}</div></button>)}
    </div>
    {method==="invite"&&<Card style={{ marginBottom:20 }}><SectionTitle icon={QrCode}>Enter Invite Code</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:14 }}>Invite codes are pre-linked to your flat. Enter the code from SMS/WhatsApp/email.</p>
      <div style={{ display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap" }}>
        <div style={{ flex:1,minWidth:200 }}><FormField label="Invite Code" placeholder="BG-A1204-XXXX" required value={form.inviteCode} onChange={v=>setField("inviteCode",v)}/></div>
        <PrimaryBtn onClick={()=>{setField("society","Brigade Gardenia CHS");setField("tower","Tower A");setField("flat","A-1204");dispatch({type:"TOAST",msg:"Invite verified! Flat pre-filled."});}}>Verify Code</PrimaryBtn>
      </div></Card>}
    <OTPVerify sent={otpSent} verified={otpVerified}
      onSend={()=>{dispatch({type:"SET",path:"owner.otpSent",val:true});dispatch({type:"TOAST",msg:"OTP sent"});}}
      onVerify={()=>{dispatch({type:"SET",path:"owner.otpVerified",val:true});dispatch({type:"TOAST",msg:"Mobile verified!"});}}/>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={Users}>Owner Details</SectionTitle>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"0 20px" }}>
        <FormField label="Full Name" placeholder="As per Aadhaar" required value={form.name} onChange={v=>setField("name",v)}/>
        <FormField label="Email" placeholder="email@example.com" value={form.email} onChange={v=>setField("email",v)}/>
        <FormField label="Society" placeholder={method==="invite"?"Pre-filled":"Search by name/PIN"} required value={form.society} onChange={v=>setField("society",v)}/>
        <FormField label="Tower/Wing" placeholder="Tower A" required value={form.tower} onChange={v=>setField("tower",v)}/>
        <FormField label="Flat Number" placeholder="A-1204" required value={form.flat} onChange={v=>setField("flat",v)}/>
      </div></Card>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={FileText}>Required Documents</SectionTitle>
      <DocRow name="Aadhaar Card" purpose="Identity via UIDAI/DigiLocker" docData={docs.aadhaar} section="owner" docKey="aadhaar"/>
      <DocRow name="PAN Card" purpose="Tax compliance" docData={docs.pan} section="owner" docKey="pan"/>
      <DocRow name="Sale Deed / Allotment Letter" purpose="Proof of ownership" docData={docs.deed} section="owner" docKey="deed"/>
      <DocRow name="Passport-Size Photo" purpose="Security identification" docData={docs.photo} section="owner" docKey="photo"/>
      <DocRow name="Family / Co-Owner Details" purpose="Co-ownership records" mandatory={false} docData={docs.family} section="owner" docKey="family"/></Card>
    <Card><SectionTitle icon={ShieldCheck}>Approval Flow</SectionTitle>
      <div style={{ display:"flex",alignItems:"center",gap:0,flexWrap:"wrap" }}>
        {["OTP Verified","Documents Uploaded","Committee Verifies","Owner Activated"].map((s,i)=>{
          const done = i===0?otpVerified:i===1?Object.values(docs).filter(Boolean).length>=4:false;
          return <div key={i} style={{ display:"flex",alignItems:"center" }}>
            <div style={{ padding:"8px 14px",background:done?T.greenL:T.cream,borderRadius:8,fontSize:12,fontWeight:600,color:done?T.greenD:T.ink,whiteSpace:"nowrap" }}>{done?"✓ ":""}{s}</div>
            {i<3&&<ChevronRight size={14} color={T.muted} style={{ margin:"0 3px",flexShrink:0 }}/>}</div>;})}
      </div>
      <LegalNote>Upon approval: voting rights, Owner Dashboard, tenant approval powers, financial transparency.</LegalNote></Card>
    <div style={{ display:"flex",justifyContent:"flex-end",marginTop:24 }}>
      <PrimaryBtn disabled={!otpVerified||Object.values(docs).filter(Boolean).length<4} onClick={()=>dispatch({type:"TOAST",msg:"Submitted for committee approval!"})}>Submit <ArrowRight size={16}/></PrimaryBtn></div>
  </div>;
}

/* ══ TENANT — All 8 steps ══ */
function TenantPage() {
  const { state, dispatch } = useApp();
  const { step, docs, form, otpSent, otpVerified, ownerApproved, committeeApprovals, ownerESigned, tenantESigned, inspection } = state.tenant;
  const setStep = v => dispatch({type:"SET",path:"tenant.step",val:v});
  const setField = (k,v) => dispatch({type:"SET",path:"tenant.form",val:{...form,[k]:v}});
  const steps = ["Register","Owner Appr.","Committee","KYC","eSign","Financials","Inspect","Activate"];
  const gateStatus = tenantGateStatus(state);
  const currentGate = gateStatus[step];
  const committeeRoles = [
    ["president", "President"],
    ["secretary", "Secretary"],
    ["treasurer", "Treasurer"],
    ["member1", "Member 1"],
    ["member2", "Member 2"],
  ];
  const inspectionAreas = ["Living Room","Kitchen","Bedroom 1","Bedroom 2","Bathrooms","Balcony","Electrical","Plumbing","Walls/Flooring","Keys/Locks"];
  const advanceTenant = () => {
    if (step >= 7) {
      dispatch({type:"TOAST",msg:"Tenant fully activated!"});
      return;
    }
    if (!currentGate.ok) {
      dispatch({type:"TOAST",msg:currentGate.message,kind:"error"});
      return;
    }
    setStep(Math.min(7,step+1));
  };
  return <div>
    <Breadcrumb page="tenant"/>
    <PageHeader icon={Key} title="Tenant Onboarding" subtitle="Highest-risk flow. Every gate mandatory." tag="STRICT" tagColor={T.red}/>
    <AlertBox title="CEO DIRECTIVE" type="danger">Access ONLY after all 8 steps clear. No override.</AlertBox>
    <Card style={{ marginBottom:24,padding:"16px 20px",overflowX:"auto" }}><StepIndicator steps={steps} current={step}/></Card>
    {step===0&&<div>
      <OTPVerify sent={otpSent} verified={otpVerified}
        onSend={()=>{dispatch({type:"SET",path:"tenant.otpSent",val:true});dispatch({type:"TOAST",msg:"OTP sent"});}}
        onVerify={()=>{dispatch({type:"SET",path:"tenant.otpVerified",val:true});dispatch({type:"TOAST",msg:"Verified!"});}}/>
      <Card><SectionTitle icon={UserPlus}>Registration</SectionTitle>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"0 20px" }}>
          <FormField label="Full Name" placeholder="As per Aadhaar" required value={form.name} onChange={v=>setField("name",v)}/>
          <FormField label="Society" placeholder="Search" required value={form.society} onChange={v=>setField("society",v)}/>
          <FormField label="Flat" placeholder="A-1204" required value={form.flat} onChange={v=>setField("flat",v)}/>
          <FormField label="Emergency Contact" placeholder="Name" required value={form.emergency} onChange={v=>setField("emergency",v)}/>
          <FormField label="Emergency Phone" placeholder="+91" type="tel" required value={form.emergencyPhone} onChange={v=>setField("emergencyPhone",v)}/>
        </div>
        <SectionTitle icon={FileText}>Documents</SectionTitle>
        <DocRow name="Aadhaar (DigiLocker)" purpose="Identity — mandatory" docData={docs.aadhaar} section="tenant" docKey="aadhaar"/>
        <DocRow name="Rental Agreement (eSigned)" purpose="No agreement = no access" docData={docs.agreement} section="tenant" docKey="agreement"/>
        <DocRow name="Photo" purpose="Security ID" docData={docs.photo} section="tenant" docKey="photo"/>
        <DocRow name="Police Verification" purpose="Background check" mandatory={false} docData={docs.police} section="tenant" docKey="police"/>
      </Card></div>}
    {step===1&&<Card><div style={{ textAlign:"center",padding:"30px 20px" }}>
      <div style={{ width:56,height:56,borderRadius:"50%",background:T.goldL,display:"grid",placeItems:"center",margin:"0 auto 14px" }}><Clock size={26} color={T.gold}/></div>
      <h3 style={{ fontFamily:T.serif,fontSize:20,color:T.ink,marginBottom:8 }}>Awaiting Owner Approval</h3>
      <p style={{ fontSize:13,color:T.muted,maxWidth:420,margin:"0 auto 20px" }}>Owner of Flat {form.flat||"A-1204"} must review and approve your application.</p>
      <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"10px 18px",background:T.cream,borderRadius:8,fontSize:13,color:T.inkSoft }}><UserCheck size={16} color={T.gold}/> Owner notified via SMS & push</div>
      <div style={{ marginTop:18 }}>
        <PrimaryBtn disabled={ownerApproved} onClick={()=>{dispatch({type:"SET",path:"tenant.ownerApproved",val:true});dispatch({type:"AUDIT",message:"Owner approval recorded for tenant onboarding",kind:"approval"});dispatch({type:"TOAST",msg:"Owner approval recorded"});}}>
          {ownerApproved ? "Owner Approved" : "Record Owner Approval"} <Check size={16}/>
        </PrimaryBtn>
      </div>
    </div><LegalNote>Owner approval is logged with timestamp and identity in the Trust Ledger.</LegalNote></Card>}
    {step===2&&<Card><div style={{ textAlign:"center",padding:"30px 20px" }}>
      <div style={{ width:56,height:56,borderRadius:"50%",background:T.goldL,display:"grid",placeItems:"center",margin:"0 auto 14px" }}><Users size={26} color={T.gold}/></div>
      <h3 style={{ fontFamily:T.serif,fontSize:20,color:T.ink,marginBottom:8 }}>Committee Approval</h3>
      <p style={{ fontSize:13,color:T.muted,maxWidth:420,margin:"0 auto 16px" }}>Quorum-based: minimum 3 of 5 members must approve.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,maxWidth:480,margin:"0 auto" }}>
        {committeeRoles.map(([key,label])=>{
          const approved = !!committeeApprovals[key];
          return <button type="button" key={key} onClick={()=>{dispatch({type:"SET",path:`tenant.committeeApprovals.${key}`,val:!approved});dispatch({type:"AUDIT",message:`Committee ${label} ${approved ? "revoked" : "approved"} tenant onboarding`,kind:"approval"});}}
            style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,padding:8,borderRadius:8,background:approved?T.greenL:T.cream,border:`1px solid ${approved?T.greenAccent+"30":T.line}`,fontSize:11,fontWeight:600,color:approved?T.greenD:T.muted,textAlign:"center",cursor:"pointer" }}>
            {approved ? <Check size={12}/> : <Clock size={12}/>} {label}
          </button>;
        })}
      </div>
      <div style={{ marginTop:12,fontSize:12,color:committeeApprovalCount(committeeApprovals)>=3?T.greenD:T.muted }}>{committeeApprovalCount(committeeApprovals)}/5 approved - Need 3/5</div>
    </div></Card>}
    {step===3&&<Card><SectionTitle icon={Fingerprint}>Aadhaar KYC</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:16 }}>Verify via DigiLocker or UIDAI. Happens on your device — Sahavas never stores your Aadhaar.</p>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
        {[{icon:Fingerprint,label:"DigiLocker",color:T.teal},{icon:ShieldCheck,label:"UIDAI Direct",color:T.navy}].map((m,i)=>
          <div key={i} style={{ padding:20,background:m.color+"0a",borderRadius:T.radiusSm,border:`1px solid ${m.color}30`,textAlign:"center" }}>
            <m.icon size={28} color={m.color}/><div style={{ fontSize:14,fontWeight:700,color:T.ink,marginTop:10 }}>{m.label}</div>
            <div style={{ marginTop:12 }}><PrimaryBtn onClick={()=>{dispatch({type:"SET",path:"kyc.aadhaarDone",val:true});dispatch({type:"TOAST",msg:"KYC completed!"});}}>Verify</PrimaryBtn></div></div>)}
      </div></Card>}
    {step===4&&<Card><SectionTitle icon={FileText}>Rental Agreement — eSign</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:16 }}>Both parties Aadhaar-eSign these terms:</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"0 20px" }}>
        <FormField label="Monthly Rent" placeholder="25,000" type="number" required value={form.rent} onChange={v=>setField("rent",v)}/>
        <FormField label="Security Deposit" placeholder="1,50,000" type="number" required value={form.deposit} onChange={v=>setField("deposit",v)}/>
        <FormField label="Lock-In Period" placeholder="11 months" required value={form.lockin} onChange={v=>setField("lockin",v)}/>
        <FormField label="Notice Period" placeholder="2 months" required value={form.notice} onChange={v=>setField("notice",v)}/>
        <FormField label="Start Date" type="date" required value={form.startDate} onChange={v=>setField("startDate",v)}/>
        <FormField label="End Date" type="date" required value={form.endDate} onChange={v=>setField("endDate",v)}/>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16 }}>
        {[["ownerESigned","Owner eSign",ownerESigned,T.green],["tenantESigned","Tenant eSign",tenantESigned,T.teal]].map(([key,label,done,color])=>
          <button type="button" key={key} onClick={()=>{dispatch({type:"SET",path:`tenant.${key}`,val:!done});dispatch({type:"AUDIT",message:`${label} ${done ? "reopened" : "captured"}`,kind:"esign"});dispatch({type:"TOAST",msg:`${label} ${done ? "reopened" : "captured"}`});}}
            style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:14,borderRadius:8,border:`1px dashed ${done?T.greenAccent:color}`,background:done?T.greenL:T.paper,textAlign:"center",cursor:"pointer" }}>
            {done ? <CheckCircle size={16} color={T.greenAccent}/> : <FileText size={16} color={color}/>}
            <span style={{ fontSize:12,fontWeight:600,color:done?T.greenD:color }}>{done ? `${label} captured` : label}</span>
          </button>)}
      </div>
      <LegalNote>Legally binding under IT Act 2000. Stored permanently in Evidence Vault.</LegalNote></Card>}
    {step===5&&<Card><SectionTitle icon={CreditCard}>Financial Recording</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:16 }}>Amounts must match eSigned agreement terms.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"0 20px" }}>
        <FormField label="Security Deposit Paid" placeholder="Amount" type="number" required value={form.depositPaid} onChange={v=>setField("depositPaid",v)}/>
        <FormField label="Advance Rent" placeholder="First month" type="number" required value={form.advancePaid} onChange={v=>setField("advancePaid",v)}/>
        <FormField label="Payment Mode" placeholder="UPI/NEFT/Cheque" required value={form.payMode} onChange={v=>setField("payMode",v)}/>
        <FormField label="Transaction Ref" placeholder="UTR/Cheque No" required value={form.txnRef} onChange={v=>setField("txnRef",v)}/>
      </div>
      <AlertBox title="AMOUNT VERIFICATION">System cross-verifies against eSigned agreement. Mismatches flagged for Treasurer review.</AlertBox></Card>}
    {step===6&&<Card><SectionTitle icon={Camera}>Move-In Flat Inspection</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:16 }}>Timestamped, geo-tagged photos become the baseline for move-out comparison.</p>
      {inspectionAreas.map((area,i)=>
        <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.line}` }}>
          {inspection[i] ? <CheckCircle size={14} color={T.greenAccent}/> : <Circle size={14} color={T.line}/>}<span style={{ flex:1,fontSize:13,color:T.ink }}>{area}</span>
          <button type="button" onClick={()=>{
            const nextInspection = [...inspection];
            nextInspection[i] = !nextInspection[i];
            dispatch({type:"SET",path:"tenant.inspection",val:nextInspection});
            dispatch({type:"AUDIT",message:`Inspection photos ${nextInspection[i] ? "captured" : "reopened"} for ${area}`,kind:"inspection"});
          }} style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,color:inspection[i]?T.greenD:T.teal,background:inspection[i]?T.greenL:T.teal+"12",border:`1px solid ${inspection[i]?T.greenAccent:T.teal}25`,borderRadius:6,padding:"5px 10px",cursor:"pointer" }}>
            <Camera size={12}/> {inspection[i] ? "Captured" : "Photos"}
          </button></div>)}
      <LegalNote>Photos stored in Evidence Vault. Legal baseline for deposit settlement.</LegalNote></Card>}
    {step===7&&<Card><div style={{ textAlign:"center",padding:"40px 20px" }}>
      <div style={{ width:64,height:64,borderRadius:"50%",background:T.greenAccent+"18",display:"grid",placeItems:"center",margin:"0 auto 16px" }}><BadgeCheck size={32} color={T.greenAccent}/></div>
      <h3 style={{ fontFamily:T.serif,fontSize:22,color:T.greenD,marginBottom:8 }}>Access Activated</h3>
      <p style={{ fontSize:14,color:T.muted,maxWidth:440,margin:"0 auto 20px" }}>All 8 gates cleared. Full platform access live.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,maxWidth:500,margin:"0 auto" }}>
        {["Gate Entry","App Access","Bookings","Notices","Complaints","Community"].map((f,i)=>
          <div key={i} style={{ display:"flex",alignItems:"center",gap:6,padding:10,background:T.greenL,borderRadius:8,fontSize:12,fontWeight:600,color:T.greenD }}><CheckCircle size={14} color={T.greenAccent}/> {f}</div>)}
      </div></div></Card>}
    {step<7&&<AlertBox title={currentGate.ok?"GATE READY":"GATE BLOCKED"} type={currentGate.ok?"success":"warning"}>{currentGate.ok?"This gate satisfies the SOP requirements and can advance.":currentGate.message}</AlertBox>}
    <AlertBox title="HARD RULE" type="danger">No KYC + No eSign + No deposit = No access. Enforced in code.</AlertBox>
    <div style={{ display:"flex",justifyContent:"space-between",marginTop:24,flexWrap:"wrap",gap:10 }}>
      <SecBtn onClick={()=>setStep(Math.max(0,step-1))}><ChevronLeft size={16}/> Previous</SecBtn>
      <PrimaryBtn onClick={advanceTenant}>{step<7?"Next Gate":"Complete"} <ChevronRight size={16}/></PrimaryBtn>
    </div>
  </div>;
}

/* ══ FAMILY — New ══ */
function FamilyPage() {
  const { state, dispatch } = useApp();
  return <div>
    <Breadcrumb page="family"/>
    <PageHeader icon={Heart} title="Family / Co-Occupant" subtitle="Link family members with lightweight verification. Limited permissions."/>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={Users}>Registered Members</SectionTitle>
      {state.family.members.map((m,i)=>
        <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:`1px solid ${T.line}` }}>
          <div style={{ width:40,height:40,borderRadius:"50%",background:T.teal+"18",display:"grid",placeItems:"center",fontFamily:T.serif,fontSize:16,fontWeight:700,color:T.teal }}>{m.name[0]}</div>
          <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600,color:T.ink }}>{m.name}</div><div style={{ fontSize:12,color:T.muted }}>{m.relation} · {m.phone}</div></div>
          <Pill color={T.teal}>Active</Pill></div>)}</Card>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={UserPlus}>Add Family Member</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:14 }}>Limited permissions: bookings, view notices, community feed. Cannot vote, approve tenants, or access finances.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"0 20px" }}>
        <FormField label="Full Name" placeholder="Name" required/><FormField label="Relationship" placeholder="Spouse/Son/Daughter/Parent" required/>
        <FormField label="Mobile" placeholder="+91" type="tel" required/><FormField label="Date of Birth" type="date"/>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:14,padding:14,background:T.cream,borderRadius:T.radiusSm,marginBottom:14 }}>
        <Camera size={18} color={T.teal}/><div style={{ flex:1,fontSize:13 }}>Passport Photo <span style={{ fontSize:11,color:T.muted }}>(Required)</span></div>
        <button type="button" style={{ fontSize:12,fontWeight:600,color:T.green,background:T.greenL,border:`1px solid ${T.green}25`,borderRadius:8,padding:"6px 12px",cursor:"pointer" }}><Upload size={12}/> Upload</button></div>
      <PrimaryBtn onClick={()=>dispatch({type:"TOAST",msg:"Family member added"})}>Add Member <ArrowRight size={16}/></PrimaryBtn></Card>
    <LegalNote>Primary resident is responsible for all linked members. Family cannot make financial decisions or vote.</LegalNote>
  </div>;
}

/* ══ KYC ══ */
function KYCPage() {
  const { state, dispatch } = useApp();
  const { aadhaarDone, digilockerDone, policeDone, esignDone } = state.kyc;
  const toggle = k => { dispatch({type:"SET",path:`kyc.${k}`,val:!state.kyc[k]}); dispatch({type:"TOAST",msg:"Verification completed!"}); };
  const methods = [
    {key:"aadhaarDone",done:aadhaarDone,icon:Fingerprint,title:"Aadhaar",tool:"UIDAI/DigiLocker",cost:"Tenant pays",result:"Legal identity",color:T.teal},
    {key:"digilockerDone",done:digilockerDone,icon:BookOpen,title:"DigiLocker KYC",tool:"DigiLocker",cost:"Tenant",result:"Gov-verified docs",color:T.green},
    {key:"policeDone",done:policeDone,icon:ShieldCheck,title:"Police Verification",tool:"Background Partner",cost:"Optional",result:"Trust badge",color:T.navy,optional:true},
    {key:"esignDone",done:esignDone,icon:FileText,title:"Aadhaar eSign",tool:"Licensed Provider",cost:"Per-agreement",result:"Legal agreements",color:T.gold},
  ];
  return <div>
    <Breadcrumb page="kyc"/>
    <PageHeader icon={Fingerprint} title="KYC & Verification" subtitle="Government-grade identity. No KYC = no access." tag="MANDATORY" tagColor={T.teal}/>
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16,marginBottom:24 }}>
      {methods.map((m,i)=><Card key={i} style={{ borderTop:`3px solid ${m.done?T.greenAccent:m.color}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
          <div style={{ width:38,height:38,borderRadius:10,background:(m.done?T.greenAccent:m.color)+"14",display:"grid",placeItems:"center" }}>{m.done?<CheckCircle size={18} color={T.greenAccent}/>:<m.icon size={18} color={m.color}/>}</div>
          <div style={{ fontSize:14,fontWeight:700,color:T.ink,fontFamily:T.serif }}>{m.title}</div>
          {m.optional&&<Pill color={T.muted}>Optional</Pill>}</div>
        <div style={{ fontSize:12,color:T.muted,marginBottom:4 }}>Tool: {m.tool}</div>
        <div style={{ fontSize:12,color:T.muted,marginBottom:4 }}>Cost: {m.cost}</div>
        <div style={{ fontSize:12,color:T.muted,marginBottom:14 }}>Result: {m.result}</div>
        <PrimaryBtn disabled={m.done} onClick={()=>toggle(m.key)}>{m.done?"Completed":"Start"}</PrimaryBtn>
      </Card>)}
    </div>
    {(aadhaarDone||esignDone)&&<Card style={{ marginBottom:20,background:T.greenL,border:`1px solid ${T.greenAccent}40` }}>
      <div style={{ display:"flex",alignItems:"center",gap:14 }}>
        <div style={{ width:48,height:48,borderRadius:12,background:T.greenAccent+"20",display:"grid",placeItems:"center" }}><BadgeCheck size={24} color={T.greenAccent}/></div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16,fontWeight:700,fontFamily:T.serif,color:T.greenD }}>Verification Certificate Issued</div>
          <div style={{ fontSize:11,fontFamily:T.mono,color:T.teal,marginTop:4 }}>Stored in Evidence Vault · SHA-256 secured</div></div>
        <SecBtn onClick={()=>dispatch({type:"TOAST",msg:"Certificate viewed"})}><Eye size={14}/> View</SecBtn></div></Card>}
    <Card><SectionTitle icon={Shield}>DPDP 2023 Compliance</SectionTitle>
      {["Explicit consent at signup","Data-principal rights built in","No raw Aadhaar stored","Retention periods disclosed","SHA-256 hashed — 30-year retention"].map((p,i)=>
        <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i<4?`1px solid ${T.line}`:"none" }}>
          <CheckCircle size={15} color={T.greenAccent} style={{ marginTop:2,flexShrink:0 }}/><span style={{ fontSize:13,color:T.inkSoft,lineHeight:1.5 }}>{p}</span></div>)}</Card>
  </div>;
}

/* ══ MOVE-IN / MOVE-OUT ══ */
function MoveInPage() {
  const { state, dispatch } = useApp();
  const gates = state.movein.gates;
  const toggle = i => dispatch({type:"TOGGLE_GATE",section:"movein",index:i});
  const items = [
    {label:"KYC Complete",sub:"Aadhaar verified",enforcer:"System"},
    {label:"Agreement Signed",sub:"Aadhaar-eSigned by both parties",enforcer:"System — eSign"},
    {label:"Security Deposit Paid",sub:"Matches agreement terms",enforcer:"Treasurer"},
    {label:"Advance Rent Paid",sub:"First month's rent",enforcer:"Treasurer"},
    {label:"Association Approval",sub:"Quorum-based committee approval",enforcer:"Committee"},
    {label:"Parking Allocated",sub:"Slot assigned and mapped",enforcer:"Secretary"},
    {label:"Access Activated",sub:"Gate entry, app, bookings enabled",enforcer:"System — all gates"},
  ];
  const prog = Math.round((gates.filter(Boolean).length/7)*100);
  const done = gates.every(Boolean);
  return <div>
    <Breadcrumb page="movein"/>
    <PageHeader icon={LogIn} title="Move-In Checklist" subtitle="7-gate sequential checklist." tag={`${prog}%`} tagColor={done?T.greenAccent:T.gold}/>
    <Card style={{ marginBottom:20,padding:"14px 18px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:6 }}>
        <div style={{ flex:1,height:8,borderRadius:4,background:T.line,overflow:"hidden" }}><div style={{ height:"100%",width:`${prog}%`,background:done?T.greenAccent:T.gold,borderRadius:4,transition:"width .4s" }}/></div>
        <span style={{ fontSize:13,fontWeight:700,fontFamily:T.mono,color:done?T.greenAccent:T.gold }}>{prog}%</span>
      </div>
      <div style={{ fontSize:12,color:T.muted }}>{gates.filter(Boolean).length} of 7 gates cleared</div></Card>
    <Card>
      {items.map((item,i)=><GateCheck key={i} label={item.label} sublabel={item.sub} enforcer={item.enforcer} complete={gates[i]} locked={i>0&&!gates[i-1]} onToggle={()=>toggle(i)}/>)}
      {done&&<div style={{ marginTop:20,padding:24,background:T.greenL,borderRadius:T.radiusSm,textAlign:"center" }}>
        <BadgeCheck size={36} color={T.greenAccent}/>
        <div style={{ fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.greenD,marginTop:10 }}>Move-In Complete — Access Activated</div>
        <div style={{ fontSize:13,color:T.muted,marginTop:4 }}>Gate entry, facility bookings, and all features now live.</div></div>}
      <LegalNote>Each gate is sequential. Checklist stored in Trust Ledger — admissible under IT Act 2000.</LegalNote></Card>
  </div>;
}

function MoveOutPage() {
  const { state, dispatch } = useApp();
  const gates = state.moveout.gates;
  const toggle = i => dispatch({type:"TOGGLE_GATE",section:"moveout",index:i});
  const items = [
    {label:"Rent Cleared",sub:"All pending payments settled",enforcer:"System — ledger"},
    {label:"Maintenance Cleared",sub:"All dues paid",enforcer:"Treasurer"},
    {label:"Flat Inspection",sub:"Timestamped photos uploaded",enforcer:"Committee"},
    {label:"Deposit Settled",sub:"Returned with itemized statement",enforcer:"Treasurer — dual sig."},
    {label:"Exit Certificate",sub:"Formal exit document generated",enforcer:"System — auto"},
  ];
  const prog = Math.round((gates.filter(Boolean).length/5)*100);
  const done = gates.every(Boolean);
  return <div>
    <Breadcrumb page="moveout"/>
    <PageHeader icon={LogOut} title="Move-Out Checklist" subtitle="Exit and settlement." tag={`${prog}%`} tagColor={done?T.greenAccent:T.gold}/>
    <Card style={{ marginBottom:20,padding:"14px 18px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
        <div style={{ flex:1,height:8,borderRadius:4,background:T.line,overflow:"hidden" }}><div style={{ height:"100%",width:`${prog}%`,background:done?T.greenAccent:T.gold,borderRadius:4,transition:"width .4s" }}/></div>
        <span style={{ fontSize:13,fontWeight:700,fontFamily:T.mono,color:done?T.greenAccent:T.gold }}>{prog}%</span></div></Card>
    <Card>
      {items.map((item,i)=><GateCheck key={i} label={item.label} sublabel={item.sub} enforcer={item.enforcer} complete={gates[i]} locked={i>0&&!gates[i-1]} onToggle={()=>toggle(i)}/>)}
      {done&&<div style={{ marginTop:20,padding:24,background:T.greenL,borderRadius:T.radiusSm,textAlign:"center" }}>
        <BadgeCheck size={36} color={T.greenAccent}/><div style={{ fontFamily:T.serif,fontSize:20,fontWeight:700,color:T.greenD,marginTop:10 }}>Tenancy Formally Closed</div>
        <div style={{ fontSize:13,color:T.muted,marginTop:4 }}>Exit certificate in Evidence Vault.</div></div>}</Card>
  </div>;
}

/* ══ STAFF / VENDOR / DOMESTIC ══ */
function StaffPage() {
  const { state, dispatch } = useApp();
  const { docs, form } = state.staff;
  const setField = (k,v) => dispatch({type:"SET",path:"staff.form",val:{...form,[k]:v}});
  return <div>
    <Breadcrumb page="staff"/>
    <PageHeader icon={HardHat} title="Staff Onboarding" subtitle="Committee-initiated only. Never self-serve." tag="COMMITTEE ONLY" tagColor={T.navy}/>
    <AlertBox title="RESTRICTION">Staff registered by committee/manager only. Initiator logged.</AlertBox>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={Users}>Staff Details</SectionTitle>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"0 20px" }}>
        <FormField label="Full Name" placeholder="As per Aadhaar" required value={form.name} onChange={v=>setField("name",v)}/>
        <FormField label="Designation" placeholder="Security / Housekeeping" required value={form.role} onChange={v=>setField("role",v)}/>
        <FormField label="Mobile" placeholder="+91" type="tel" required value={form.phone} onChange={v=>setField("phone",v)}/>
        <FormField label="Salary (monthly)" type="number" required value={form.salary} onChange={v=>setField("salary",v)}/>
        <FormField label="Joining Date" type="date" required value={form.joinDate} onChange={v=>setField("joinDate",v)}/>
        <FormField label="Employment Type" placeholder="Direct/Agency" required value={form.empType} onChange={v=>setField("empType",v)}/>
      </div></Card>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={FileText}>Documents</SectionTitle>
      <DocRow name="Aadhaar" purpose="Identity/KYC" docData={docs.aadhaar} section="staff" docKey="aadhaar"/>
      <DocRow name="Photo" purpose="Gate ID" docData={docs.photo} section="staff" docKey="photo"/>
      <DocRow name="Salary Proof" purpose="Payroll/HR" docData={docs.salary} section="staff" docKey="salary"/>
      <DocRow name="PF/ESI/Bank" purpose="Labour compliance" docData={docs.pf} section="staff" docKey="pf"/>
      <DocRow name="Agency Contract" purpose="Liability" mandatory={false} docData={docs.contract} section="staff" docKey="contract"/>
      <LegalNote>PF/ESI/bank details entered by the staff member. Labour compliance tracked automatically.</LegalNote></Card>
    <div style={{ display:"flex",justifyContent:"flex-end" }}><PrimaryBtn onClick={()=>dispatch({type:"TOAST",msg:"Staff registered!"})}>Register <ArrowRight size={16}/></PrimaryBtn></div>
  </div>;
}

function VendorPage() {
  const { state, dispatch } = useApp();
  const { docs, form } = state.vendor;
  const setField = (k,v) => dispatch({type:"SET",path:"vendor.form",val:{...form,[k]:v}});
  return <div>
    <Breadcrumb page="vendor"/>
    <PageHeader icon={Truck} title="Vendor Onboarding" subtitle="Committee-approved with lifecycle tracking."/>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={Briefcase}>Vendor Details</SectionTitle>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"0 20px" }}>
        <FormField label="Business Name" placeholder="AquaClean Services" required value={form.name} onChange={v=>setField("name",v)}/>
        <FormField label="Contact" placeholder="Name" required value={form.contact} onChange={v=>setField("contact",v)}/>
        <FormField label="Mobile" placeholder="+91" type="tel" required value={form.phone} onChange={v=>setField("phone",v)}/>
        <FormField label="GST Number" placeholder="29AXXXX1234X1ZX" required value={form.gst} onChange={v=>setField("gst",v)}/>
        <FormField label="Service Category" placeholder="Plumbing/Electrical/AMC" required value={form.category} onChange={v=>setField("category",v)}/>
      </div></Card>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={FileText}>Documents</SectionTitle>
      <DocRow name="GST/PAN" purpose="Tax compliance" docData={docs.gst} section="vendor" docKey="gst"/>
      <DocRow name="Business Proof" purpose="Legitimate entity" docData={docs.business} section="vendor" docKey="business"/>
      <DocRow name="Service Category" purpose="Work order mapping" docData={docs.service} section="vendor" docKey="service"/>
      <DocRow name="Contract/Rate Card" purpose="Pricing & terms" docData={docs.contract} section="vendor" docKey="contract"/>
      <DocRow name="Bank Details" purpose="Payment processing" docData={docs.bank} section="vendor" docKey="bank"/></Card>
    <Card><SectionTitle icon={ShieldCheck}>Post-Approval Tracking</SectionTitle>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10 }}>
        {["Work Orders","Before/After Photos","Ratings","Invoices","Payments","Contract Renewals"].map((t,i)=>
          <div key={i} style={{ display:"flex",alignItems:"center",gap:6,padding:10,background:T.cream,borderRadius:8,fontSize:12,fontWeight:600,color:T.ink }}><CheckCircle size={13} color={T.teal}/> {t}</div>)}
      </div>
      <LegalNote>Vendors cannot self-close work orders. Resolution confirmed by committee/resident.</LegalNote></Card>
    <div style={{ display:"flex",justifyContent:"flex-end",marginTop:24 }}><PrimaryBtn onClick={()=>dispatch({type:"TOAST",msg:"Vendor submitted!"})}>Submit <ArrowRight size={16}/></PrimaryBtn></div>
  </div>;
}

function DomesticPage() {
  const { state, dispatch } = useApp();
  return <div>
    <Breadcrumb page="domestic"/>
    <PageHeader icon={Users} title="Domestic Help Onboarding" subtitle="Resident-introduced, society-verified. Aadhaar mandatory before first entry."/>
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24 }}>
      {[{l:"Registered",v:state.domestic.list.length,c:T.ink},{l:"Verified",v:state.domestic.list.filter(d=>d.aadhaar).length,c:T.greenAccent},{l:"Unverified",v:state.domestic.list.filter(d=>!d.aadhaar).length,c:T.red},{l:"Blacklisted",v:0,c:T.muted}].map((s,i)=>
        <div key={i} style={{ padding:14,background:T.paper,border:`1px solid ${T.line}`,borderRadius:T.radiusSm }}>
          <div style={{ fontSize:11,color:T.muted,fontFamily:T.mono,textTransform:"uppercase",letterSpacing:".5px" }}>{s.l}</div>
          <div style={{ fontSize:22,fontWeight:700,color:s.c,fontFamily:T.serif,marginTop:4 }}>{s.v}</div></div>)}
    </div>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={Users}>Current Help</SectionTitle>
      {state.domestic.list.map((d,i)=>
        <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:`1px solid ${T.line}` }}>
          <div style={{ width:38,height:38,borderRadius:"50%",background:d.aadhaar?T.greenL:T.redL,display:"grid",placeItems:"center",fontFamily:T.serif,fontWeight:700,fontSize:15,color:d.aadhaar?T.greenD:T.red }}>{d.name[0]}</div>
          <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600,color:T.ink }}>{d.name}</div>
            <div style={{ fontSize:12,color:T.muted }}>Flats: {d.flats.join(", ")} · {d.entry?`In: ${d.entry}`:""}{d.exit?` · Out: ${d.exit}`:d.entry?" · Inside":"Not checked in"}</div></div>
          {d.aadhaar?<Pill color={T.greenAccent}>Aadhaar ✓</Pill>:<Pill color={T.red} bg={T.redL}>Blocked</Pill>}</div>)}</Card>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={UserPlus}>Register New</SectionTitle>
      <p style={{ fontSize:13,color:T.muted,marginBottom:14 }}>Aadhaar verified via UIDAI. Multi-flat employment tracked. All employers notified on entry/exit.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"0 20px" }}>
        <FormField label="Full Name" placeholder="Name" required/><FormField label="Aadhaar Number" placeholder="Verified via UIDAI" required/>
        <FormField label="Mobile" placeholder="+91" type="tel" required/><FormField label="Employer Flat(s)" placeholder="A-1204, B-302" required/>
      </div>
      <DocRow name="Photo" purpose="Gate security" mandatory={true} docData={state.domestic.docs.photo} section="domestic" docKey="photo"/>
      <DocRow name="Previous Employer Ref" purpose="History" mandatory={false} docData={state.domestic.docs.ref} section="domestic" docKey="ref"/>
      <div style={{ marginTop:14 }}><PrimaryBtn onClick={()=>dispatch({type:"TOAST",msg:"Submitted — UIDAI verification in progress"})}>Submit <ArrowRight size={16}/></PrimaryBtn></div></Card>
    <AlertBox title="SECURITY" type="danger">Entry conditional on Aadhaar verification. Misconduct = society-wide ban. All entry/exit timestamped.</AlertBox>
  </div>;
}

/* ══ EVIDENCE VAULT — New ══ */
function VaultPage() {
  const { state } = useApp();
  const tc = {Agreement:T.teal,KYC:T.navy,Financial:T.gold,Inspection:T.green,Resolution:T.greenD};
  return <div>
    <Breadcrumb page="vault"/>
    <PageHeader icon={Archive} title="Evidence Vault & Trust Ledger" subtitle="Immutable audit trail. No deletion permitted." tag="IMMUTABLE" tagColor={T.greenD}/>
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24 }}>
      {[{l:"Records",v:state.vault.entries.length},{l:"Verified",v:state.vault.entries.length},{l:"Retention",v:"30yr"},{l:"Hash",v:"SHA-256"}].map((s,i)=>
        <div key={i} style={{ padding:14,background:T.paper,border:`1px solid ${T.line}`,borderRadius:T.radiusSm }}>
          <div style={{ fontSize:11,color:T.muted,fontFamily:T.mono,textTransform:"uppercase",letterSpacing:".5px" }}>{s.l}</div>
          <div style={{ fontSize:20,fontWeight:700,color:T.ink,fontFamily:T.serif,marginTop:4 }}>{s.v}</div></div>)}
    </div>
    <Card style={{ marginBottom:20 }}><SectionTitle icon={Archive}>Community Trust Ledger</SectionTitle>
      {state.vault.entries.map((e,i)=>
        <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:`1px solid ${T.line}` }}>
          <div style={{ width:36,height:36,borderRadius:8,background:(tc[e.type]||T.teal)+"14",display:"grid",placeItems:"center" }}>
            {e.type==="Agreement"?<FileText size={16} color={tc[e.type]}/>:e.type==="KYC"?<Fingerprint size={16} color={tc[e.type]}/>:e.type==="Financial"?<CreditCard size={16} color={tc[e.type]}/>:e.type==="Inspection"?<Camera size={16} color={tc[e.type]}/>:<Users size={16} color={tc[e.type]}/>}
          </div>
          <div style={{ flex:1 }}><div style={{ fontSize:14,fontWeight:600,color:T.ink }}>{e.title}</div>
            <div style={{ fontSize:12,color:T.muted }}>{e.date} · {e.actor}</div>
            <div style={{ fontSize:10,fontFamily:T.mono,color:T.teal,marginTop:2 }}>SHA-256: {e.hash}</div></div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
            <Pill color={tc[e.type]||T.teal}>{e.type}</Pill><span style={{ fontSize:10,fontFamily:T.mono,color:T.muted }}>{e.id}</span></div></div>)}</Card>
    {state.auditLog?.length>0&&<Card style={{ marginBottom:20 }}><SectionTitle icon={Clock}>Session Audit Trail</SectionTitle>
      {state.auditLog.slice(0,8).map(entry=>
        <div key={entry.id} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.line}` }}>
          <StatusDot status={entry.kind==="gate"?"active":"complete"}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13,fontWeight:600,color:T.ink }}>{entry.message}</div>
            <div style={{ fontSize:10,fontFamily:T.mono,color:T.muted,marginTop:2 }}>{new Date(entry.at).toLocaleString()}</div>
          </div>
        </div>)}
    </Card>}
    <AlertBox title="LEGAL STANDING" type="success">Court-ready evidence packages. Timestamped, attributed, cryptographically secured. No deletion — enforced at database level.</AlertBox>
    <LegalNote>30-year retention. Court-format downloads available. SHA-256 hashing on all records.</LegalNote>
  </div>;
}

/* ══ TOAST ══ */
function ToastContainer({ toasts, dispatch }) {
  return <div style={{ position:"fixed",top:16,right:16,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:360 }}>
    {toasts.map(t=><ToastItem key={t.id} toast={t} dispatch={dispatch}/>)}
  </div>;
}
function ToastItem({ toast, dispatch }) {
  const [vis,setVis] = useState(false);
  const onDismiss = useCallback(() => dispatch({type:"DISMISS_TOAST",id:toast.id}), [dispatch, toast.id]);
  useEffect(()=>{
    const showTimer = window.setTimeout(()=>setVis(true),10);
    const dismissTimer = window.setTimeout(()=>{setVis(false); window.setTimeout(onDismiss,300);},4000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [onDismiss]);
  const bg = toast.kind==="error"?T.red:toast.kind==="warning"?T.gold:T.greenAccent;
  return <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:T.paper,border:`1px solid ${bg}40`,borderLeft:`4px solid ${bg}`,borderRadius:T.radiusSm,boxShadow:T.shadowLg,fontSize:13,color:T.ink,opacity:vis?1:0,transform:vis?"translateX(0)":"translateX(20px)",transition:"all .3s" }}>
    {toast.kind==="error"?<AlertTriangle size={16} color={T.red}/>:<CheckCircle size={16} color={T.greenAccent}/>}
    <span style={{ flex:1 }}>{toast.msg}</span>
    <button type="button" aria-label="Dismiss notification" onClick={onDismiss} style={{ display:"grid",placeItems:"center",width:28,height:28,background:"transparent",border:0,cursor:"pointer",padding:0 }}>
      <X size={14} color={T.muted} style={{ flexShrink:0 }}/>
    </button>
  </div>;
}

/* ══ SIDEBAR ══ */
function SidebarContent({ page, nav }) {
  return <>
    <div style={{ padding:"20px 18px 14px",borderBottom:`1px solid ${T.line}` }}>
      <div style={{ fontFamily:T.serif,fontSize:21,fontWeight:700,color:T.green,letterSpacing:"-.5px" }}>Sahavas</div>
      <div style={{ fontFamily:T.mono,fontSize:9,color:T.gold,letterSpacing:1.5,marginTop:2 }}>ONBOARDING PORTAL</div></div>
    <nav style={{ flex:1,padding:"8px 8px",overflowY:"auto" }}>
      {SECTIONS.map(sec=><div key={sec.label} style={{ marginBottom:4 }}>
        <div style={{ fontSize:10,fontWeight:700,fontFamily:T.mono,color:T.muted,letterSpacing:1,textTransform:"uppercase",padding:"10px 12px 4px" }}>{sec.label}</div>
        {sec.pages.map(p=>{const a=page===p.id;return <button type="button" key={p.id} aria-current={a ? "page" : undefined} onClick={()=>nav(p.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,cursor:"pointer",background:a?T.greenL:"transparent",border:0,transition:"all .15s",marginBottom:1,textAlign:"left" }}>
          <p.icon size={16} color={a?T.green:T.muted}/><div><div style={{ fontSize:12,fontWeight:a?700:500,color:a?T.green:T.inkSoft,lineHeight:1.3 }}>{p.label}</div>
            <div style={{ fontSize:9,color:T.muted }}>{p.desc}</div></div></button>;})}</div>)}
    </nav>
    <div style={{ padding:"14px 18px",borderTop:`1px solid ${T.line}`,fontSize:9,color:T.muted,fontFamily:T.mono }}>
      <div>Sahavas v3.1 — CEO Edition</div><div style={{ marginTop:2 }}>Internal — Confidential</div></div>
  </>;
}

/* ══ MAIN APP ══ */
export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  useEffect(() => {
    try {
      const persistable = { ...state, toasts: [], sidebarOpen: false };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // Persistence is a convenience layer; the workflow still operates without it.
    }
  }, [state]);
  const nav = useCallback(id => { dispatch({type:"NAV",page:id}); window.scrollTo?.({top:0,behavior:"smooth"}); }, []);
  const exportSnapshot = useCallback(() => {
    const snapshot = JSON.stringify({ exportedAt: new Date().toISOString(), state: { ...state, toasts: [], sidebarOpen: false } }, null, 2);
    const blob = new Blob([snapshot], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sahavas-onboarding-snapshot-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    dispatch({type:"TOAST",msg:"Evidence snapshot exported"});
  }, [state]);
  const resetPortal = useCallback(() => {
    if (!window.confirm("Reset all local onboarding demo data?")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    dispatch({type:"RESET"});
    dispatch({type:"TOAST",msg:"Portal state reset",kind:"warning"});
  }, []);
  const renderPage = () => {
    switch(state.page) {
      case "hub": return <HubPage/>;
      case "society": return <SocietyPage/>;
      case "owner": return <OwnerPage/>;
      case "tenant": return <TenantPage/>;
      case "family": return <FamilyPage/>;
      case "kyc": return <KYCPage/>;
      case "movein": return <MoveInPage/>;
      case "moveout": return <MoveOutPage/>;
      case "staff": return <StaffPage/>;
      case "vendor": return <VendorPage/>;
      case "domestic": return <DomesticPage/>;
      case "vault": return <VaultPage/>;
      default: return <HubPage/>;
    }
  };
  const pg = ALL_PAGES.find(p=>p.id===state.page);
  return <Ctx.Provider value={{state,dispatch}}>
    <div style={{ fontFamily:T.sans,color:T.ink,background:T.cream,minHeight:"100vh",display:"flex" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.page-anim{animation:fadeIn .35s ease both}@media(max-width:768px){.sidebar-desk{display:none!important}.mob-menu{display:flex!important}}@media(min-width:769px){.mob-menu{display:none!important}}`}</style>
      <ToastContainer toasts={state.toasts} dispatch={dispatch}/>
      {state.sidebarOpen&&<button type="button" aria-label="Close navigation" onClick={()=>dispatch({type:"SIDEBAR",open:false})} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",border:0,padding:0,zIndex:90 }}/>}
      <aside className="sidebar-desk" style={{ width:260,flexShrink:0,background:T.paper,borderRight:`1px solid ${T.line}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,zIndex:100,overflowY:"auto" }}>
        <SidebarContent page={state.page} nav={nav}/>
      </aside>
      {state.sidebarOpen&&<aside style={{ position:"fixed",left:0,top:0,bottom:0,width:280,background:T.paper,borderRight:`1px solid ${T.line}`,zIndex:100,display:"flex",flexDirection:"column",overflowY:"auto" }}>
        <SidebarContent page={state.page} nav={nav}/></aside>}
      <main style={{ flex:1,minWidth:0 }}>
        <header style={{ position:"sticky",top:0,zIndex:50,background:T.paper+"ee",backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.line}`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button type="button" aria-label="Open navigation" className="mob-menu" onClick={()=>dispatch({type:"SIDEBAR",open:!state.sidebarOpen})} style={{ background:"none",border:"none",cursor:"pointer",padding:4,alignItems:"center",display:"none" }}><Menu size={20} color={T.ink}/></button>
            <div style={{ fontSize:14,fontWeight:600,color:T.ink }}>{pg?.label||"Hub"}</div></div>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <button type="button" aria-label="Export evidence snapshot" onClick={exportSnapshot} style={{ display:"grid",placeItems:"center",width:34,height:34,background:T.greenL,border:`1px solid ${T.green}25`,borderRadius:8,cursor:"pointer" }}><Download size={16} color={T.green}/></button>
            <button type="button" aria-label="Reset local state" onClick={resetPortal} style={{ display:"grid",placeItems:"center",width:34,height:34,background:T.cream,border:`1px solid ${T.line}`,borderRadius:8,cursor:"pointer" }}><RefreshCw size={16} color={T.muted}/></button>
            <button type="button" aria-label="Notifications" onClick={()=>dispatch({type:"TOAST",msg:"No new notifications"})} style={{ display:"grid",placeItems:"center",width:34,height:34,background:"transparent",border:`1px solid ${T.line}`,borderRadius:8,cursor:"pointer" }}><Bell size={17} color={T.muted}/></button>
            <div style={{ width:30,height:30,borderRadius:"50%",background:T.green,display:"grid",placeItems:"center",fontSize:12,fontWeight:700,color:"#fff" }}>S</div></div>
        </header>
        <div key={state.page} className="page-anim" style={{ padding:"24px clamp(14px,3vw,28px)",maxWidth:960,margin:"0 auto" }}>
          {renderPage()}
          <div style={{ marginTop:48,padding:"18px 0",borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,fontSize:10,color:T.muted,fontFamily:T.mono }}>
            <span>Sahavas 2026 — Transparent. Democratic. Accountable. Trusted.</span>
            <span>If it is not recorded in Sahavas, it did not happen.</span></div>
        </div>
      </main>
    </div>
  </Ctx.Provider>;
}
