import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ hasAccess: false, reason: 'not_authenticated' });
    }

    const subscription = await base44.entities.Subscription.filter({
      user_email: user.email,
      status: 'active'
    }, undefined, 1);

    if (subscription.length > 0) {
      return Response.json({ 
        hasAccess: true, 
        reason: 'paid_subscriber',
        plan: subscription[0].plan_name
      });
    }

    const betaTester = await base44.entities.BetaTester.filter({
      email: user.email,
      status: 'approved'
    }, undefined, 1);

    if (betaTester.length > 0) {
      const tester = betaTester[0];
      const hasExpired = tester.expires_at && new Date(tester.expires_at) < new Date();
      
      if (!hasExpired) {
        return Response.json({ 
          hasAccess: true, 
          reason: 'beta_tester',
          expiresAt: tester.expires_at 
        });
      }
    }

    return Response.json({ hasAccess: false, reason: 'no_access' });
  } catch (error) {
    console.error('Subscription access check error:', error);
    return Response.json({ hasAccess: false, reason: 'error' }, { status: 500 });
  }
});