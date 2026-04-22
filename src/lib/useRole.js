import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Role hierarchy: admin > risk_manager > viewer
export const ROLES = {
  ADMIN: "admin",
  RISK_MANAGER: "risk_manager",
  VIEWER: "viewer",
};

export function useRole() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const role = user?.role || "viewer";

  return {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    isRiskManager: role === "admin" || role === "risk_manager",
    canEdit: role === "admin" || role === "risk_manager",
    canDelete: role === "admin",
    canManageUsers: role === "admin",
  };
}