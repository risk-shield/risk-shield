import { useState, useEffect } from "react";
import { authStore } from "@/lib/localStore";

export const ROLES = {
  ADMIN: "admin",
  RISK_MANAGER: "risk_manager",
  VIEWER: "viewer",
};

export function useRole() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authStore.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const role = user?.role || "admin"; // default to admin in standalone mode

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