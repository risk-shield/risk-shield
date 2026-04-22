import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShieldAlert,
  Grid3X3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  ClipboardList,
  Sparkles,
  Users
} from "lucide-react";
import HelpPanel from "@/components/HelpPanel";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useRole } from "@/lib/useRole";
import { base44 } from "@/api/base44Client";
import { Outlet } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/register", label: "Risk Register", icon: ShieldAlert },
  { path: "/matrix", label: "Risk Matrix", icon: Grid3X3 },
  { path: "/treatments", label: "Treatment Plans", icon: FileText },
  { path: "/audit", label: "Audit Log", icon: ClipboardList },
  { path: "/agents", label: "AI Agents", icon: Sparkles },
  { path: "/users", label: "User Management", icon: Users, adminOnly: true },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { user, isAdmin } = useRole();
  const location = useLocation();

  useState(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u && !u.onboarding_complete) setShowOnboarding(true);
    }).catch(() => {});
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {showOnboarding && (
        <OnboardingWizard user={currentUser} onComplete={() => setShowOnboarding(false)} />
      )}
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-50 h-full flex flex-col bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="text-sm font-display text-sidebar-foreground leading-tight">RiskShield</div>
              <div className="text-xs text-sidebar-foreground/50">ISO 31000 · AS4360</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.filter(item => !item.adminOnly || isAdmin).map(({ path, label, icon: Icon }) => {
            const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-border"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="animate-fade-in">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle + Help */}
        <div className="p-2 border-t border-sidebar-border hidden lg:flex items-center justify-between gap-1">
          {!collapsed && <HelpPanel />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {collapsed && <HelpPanel />}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-display text-base text-foreground">RiskShield</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}