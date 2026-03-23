import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Automation IDs for the three existing reminder automations
const REMINDER_AUTOMATION_IDS = [
  '69a57632c1c119d83527b9f8', // Monday
  '69a57632c1c119d83527b9f9', // Wednesday
  '69a57632c1c119d83527b9fa', // Friday
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { is_enabled, days_of_week, send_time } = await req.json();

    // Upsert the settings record
    const existing = await base44.asServiceRole.entities.ReminderScheduleSettings.list();
    if (existing.length > 0) {
      await base44.asServiceRole.entities.ReminderScheduleSettings.update(existing[0].id, {
        is_enabled,
        days_of_week,
        send_time,
      });
    } else {
      await base44.asServiceRole.entities.ReminderScheduleSettings.create({
        is_enabled,
        days_of_week,
        send_time,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving reminder schedule:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});