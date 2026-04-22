import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { risk, slackChannel } = await req.json();

    if (!risk || !slackChannel) {
      return Response.json({ error: 'Missing risk or slackChannel' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slack');

    const message = `🚨 *EXTREME RISK ALERT*\n\n*${risk.title}*\nID: ${risk.risk_id}\nCategory: ${risk.category}\nInherent Risk: *${risk.inherent_likelihood * risk.inherent_consequence}* (${risk.inherent_likelihood} × ${risk.inherent_consequence})\nOwner: ${risk.risk_owner || 'Unassigned'}\n\n_Immediate action required_`;

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: slackChannel,
        text: message,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true, message: 'Slack alert sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});