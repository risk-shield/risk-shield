import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Validate caller is admin or this is a scheduled call
  const authHeader = req.headers.get("authorization");
  let isScheduled = false;

  if (!authHeader) {
    isScheduled = true;
  } else {
    const user = await base44.auth.me();
    if (user?.role !== 'admin' && user?.role !== 'risk_manager') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const today = new Date();
  const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7);
  const in14Days = new Date(today); in14Days.setDate(today.getDate() + 14);

  // Get all open risks
  const risks = await base44.asServiceRole.entities.Risk.filter({ status: ["Identified", "Being Treated", "Monitored"] });

  // Get all users who want email notifications
  const users = await base44.asServiceRole.entities.User.list();
  const notifyUsers = users.filter(u => u.notification_email !== false && u.email);

  const results = { sent: 0, overdue: [], dueSoon: [] };

  for (const risk of risks) {
    if (!risk.review_date) continue;
    const reviewDate = new Date(risk.review_date);
    const isOverdue = reviewDate < today;
    const isDueSoon = reviewDate >= today && reviewDate <= in14Days;

    if (isOverdue) results.overdue.push(risk.title);
    if (isDueSoon) results.dueSoon.push(risk.title);

    if (!isOverdue && !isDueSoon) continue;

    // Find the risk owner if they're a user
    const riskOwner = notifyUsers.find(u =>
      u.email === risk.risk_owner || u.full_name === risk.risk_owner
    );

    // Notify admins and risk managers
    const recipients = notifyUsers.filter(u => u.role === 'admin' || u.role === 'risk_manager');
    if (riskOwner && !recipients.find(u => u.id === riskOwner.id)) {
      recipients.push(riskOwner);
    }

    for (const recipient of recipients) {
      const subject = isOverdue
        ? `⚠️ Overdue Risk Review: ${risk.title}`
        : `📅 Risk Review Due Soon: ${risk.title}`;

      const daysDiff = Math.round((reviewDate - today) / (1000 * 60 * 60 * 24));
      const dueLine = isOverdue
        ? `This risk review is **overdue** (was due ${risk.review_date}).`
        : `This risk review is due in **${daysDiff} days** (${risk.review_date}).`;

      const body = `
Dear ${recipient.full_name || recipient.email},

${dueLine}

**Risk Details:**
- Risk ID: ${risk.risk_id || 'N/A'}
- Title: ${risk.title}
- Category: ${risk.category || 'N/A'}
- Current Status: ${risk.status}
- Risk Owner: ${risk.risk_owner || 'Unassigned'}
- Inherent Rating: L${risk.inherent_likelihood} × C${risk.inherent_consequence}

**Required Action:**
Please log in to RiskShield to review this risk, update its status, and set a new review date if appropriate.

This notification is generated automatically by RiskShield in accordance with AS ISO 31000:2018 monitoring and review requirements.

Regards,
RiskShield Automated Monitoring
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient.email,
        subject,
        body
      });

      results.sent++;
    }
  }

  return Response.json({
    success: true,
    summary: `Sent ${results.sent} reminder emails. Overdue: ${results.overdue.length}, Due soon: ${results.dueSoon.length}.`,
    ...results
  });
});