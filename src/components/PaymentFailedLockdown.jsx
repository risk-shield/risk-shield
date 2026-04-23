import { AlertTriangle, CreditCard, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

export default function PaymentFailedLockdown({ subscription }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRetryPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("createBillingPortalSession", {});
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      }
    } catch (err) {
      // Fallback: open Stripe customer portal directly or show pricing
      setError("Could not open billing portal. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6">
      <div className="max-w-md w-full bg-card border border-destructive/40 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Payment Failed</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your subscription payment could not be processed. Access to RiskShield has been suspended until your payment is resolved.
          </p>
        </div>

        {subscription?.plan_name && (
          <div className="w-full bg-muted rounded-lg px-4 py-3 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{subscription.plan_name}</span>
            </div>
            {subscription.current_period_end && (
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Period ended</span>
                <span className="font-medium">{subscription.current_period_end}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleRetryPayment}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? "Opening billing portal…" : "Update Payment Method"}
          </button>

          <a
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full border border-border py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-muted transition-colors text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
            View Plans
          </a>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Need help? Contact us at <a href="mailto:support@riskshield.app" className="underline">support@riskshield.app</a>
        </p>
      </div>
    </div>
  );
}