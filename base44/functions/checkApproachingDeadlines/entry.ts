import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all risks with treatment deadlines
    const risks = await base44.asServiceRole.entities.Risk.list();
    
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const notificationsSent = [];
    
    for (const risk of risks) {
      // Skip if no target date or if already closed
      if (!risk.target_date || risk.status === 'Closed') {
        continue;
      }
      
      const targetDate = new Date(risk.target_date);
      
      // Check if deadline is within 7-14 days (approaching) or overdue
      if (targetDate <= sevenDaysFromNow) {
        const riskOwnerEmail = risk.risk_owner;
        const treatmentOwnerEmail = risk.treatment_owner;
        
        // Send to both owners if they exist
        const recipients = [...new Set([riskOwnerEmail, treatmentOwnerEmail])].filter(
          e => e && e.includes('@')
        );
        
        if (recipients.length === 0) continue;
        
        const daysUntilDeadline = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        const deadlineStatus = daysUntilDeadline <= 0 
          ? `OVERDUE by ${Math.abs(daysUntilDeadline)} days` 
          : `Due in ${daysUntilDeadline} days`;
        
        const urgencyLevel = daysUntilDeadline <= 0 ? 'URGENT' : 'APPROACHING';
        
        const emailBody = `
Hello,

${urgencyLevel}: A risk treatment deadline is ${deadlineStatus}.

Risk ID: ${risk.risk_id}
Risk Title: ${risk.title}
Category: ${risk.category}

Target Completion Date: ${risk.target_date}
Days Remaining: ${daysUntilDeadline}

Current Status: ${risk.status}
Treatment Action: ${risk.treatment_action || 'Not specified'}

Risk Owner: ${risk.risk_owner}
Treatment Owner: ${risk.treatment_owner || 'Not assigned'}

Please log in to RiskShield immediately to:
1. Review the treatment progress
2. Update the deadline if necessary
3. Complete or reschedule the treatment action
4. Mark as complete when finished

Best regards,
RiskShield Notification System
        `.trim();
        
        for (const recipient of recipients) {
          try {
            await base44.integrations.Core.SendEmail({
              to: recipient,
              subject: `${urgencyLevel}: Risk Treatment Deadline ${deadlineStatus} - ${risk.risk_id}`,
              body: emailBody,
              from_name: 'RiskShield'
            });
            notificationsSent.push({ risk_id: risk.risk_id, recipient, status: 'sent' });
            console.log(`Deadline reminder sent to ${recipient} for risk ${risk.risk_id}`);
          } catch (error) {
            console.error(`Failed to send email to ${recipient}:`, error.message);
            notificationsSent.push({ risk_id: risk.risk_id, recipient, status: 'failed', error: error.message });
          }
        }
      }
    }
    
    return Response.json({ 
      success: true, 
      notificationsSent: notificationsSent.length,
      details: notificationsSent 
    });
  } catch (error) {
    console.error('Error in checkApproachingDeadlines:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});