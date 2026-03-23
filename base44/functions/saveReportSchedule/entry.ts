import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { is_enabled, day_of_week, send_time } = await req.json();

    const settingsList = await base44.asServiceRole.entities.ReportScheduleSettings.list();

    if (settingsList.length > 0) {
      await base44.asServiceRole.entities.ReportScheduleSettings.update(settingsList[0].id, {
        is_enabled,
        day_of_week,
        send_time,
      });
    } else {
      await base44.asServiceRole.entities.ReportScheduleSettings.create({
        is_enabled,
        day_of_week,
        send_time,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});