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
      const status = sub.status;
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString().split('T')[0];
      const cancelAtPeriodEnd = sub.cancel_at_period_end;

      // Resolve plan_name from price ID
      const PRICE_TO_PLAN = {
        'price_1TPJ9NBjqCVrKUQl9ljdt9a6': 'evaluation',
        'price_1TPIUFBjqCVrKUQlwILvFCMM': 'basic',
        'price_1TPIUFBjqCVrKUQlYhtTCcHO': 'professional',
        'price_1TPIUFBjqCVrKUQldtBGHfbq': 'enterprise',
      };
      const priceId = sub.items?.data?.[0]?.price?.id;
      const planName = priceId ? PRICE_TO_PLAN[priceId] : undefined;

      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { stripe_subscription_id: sub.id }, undefined, 1
      );

      if (existing.length > 0) {
        const updateData = {
          status: status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'canceled',
          current_period_end: periodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
        };
        if (planName) updateData.plan_name = planName;
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, updateData);
        console.log(`Updated subscription ${sub.id} status: ${status}, plan: ${planName || 'unchanged'}`);
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

    else if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const subId = invoice.subscription;

      // Restore subscription to active (handles past_due recovery)
      if (subId) {
        const existing = await base44.asServiceRole.entities.Subscription.filter(
          { stripe_subscription_id: subId }, undefined, 1
        );
        if (existing.length > 0 && existing[0].status !== 'active') {
          await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
            status: 'active',
          });
          console.log(`Restored subscription ${subId} to active after successful payment`);
        }
      }

      // Skip email for the first invoice — Stripe already sends a receipt at checkout
      const billingReason = invoice.billing_reason;
      if (billingReason === 'subscription_create') {
        console.log('Skipping invoice email for initial subscription creation');
        return Response.json({ received: true });
      }

      const customerEmail = invoice.customer_email;
      const amountPaid = (invoice.amount_paid / 100).toFixed(2);
      const currency = invoice.currency.toUpperCase();
      const invoiceUrl = invoice.hosted_invoice_url;
      const invoicePdf = invoice.invoice_pdf;
      const periodEnd = new Date(invoice.period_end * 1000).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

      if (customerEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customerEmail,
          subject: `RiskShield – Your invoice for ${currency} $${amountPaid}`,
          body: `
<h2>Thank you for your payment</h2>
<p>Your RiskShield subscription has been renewed successfully.</p>
<table style="border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Amount paid</td><td style="padding:4px 0;font-weight:600;">${currency} $${amountPaid}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Next renewal</td><td style="padding:4px 0;">${periodEnd}</td></tr>
</table>
${invoiceUrl ? `<p><a href="${invoiceUrl}" style="background:#1e3a5f;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View Invoice</a></p>` : ''}
${invoicePdf ? `<p><a href="${invoicePdf}">Download PDF</a></p>` : ''}
<p style="color:#888;font-size:13px;">If you have any questions, reply to this email.</p>
          `.trim(),
        });
        console.log(`Invoice paid email sent to ${customerEmail} for ${currency} $${amountPaid}`);
      }
    }

    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      const customerEmail = invoice.customer_email;
      const amountDue = (invoice.amount_due / 100).toFixed(2);
      const currency = invoice.currency.toUpperCase();
      const invoiceUrl = invoice.hosted_invoice_url;

      // Update subscription status
      const existing = await base44.asServiceRole.entities.Subscription.filter(
        { stripe_subscription_id: subId }, undefined, 1
      );
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
          status: 'past_due',
        });
        console.log(`Marked subscription ${subId} as past_due due to failed payment`);
      }

      // Notify user
      if (customerEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: customerEmail,
          subject: `RiskShield – Action required: Payment failed`,
          body: `
<h2>Your payment could not be processed</h2>
<p>We were unable to collect your RiskShield subscription payment of <strong>${currency} $${amountDue}</strong>.</p>
<p>Please update your payment method to avoid losing access to your account.</p>
${invoiceUrl ? `<p><a href="${invoiceUrl}" style="background:#c0392b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Update Payment Method</a></p>` : ''}
<p style="color:#888;font-size:13px;">If you need help, reply to this email.</p>
          `.trim(),
        });
        console.log(`Payment failed email sent to ${customerEmail}`);
      }
    }

  } catch (err) {
    console.error('Error processing webhook event:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});