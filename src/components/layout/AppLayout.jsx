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
  Users,
  Settings as SettingsIcon,
  Server,
  Lock,
  ArrowUpCircle
} from "lucide-react";
import { PLAN_LEVELS } from "@/lib/useSubscription";
import HelpPanel from "@/components/HelpPanel";
import OnboardingWizard from "@/components/OnboardingWizard";
import PaymentFailedLockdown from "@/components/PaymentFailedLockdown";
import BottomNav from "@/components/layout/BottomNav";
import MobileHeader from "@/components/layout/MobileHeader";
import PageTransition from "@/components/layout/PageTransition";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { useRole } from "@/lib/useRole";
import { useSubscription } from "@/lib/useSubscription";
import { authStore } from "@/lib/localStore";
import { Outlet } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/register", label: "Risk Register", icon: ShieldAlert },
  { path: "/matrix", label: "Risk Matrix", icon: Grid3X3 },
  { path: "/treatments", label: "Treatment Plans", icon: FileText },
  { path: "/audit", label: "Audit Log", icon: ClipboardList, minPlan: "basic" },
  { path: "/agents", label: "AI Agents", icon: Sparkles, minPlan: "professional" },
  { path: "/users", label: "User Management", icon: Users, adminOnly: true, minPlan: "professional" },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
  { path: "/installation", label: "Installation", icon: Server },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { user, isAdmin } = useRole();
  const { plan, isEvaluation, isPastDue, pastDueSubscription } = useSubscription();
  const location = useLocation();
  const mainScrollRef = useScrollPreservation();

  useState(() => {
    authStore.me().then(u => {
      setCurrentUser(u);
      if (u && !u.onboarding_complete) setShowOnboarding(true);
    }).catch(() => {});
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isPastDue && <PaymentFailedLockdown subscription={pastDueSubscription} />}
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
        <div
          className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
        >
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
          {navItems.filter(item => !item.adminOnly || isAdmin).map(({ path, label, icon: Icon, minPlan }) => {
            const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            const planLevel = PLAN_LEVELS[plan] ?? 0;
            const requiredLevel = minPlan ? (PLAN_LEVELS[minPlan] ?? 0) : 0;
            const locked = minPlan && planLevel < requiredLevel;
            return (
              <Link
                key={path}
                to={locked ? "/pricing" : path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active && !locked
                    ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-border"
                    : locked
                    ? "text-sidebar-foreground/40 cursor-pointer hover:bg-sidebar-accent/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in flex-1">{label}</span>
                )}
                {!collapsed && locked && (
                  <Lock className="w-3 h-3 flex-shrink-0 opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade Plan button for evaluation users */}
        {isEvaluation && (
          <div className="px-3 pb-2">
            <Link
              to="/pricing"
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                "bg-sidebar-primary/20 text-sidebar-primary hover:bg-sidebar-primary/30 border border-sidebar-primary/40"
              )}
            >
              <ArrowUpCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {!collapsed && <span>Upgrade Plan</span>}
            </Link>
          </div>
        )}

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
        <div className="lg:hidden flex items-center border-b border-border bg-card" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-3 hover:bg-muted select-none"
            style={{ WebkitUserSelect: "none", userSelect: "none" }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <MobileHeader />
          </div>
        </div>

        {/* Main content — Outlet handles routing */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto pb-0 lg:pb-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="lg:pb-0 pb-16">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}