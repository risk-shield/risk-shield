import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ hasBetaAccess: false });
    }

    const betaTester = await base44.entities.BetaTester.filter({ 
      email: user.email,
      status: 'approved'
    }, undefined, 1);

    if (betaTester.length === 0) {
      return Response.json({ hasBetaAccess: false });
    }

    const tester = betaTester[0];
    const hasExpired = tester.expires_at && new Date(tester.expires_at) < new Date();

    return Response.json({ 
      hasBetaAccess: !hasExpired,
      expiresAt: tester.expires_at 
    });
  } catch (error) {
    console.error('Beta access check error:', error);
    return Response.json({ hasBetaAccess: false }, { status: 500 });
  }
});