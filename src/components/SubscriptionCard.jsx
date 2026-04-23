import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreditCard, ExternalLink, XCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "@/lib/useSubscription";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  past_due: "bg-amber-100 text-amber-800 border-amber-200",
  canceled: "bg-red-100 text-red-800 border-red-200",
  unpaid: "bg-red-100 text-red-800 border-red-200",
};

export default function SubscriptionCard() {
  const { subscription, plan, loading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [canceled, setCanceled] = useState(false);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke("createBillingPortalSession", {});
      if (res.data?.url) window.open(res.data.url, "_blank");
    } catch (e) {
      console.error("Billing portal error:", e);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      await base44.functions.invoke("cancelSubscription", {});
      setCanceled(true);
      setCancelOpen(false);
    } catch (e) {
      console.error("Cancel error:", e);
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Subscription & Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!subscription ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are on the <span className="font-medium capitalize">{plan}</span> plan with no active subscription.
              </p>
              <Link to="/pricing">
                <Button className="gap-2">Upgrade Plan</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="text-sm font-medium capitalize">{subscription.plan_name} Plan</p>
                  {subscription.current_period_end && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {subscription.cancel_at_period_end ? "Cancels on" : "Renews on"}{" "}
                      {subscription.current_period_end}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={STATUS_STYLES[subscription.status] || ""}
                >
                  {subscription.status === "active" && !subscription.cancel_at_period_end
                    ? "Active"
                    : subscription.cancel_at_period_end
                    ? "Cancels at period end"
                    : subscription.status}
                </Badge>
              </div>

              {canceled || subscription.cancel_at_period_end ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Your subscription will not renew. Access continues until the period end date.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="gap-2"
                >
                  {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  Manage Billing
                </Button>

                {subscription.status === "active" && !subscription.cancel_at_period_end && !canceled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelOpen(true)}
                    className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your access will continue until the end of the current billing period. After that, your account will revert to the Evaluation plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {canceling ? "Canceling…" : "Yes, Cancel"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}