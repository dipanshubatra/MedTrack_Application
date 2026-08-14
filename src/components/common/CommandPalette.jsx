import { useEffect, useMemo, useState } from "react";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { ROUTES, PUBLIC, AUTHENTICATED } from "../../routes/routeRegistry";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

/**
 * Human-readable names + search keywords for every reachable page key.
 * Keys missing from this map fall back to a humanised version of the key,
 * so the palette keeps working when new routes are registered.
 */
const PAGE_LABELS = {
  landing: { label: "Home", keywords: "landing start welcome" },
  blog: { label: "Blog", keywords: "articles news posts" },
  careers: { label: "Careers", keywords: "jobs hiring positions apply" },
  certificate: { label: "Certificate Generator", keywords: "certificate training completion" },
  about: { label: "About", keywords: "company about us employers" },
  contact: { label: "Contact", keywords: "support reach email" },
  guidelines: { label: "Guidelines", keywords: "rules policy" },
  help: { label: "Help Center", keywords: "help faq support" },
  awards: { label: "Awards", keywords: "recognition honors" },
  terms: { label: "Terms of Service", keywords: "terms legal" },
  guides: { label: "Guides", keywords: "documentation how to" },
  security: { label: "Security", keywords: "security overview" },
  status: { label: "System Status", keywords: "uptime health status" },
  "dual-range-slider": { label: "Range Slider Studio", keywords: "dual range slider filter demo" },
  dashboard: { label: "Dashboard", keywords: "home overview" },
  equipment: { label: "Equipment", keywords: "inventory assets list" },
  maintenance: { label: "Maintenance Schedule", keywords: "maintenance calendar plan" },
  analytics: { label: "Analytics", keywords: "reports insights statistics" },
  "add-equipment": { label: "Add Equipment", keywords: "new asset create" },
  "schedule-maintenance": { label: "Schedule Maintenance", keywords: "new maintenance plan" },
  "request-equipment": { label: "Request Equipment", keywords: "purchase order request" },
  "maintenance-rules": { label: "Preventive Maintenance Rules", keywords: "pm rules automation" },
  "sla-dashboard": { label: "SLA Dashboard", keywords: "sla compliance service level" },
  calibration: { label: "Calibration Hub", keywords: "calibration compliance" },
  tasks: { label: "My Tasks", keywords: "tasks technician work orders" },
  orders: { label: "Orders", keywords: "purchase orders supplier" },
  "authority-security": { label: "Authority Security", keywords: "authority version revocation tokens" },
  "sso-security": { label: "Single Sign-On", keywords: "sso saml oauth login" },
  "rbac-security": { label: "Role-Based Access Control", keywords: "rbac roles permissions" },
  "zerotrust-security": { label: "Zero Trust", keywords: "zt security" },
  "saml-identity": { label: "SAML Identity", keywords: "saml idp federation" },
  "scim-provisioning": { label: "SCIM Provisioning", keywords: "scim user provisioning" },
  "security-governance": { label: "Security Governance", keywords: "governance policies" },
  "mfa-security": { label: "Multi-Factor Authentication", keywords: "mfa 2fa totp authenticator" },
  "compliance-security": { label: "Compliance", keywords: "compliance standards" },
  "threat-detection": { label: "Threat Detection", keywords: "threats alerts" },
  soar: { label: "SOAR", keywords: "soar orchestration automation response" },
  "keyvault-security": { label: "Key Vault", keywords: "secrets keys certificates" },
  "security-keyvault": { label: "Key Vault (Security)", keywords: "secrets keys vault" },
  "dlp-privacy": { label: "DLP & Privacy", keywords: "data loss prevention privacy" },
  passkeys: { label: "Passkeys", keywords: "passkey webauthn fido" },
  ztna: { label: "ZTNA", keywords: "zero trust network access" },
  microsegmentation: { label: "Microsegmentation", keywords: "segmentation network" },
  "siem-analytics": { label: "SIEM Analytics", keywords: "siem logs security events" },
  "grc-compliance": { label: "GRC Compliance", keywords: "governance risk compliance" },
  "security-posture": { label: "Security Posture", keywords: "posture score" },
  "security-commandcenter": { label: "Security Command Center", keywords: "command center soc" },
  vulnerability: { label: "Vulnerability Management", keywords: "vulnerabilities cve scan" },
  "security-vulnerability": { label: "Vulnerability Scan", keywords: "vulnerabilities cve" },
  pam: { label: "Privileged Access Management", keywords: "pam privileged credentials" },
  sbom: { label: "SBOM", keywords: "software bill of materials supply chain" },
  cspm: { label: "CSPM", keywords: "cloud security posture" },
  "threat-intelligence": { label: "Threat Intelligence", keywords: "threat intel ioc" },
  "security-threat": { label: "Threats", keywords: "threats attacks" },
  "security-observability": { label: "Observability", keywords: "telemetry monitoring" },
  "security-playbook": { label: "Security Playbooks", keywords: "playbook automation" },
  "incident-response": { label: "Incident Response", keywords: "incidents response ir" },
  "compliance-evidence": { label: "Compliance Evidence", keywords: "evidence audits" },
  "compliance-reporting": { label: "Compliance Reporting", keywords: "reports audits" },
};

/**
 * Pages that should never appear as palette destinations: auth screens, the
 * 404 page, and parameterised routes (they need a record id that the palette
 * has no way to choose).
 */
const EXCLUDED_PAGES = new Set([
  "login",
  "register",
  "forgot-password",
  "verify-otp",
  "reset-password",
  "not-found",
]);

const humanize = (key) =>
  key
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** Search index built once at module load from the single route registry. */
const PAGE_INDEX = ROUTES.filter(
  (route) => !EXCLUDED_PAGES.has(route.page) && !route.param
).map((route) => ({
  page: route.page,
  label: PAGE_LABELS[route.page]?.label || humanize(route.page),
  keywords: PAGE_LABELS[route.page]?.keywords || "",
  access: route.access,
  // Set by the permission-gating work once merged; filtering is a no-op until
  // then, so the palette stays correct on both sides of that change.
  permission: route.permission,
}));

function canAccess(entry, user) {
  if (entry.access === PUBLIC) return true;
  if (entry.access === AUTHENTICATED) return !!user;
  if (Array.isArray(entry.access)) {
    return !!user && entry.access.includes(user.role);
  }
  return false;
}

/** Higher is better; -1 means "does not match". */
function matchScore(query, entry) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const label = entry.label.toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 80;
  const haystack = `${entry.keywords} ${entry.id || entry.page}`.toLowerCase();
  if (haystack.includes(q)) return 50;
  return -1;
}

/**
 * Ctrl/Cmd+K command palette: fuzzy-jump to any page the current user can
 * actually reach (role access + permission gating) and run quick actions
 * (theme toggle, sign out, back to top). Fully keyboard-driven: arrows move,
 * Enter selects, Esc closes.
 */
export default function CommandPalette({ open, onClose, onNavigate }) {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [query, setQuery] = useState("");
  const [activeRow, setActiveRow] = useState(0);

  // Close on Escape regardless of where focus is inside the overlay.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset the query whenever the palette is (re)opened.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const rows = useMemo(() => {
    const visiblePages = PAGE_INDEX.filter((entry) => {
      if (!canAccess(entry, user)) return false;
      if (entry.permission && !hasPermission(entry.permission)) return false;
      return true;
    });

    const pages = visiblePages
      .map((entry) => ({ kind: "item", type: "page", ...entry, score: matchScore(query, entry) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

    const actions = [];
    actions.push({
      kind: "item",
      type: "action",
      id: "toggle-theme",
      label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      keywords: "theme dark light appearance",
      run: toggleTheme,
    });
    if (user) {
      actions.push({
        kind: "item",
        type: "action",
        id: "sign-out",
        label: "Sign out",
        keywords: "logout exit session end",
        run: () => logout(),
      });
    }
    actions.push({
      kind: "item",
      type: "action",
      id: "back-to-top",
      label: "Back to top",
      keywords: "scroll top",
      run: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    });

    const matchedActions = actions.filter((action) => matchScore(query, action) >= 0);

    const rows = [];
    if (pages.length > 0) {
      rows.push({ kind: "header", label: "Pages" });
      rows.push(...pages);
    }
    if (matchedActions.length > 0) {
      rows.push({ kind: "header", label: "Actions" });
      rows.push(...matchedActions);
    }
    return rows;
  }, [query, user, theme, toggleTheme, logout, hasPermission]);

  const selectableIndexes = useMemo(
    () => rows.map((row, index) => (row.kind === "item" ? index : -1)).filter((index) => index >= 0),
    [rows]
  );

  // Keep the active row inside the list when results shrink.
  useEffect(() => {
    if (activeRow > selectableIndexes.length - 1) {
      setActiveRow(Math.max(0, selectableIndexes.length - 1));
    }
  }, [selectableIndexes.length, activeRow]);

  if (!open) {
    return null;
  }

  const selectedRowIndex = selectableIndexes[activeRow];

  const selectRow = (row) => {
    if (row.type === "page") {
      onNavigate(row.page);
    } else {
      row.run();
    }
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveRow((index) => Math.min(index + 1, selectableIndexes.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveRow((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (selectedRowIndex !== undefined && rows[selectedRowIndex]) {
        selectRow(rows[selectedRowIndex]);
      }
    }
  };

  const hasResults = rows.length > 0;

  return (
    <div
      className="fixed inset-0 z-[9995] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={onClose}
      data-testid="command-palette-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl rounded-2xl bg-surface text-primary border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slide-in"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search size={20} className="text-secondary shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveRow(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions…"
            aria-label="Search pages and actions"
            className="flex-1 bg-transparent outline-none placeholder:text-secondary/70 text-primary"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-secondary bg-slate-100 dark:bg-slate-800">
            esc
          </kbd>
        </div>

        {hasResults ? (
          <ul role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto py-2">
            {rows.map((row, index) => {
              if (row.kind === "header") {
                return (
                  <li
                    key={`header-${row.label}`}
                    role="presentation"
                    className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-secondary/70"
                  >
                    {row.label}
                  </li>
                );
              }
              const isSelected = index === selectedRowIndex;
              return (
                <li
                  key={row.type === "page" ? `page-${row.page}` : `action-${row.id}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-label={row.label}
                  onMouseEnter={() => setActiveRow(selectableIndexes.indexOf(index))}
                  onClick={() => selectRow(row)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer text-sm ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="font-medium">{row.label}</span>
                  <span className={`text-xs ${isSelected ? "text-white/80" : "text-secondary/70"}`}>
                    {row.type === "page" ? "Page" : "Action"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-secondary text-center">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 text-[11px] text-secondary/70">
          <span className="inline-flex items-center gap-1">
            <ArrowUp size={12} />
            <ArrowDown size={12} /> navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft size={12} /> select
          </span>
          <span className="inline-flex items-center gap-1">esc close</span>
        </div>
      </div>
    </div>
  );
}
