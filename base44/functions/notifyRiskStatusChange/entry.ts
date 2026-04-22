import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data, changed_fields } = await req.json();

    // Only send if status changed
    if (!changed_fields.includes('status')) {
      return Response.json({ message: 'Status did not change' });
    }

    const risk = data;
    const riskOwnerEmail = risk.risk_owner;
    const oldStatus = old_data?.status || 'Unknown';
    const newStatus = risk.status;

    if (!riskOwnerEmail || !riskOwnerEmail.includes('@')) {
      return Response.json({ message: 'No valid risk owner email' });
    }

    const statusMessages = {
      'Identified': 'Risk has been identified and requires attention',
      'Being Treated': 'Risk is currently being treated with mitigation actions',
      'Monitored': 'Risk is under monitoring',
      'Closed': 'Risk has been closed and is no longer active'
    };

    const emailBody = `
Hello,

The status of a risk assigned to you has changed.

Risk ID: ${risk.risk_id}
Risk Title: ${risk.title}
Category: ${risk.category}

Status Change: ${oldStatus} → ${newStatus}
Description: ${statusMessages[newStatus] || newStatus}

Current Details:
- Risk Owner: ${risk.risk_owner}
- Inherent Risk: ${risk.inherent_likelihood}/5 likelihood, ${risk.inherent_consequence}/5 consequence
- Treatment Action: ${risk.treatment_action || 'Not specified'}
- Target Date: ${risk.target_date || 'Not set'}

Please log in to RiskShield to review the complete risk details and any required actions.

Best regards,
RiskShield Notification System
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: riskOwnerEmail,
      subject: `Risk Status Changed: ${risk.risk_id} - ${risk.title}`,
      body: emailBody,
      from_name: 'RiskShield'
    });

    console.log(`Notification sent to ${riskOwnerEmail} for risk ${risk.risk_id}`);
    return Response.json({ success: true, sent_to: riskOwnerEmail });
  } catch (error) {
    console.error('Error in notifyRiskStatusChange:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});