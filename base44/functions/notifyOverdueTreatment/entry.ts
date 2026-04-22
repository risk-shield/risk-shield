import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { risk, recipientEmail } = await req.json();

    if (!risk || !recipientEmail) {
      return Response.json({ error: 'Missing risk or recipientEmail' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const targetDate = new Date(risk.target_date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `[RiskShield] Treatment Action Overdue: ${risk.title}`;
    const htmlBody = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d32f2f;">⚠️ Treatment Action Overdue</h2>
        <p><strong>Risk:</strong> ${risk.title}</p>
        <p><strong>Risk ID:</strong> ${risk.risk_id}</p>
        <p><strong>Target Date:</strong> ${targetDate}</p>
        <p><strong>Treatment Option:</strong> ${risk.treatment_option}</p>
        <p><strong>Treatment Owner:</strong> ${risk.treatment_owner || 'Unassigned'}</p>
        <p><strong>Status:</strong> ${risk.status}</p>
        <hr/>
        <p>Please review and update the treatment action in RiskShield.</p>
      </body>
    </html>
    `;

    const message = Buffer.from(
      `To: ${recipientEmail}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${htmlBody}`
    ).toString('base64');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.error.message }, { status: response.status });
    }

    return Response.json({ success: true, message: 'Email sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});