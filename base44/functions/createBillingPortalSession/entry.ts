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

    // Find the user's subscription to get their Stripe customer ID
    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { user_email: user.email }, undefined, 5
    );

    // Look for past_due or any subscription with a customer ID
    const sub = subs.find(s => s.stripe_customer_id);
    if (!sub) {
      return Response.json({ error: 'No subscription found' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${req.headers.get('origin') || 'https://risk-shield.base44.app'}/settings`,
    });

    console.log(`Billing portal session created for ${user.email}`);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});