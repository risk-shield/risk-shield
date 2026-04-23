import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICES = {
  evaluation: 'price_1TPJ9NBjqCVrKUQl9ljdt9a6',
  basic: 'price_1TPIUFBjqCVrKUQlwILvFCMM',
  professional: 'price_1TPIUFBjqCVrKUQlYhtTCcHO',
  enterprise: 'price_1TPIUFBjqCVrKUQldtBGHfbq'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!PRICES[plan]) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Reuse existing Stripe customer if available to prevent duplicate subscriptions
    const existingSubs = await base44.asServiceRole.entities.Subscription.filter(
      { user_email: user.email }, undefined, 5
    );
    const existingCustomerId = existingSubs.find(s => s.stripe_customer_id)?.stripe_customer_id;

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: `${req.headers.get('origin')}/pricing?success=true`,
      cancel_url: `${req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        plan: plan
      }
    };

    // Use existing customer to prevent Stripe creating duplicate subscriptions
    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});