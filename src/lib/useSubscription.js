import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Plan hierarchy: evaluation < basic < professional < enterprise
export const PLAN_LEVELS = {
  evaluation: 0,
  basic: 1,
  professional: 2,
  enterprise: 3,
};

// Features allowed per plan
export const PLAN_FEATURES = {
  evaluation: [
    "Basic Risk Register",
    "Risk Matrix",
    "Basic Treatment Plans",
  ],
  basic: [
    "Basic Risk Register",
    "Risk Matrix",
    "Treatment Plans",
    "Email Notifications",
    "Audit Log",
  ],
  professional: [
    "Basic Risk Register",
    "Risk Matrix",
    "Treatment Plans",
    "Email Notifications",
    "Audit Log",
    "AI Agents",
    "User Management",
    "Advanced Analytics",
    "API Access",
  ],
  enterprise: ["all"],
};

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Subscription.list("-created_date", 1)
      .then((subs) => {
        const active = subs.find((s) => s.status === "active");
        setSubscription(active || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const plan = subscription?.plan_name || "evaluation";
  const planLevel = PLAN_LEVELS[plan] ?? 0;

  const hasFeature = (feature) => {
    const features = PLAN_FEATURES[plan];
    if (!features) return false;
    if (features.includes("all")) return true;
    return features.includes(feature);
  };

  const meetsMinPlan = (minPlan) => {
    return planLevel >= (PLAN_LEVELS[minPlan] ?? 0);
  };

  return {
    subscription,
    plan,
    planLevel,
    loading,
    hasFeature,
    meetsMinPlan,
    isEvaluation: plan === "evaluation",
  };
}