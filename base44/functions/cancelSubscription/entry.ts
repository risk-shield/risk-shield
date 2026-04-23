import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { user_email: user.email }, undefined, 5
    );
    const activeSub = subs.find(s => s.status === 'active' && s.stripe_subscription_id);

    if (!activeSub) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel at period end (not immediately) — user keeps access until billing period ends
    await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Reflect in our DB immediately
    await base44.asServiceRole.entities.Subscription.update(activeSub.id, {
      cancel_at_period_end: true,
    });

    console.log(`Subscription ${activeSub.stripe_subscription_id} set to cancel at period end for ${user.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});