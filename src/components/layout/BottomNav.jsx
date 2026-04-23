import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShieldAlert, Grid3X3, FileText, Settings as SettingsIcon } from "lucide-react";

const bottomNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/register", label: "Register", icon: ShieldAlert },
  { path: "/matrix", label: "Matrix", icon: Grid3X3 },
  { path: "/treatments", label: "Treatments", icon: FileText },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {bottomNavItems.map(({ path, label, icon: Icon }) => {
        const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors select-none",
              active
                ? "text-sidebar-primary"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
            style={{ WebkitUserSelect: "none", userSelect: "none" }}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}