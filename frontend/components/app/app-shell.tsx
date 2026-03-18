"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth/context";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/funnels", label: "Funnels" },
  { href: "/calls/active", label: "Calls" },
  { href: "/agents", label: "Agents" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings/integrations", label: "Settings" },
  { href: "/account", label: "Account" },
];

const activityItems = [
  { key: "explorer", label: "EX" },
  { key: "search", label: "SR" },
  { key: "source", label: "SC" },
  { key: "run", label: "RN" },
  { key: "extensions", label: "XT" },
];

const panelTabs = ["Problems", "Output", "Telemetry", "Terminal"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuxOpen, setIsAuxOpen] = useState(true);
  const [isLayoutTunerOpen, setIsLayoutTunerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [auxWidth, setAuxWidth] = useState(360);
  const [panelHeight, setPanelHeight] = useState(220);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
    root.style.setProperty("--aux-open-width", `${auxWidth}px`);
    root.style.setProperty("--panel-height", `${panelHeight}px`);
  }, [sidebarWidth, auxWidth, panelHeight]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const openTabs = navItems.filter(
    (item) => item.href === pathname || item.href === "/" || item.href === "/customers"
  );

  return (
    <div className="app-shell workbench-shell">
      <header className="workbench-titlebar">
        <div className="titlebar-brand">
          <div className="titlebar-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="titlebar-product">Lead Recovery Workspace</p>
        </div>
        <div className="command-center" role="search">
          <span className="command-center-kbd">CTRL</span>
          <span className="command-center-kbd">SHIFT</span>
          <span className="command-center-kbd">P</span>
          <span className="command-center-text">Search commands, routes, and actions</span>
        </div>
        <div className="titlebar-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm aux-toggle-button"
            onClick={() => setIsAuxOpen((prev) => !prev)}
            aria-expanded={isAuxOpen}
            aria-controls="right-auxiliary-pane"
          >
            {isAuxOpen ? "Hide Copilot" : "Show Copilot"}
          </button>
          <p className="app-user-chip">
            {session?.user.email ?? "Guest"} · {session?.role ?? "unknown"}
          </p>
          <button type="button" className="btn btn-secondary btn-sm shell-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className={`workbench-main split-view-container${isAuxOpen ? " aux-open" : " aux-collapsed"}`}>
        <aside className="activity-rail split-view split-view-1" aria-label="Primary activity">
          <div className="activity-rail-group">
            {activityItems.map((item, index) => (
              <button
                key={item.key}
                type="button"
                className={`activity-rail-button${index === 0 ? " is-active" : ""}`}
                aria-label={item.key}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="activity-rail-group activity-rail-group--bottom">
            <button type="button" className="activity-rail-button" aria-label="Account">
              AC
            </button>
          </div>
        </aside>

        <aside className="explorer-pane split-view split-view-2" aria-label="Explorer">
          <div className="explorer-header">
            <p className="explorer-label">Explorer</p>
            <span className="explorer-meta">lead-recovery-1</span>
          </div>
          <div className="explorer-section">
            <p className="explorer-section-title">Open Editors</p>
            <ul className="explorer-list explorer-list--compact">
              {openTabs.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={`explorer-link${pathname === item.href ? " is-active" : ""}`}>
                    {item.label}.tsx
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="explorer-section">
            <p className="explorer-section-title">Workspace</p>
            <ul className="explorer-list">
              <li className="explorer-group">app</li>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={`explorer-link${pathname === item.href ? " is-active" : ""}`}>
                    {item.label.toLowerCase().replace(/\s+/g, "-")}.tsx
                  </Link>
                </li>
              ))}
              <li className="explorer-group">features</li>
              <li><span className="explorer-link is-muted">customers/</span></li>
              <li><span className="explorer-link is-muted">integrations/</span></li>
              <li><span className="explorer-link is-muted">logs/</span></li>
            </ul>
          </div>
        </aside>

        <section className="editor-stack split-view split-view-3">
          <div className="editor-tabs" role="tablist" aria-label="Open pages">
            {openTabs.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`editor-tab${pathname === item.href ? " is-active" : ""}`}
              >
                <span className="editor-tab-dot" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="editor-toolbar">
            <div className="editor-breadcrumbs">
              <span>lead-recovery-1</span>
              <span>/</span>
              <span>app</span>
              <span>/</span>
              <span>{pathname === "/" ? "dashboard" : pathname.replace(/^\//, "")}</span>
            </div>
            <div className="editor-toolbar-actions">
              <span className="toolbar-chip">main</span>
              <span className="toolbar-chip">TypeScript</span>
              <span className="toolbar-chip">UTF-8</span>
            </div>
          </div>

          <main className="content-panel">
            <div className="editor-surface">{children}</div>
          </main>

          <section className="bottom-panel" aria-label="Output panels">
            <div className="bottom-panel-tabs">
              {panelTabs.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`bottom-panel-tab${index === 0 ? " is-active" : ""}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="bottom-panel-body">
              <p className="bottom-panel-line">0 errors · 0 warnings · route telemetry active</p>
              <p className="bottom-panel-line">Current view: {pathname}</p>
            </div>
          </section>
        </section>

        <aside
          id="right-auxiliary-pane"
          className={`right-auxiliary-pane split-view split-view-4${isAuxOpen ? " is-open" : " is-collapsed"}`}
          aria-label="Copilot auxiliary panel"
        >
          {isAuxOpen ? (
            <>
              <div className="right-aux-header">
                <p className="right-aux-title">Copilot Chat</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsAuxOpen(false)}
                  aria-label="Collapse auxiliary panel"
                >
                  Collapse
                </button>
              </div>
              <div className="right-aux-body">
                <div className="copilot-chat-thread">
                  <p className="copilot-msg copilot-msg-assistant">How can I help with this migration phase?</p>
                  <p className="copilot-msg copilot-msg-user">Create route parity and tests for logs + integrations.</p>
                  <p className="copilot-msg copilot-msg-assistant">I can scaffold Phase 4 and wire SSE fallback with telemetry.</p>
                </div>
                <div className="copilot-chat-composer">
                  <input
                    className="field-input"
                    placeholder="Ask Copilot..."
                    aria-label="Copilot prompt"
                  />
                  <button type="button" className="btn btn-primary btn-sm">Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="right-aux-collapsed-rail">
              <button
                type="button"
                className="right-aux-expand-btn"
                onClick={() => setIsAuxOpen(true)}
                aria-label="Expand Copilot auxiliary panel"
              >
                Copilot
              </button>
            </div>
          )}
        </aside>
      </div>

      <footer className="status-bar">
        <div className="status-bar-group">
          <span className="status-item">main</span>
          <span className="status-item">Sync OK</span>
          <span className="status-item">Telemetry On</span>
        </div>
        <div className="status-bar-group">
          <button
            type="button"
            className="status-item status-item-button"
            onClick={() => setIsLayoutTunerOpen((prev) => !prev)}
            aria-expanded={isLayoutTunerOpen}
            aria-controls="layout-tuner"
          >
            Layout
          </button>
          <span className="status-item">Spaces: 2</span>
          <span className="status-item">LF</span>
          <span className="status-item">TypeScript React</span>
        </div>
      </footer>

      {isLayoutTunerOpen && (
        <section id="layout-tuner" className="layout-tuner-panel" aria-label="Layout tuning panel">
          <header className="layout-tuner-header">
            <p className="layout-tuner-title">Layout Tuner</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSidebarWidth(300);
                setAuxWidth(360);
                setPanelHeight(220);
              }}
            >
              Reset
            </button>
          </header>

          <label className="layout-tuner-field" htmlFor="sidebar-width">
            <span>Explorer Width: {sidebarWidth}px</span>
            <input
              id="sidebar-width"
              type="range"
              min={220}
              max={420}
              step={2}
              value={sidebarWidth}
              onChange={(event) => setSidebarWidth(Number(event.target.value))}
            />
          </label>

          <label className="layout-tuner-field" htmlFor="aux-width">
            <span>Auxiliary Width: {auxWidth}px</span>
            <input
              id="aux-width"
              type="range"
              min={280}
              max={520}
              step={2}
              value={auxWidth}
              onChange={(event) => setAuxWidth(Number(event.target.value))}
            />
          </label>

          <label className="layout-tuner-field" htmlFor="panel-height">
            <span>Bottom Panel Height: {panelHeight}px</span>
            <input
              id="panel-height"
              type="range"
              min={140}
              max={340}
              step={2}
              value={panelHeight}
              onChange={(event) => setPanelHeight(Number(event.target.value))}
            />
          </label>
        </section>
      )}
    </div>
  );
}
