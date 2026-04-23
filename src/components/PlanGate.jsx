import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";

/**
 * Wraps content that requires a minimum plan.
 * If the user doesn't meet the plan, renders a locked overlay instead.
 * minPlan: 'basic' | 'professional' | 'enterprise'
 */
export default function PlanGate({ minPlan = "basic", children, featureName }) {
  const { meetsMinPlan, loading } = useSubscription();

  if (loading) return null;

  if (meetsMinPlan(minPlan)) {
    return children;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg z-10">
        <Lock className="w-6 h-6 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground mb-1">
          {featureName ? `${featureName} requires` : "Requires"}{" "}
          <span className="capitalize font-semibold text-primary">{minPlan}</span> plan
        </p>
        <Link
          to="/pricing"
          className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
        >
          Upgrade now →
        </Link>
      </div>
    </div>
  );
}