import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only send on new creation
    if (event.type !== 'create') {
      return Response.json({ message: 'Not a new risk' });
    }

    const risk = data;
    const riskOwnerEmail = risk.risk_owner;

    if (!riskOwnerEmail || !riskOwnerEmail.includes('@')) {
      return Response.json({ message: 'No valid risk owner email' });
    }

    const getRiskRating = (likelihood, consequence) => {
      const score = likelihood * consequence;
      if (score >= 20) return 'Extreme';
      if (score >= 12) return 'High';
      if (score >= 6) return 'Medium';
      return 'Low';
    };

    const inherentRating = getRiskRating(risk.inherent_likelihood, risk.inherent_consequence);

    const emailBody = `
Hello,

A new risk has been assigned to you in RiskShield.

Risk ID: ${risk.risk_id}
Risk Title: ${risk.title}
Category: ${risk.category}

Severity: ${inherentRating}
- Likelihood: ${risk.inherent_likelihood}/5
- Consequence: ${risk.inherent_consequence}/5

Description: ${risk.description || 'Not provided'}

Existing Controls: ${risk.existing_controls || 'Not specified'}

Treatment Action Required: ${risk.treatment_action || 'Not specified'}
Target Completion Date: ${risk.target_date || 'Not set'}

Please log in to RiskShield to:
1. Review the complete risk details
2. Assess the inherent and residual risks
3. Plan your mitigation actions
4. Set treatment deadlines

Best regards,
RiskShield Notification System
    `.trim();

    await base44.integrations.Core.SendEmail({
      to: riskOwnerEmail,
      subject: `New Risk Assigned: ${risk.risk_id} - ${risk.title}`,
      body: emailBody,
      from_name: 'RiskShield'
    });

    console.log(`New risk assignment notification sent to ${riskOwnerEmail} for risk ${risk.risk_id}`);
    return Response.json({ success: true, sent_to: riskOwnerEmail });
  } catch (error) {
    console.error('Error in notifyRiskAssignment:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});