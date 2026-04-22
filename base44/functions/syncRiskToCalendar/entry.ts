import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { risk } = await req.json();

    if (!risk || !risk.target_date) {
      return Response.json({ error: 'Missing risk or target_date' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const startDate = risk.target_date;
    const endDate = new Date(new Date(risk.target_date).getTime() + 86400000).toISOString().split('T')[0];

    const event = {
      summary: `[RiskShield] Treatment: ${risk.title}`,
      description: `Risk ID: ${risk.risk_id}\nCategory: ${risk.category}\nTreatment Option: ${risk.treatment_option}\nOwner: ${risk.treatment_owner || 'Unassigned'}`,
      start: {
        date: startDate,
      },
      end: {
        date: endDate,
      },
      colorId: '4',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 240 },
        ],
      },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.error.message }, { status: response.status });
    }

    const result = await response.json();
    return Response.json({ success: true, eventId: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});