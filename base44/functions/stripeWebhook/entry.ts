import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('Stripe event received:', event.type);

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email || session.customer_email;
      const plan = session.metadata?.plan;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (!userEmail || !plan || !subscriptionId) {
        console.error('Missing required metadata:', { userEmail, plan, subscriptionId });
        return Response.json({ received: true });
      }

      // Fetch subscription details from Stripe for period end
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString().split('T')[0];

      // Check if subscription record already exists for this user
      const existing = await base44.asServiceRole.entities.Subscription.filter({ user_email: userEmail }, undefined, 1);

      if (existing.length > 0) {
        // Update existing subscription
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_name: plan,
          status: 'active',
          current_period_end: periodEnd,
          cancel_at_period_end: false,
        });
        console.log(`Updated subscription for ${userEmail} to plan: ${plan}`);
      } else {
        // Create new subscription record
        await base44.asServiceRole.entities.Subscription.create({
          user_email: userEmail,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_name: plan,
          status: 'active',
          current_period_end: periodEnd,
          cancel_at_period_end: false,
        });
        console.log(`Created subscription for ${userEmail} with plan: ${plan}`);
      }
    }

    else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const customerId = sub.customer;
      const status = sub.status;
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString().split('T')[0];
      const cancelAtPeriodEnd = sub.cancel_at_period_end;

      // Find subscription by stripe_subscription_id
      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { stripe_subscription_id: sub.id }, undefined, 1
      );

      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'canceled',
          current_period_end: periodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
        });
        console.log(`Updated subscription ${sub.id} status to: ${status}`);
      }
    }

    else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { stripe_subscription_id: sub.id }, undefined, 1
      );
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: 'canceled',
        });
        console.log(`Marked subscription ${sub.id} as canceled`);
      }
    }

    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { stripe_subscription_id: subId }, undefined, 1
      );
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: 'past_due',
        });
        console.log(`Marked subscription ${subId} as past_due due to failed payment`);
      }
    }

  } catch (err) {
    console.error('Error processing webhook event:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});