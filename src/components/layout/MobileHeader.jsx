import { useLocation, useNavigate } from "react-router-dom";
import { Shield, ChevronLeft } from "lucide-react";

const ROOT_PATHS = ["/", "/register", "/matrix", "/treatments", "/audit", "/agents", "/users", "/settings", "/installation"];

function getSubPageTitle(pathname) {
  if (pathname === "/register/add") return "Add Risk";
  if (pathname.startsWith("/register/edit")) return "Edit Risk";
  return "";
}

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSubPage = !ROOT_PATHS.includes(location.pathname);
  const title = getSubPageTitle(location.pathname);

  if (isSubPage) {
    return (
      <div className="flex items-center gap-2 px-2 py-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded-md hover:bg-muted select-none flex items-center gap-1 text-primary"
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        {title && <span className="font-display text-base text-foreground">{title}</span>}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-3 select-none"
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      <Shield className="w-4 h-4 text-primary" />
      <span className="font-display text-base text-foreground">RiskShield</span>
    </div>
  );
}