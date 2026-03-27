import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { Resend } from 'npm:resend';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { to, first_name = 'there', reminder_type = 'reminder' } = await req.json();
    const appUrl = Deno.env.get('APP_URL') || 'https://your-app-url.base44.app';

    // Fetch current training week for real subject/title
    const schedules = await base44.asServiceRole.entities.TrainingSchedule.list();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sorted = schedules.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    let currentTraining = sorted[0];
    for (const s of sorted) {
      const d = new Date(s.scheduled_date);
      d.setHours(0, 0, 0, 0);
      if (today >= d) currentTraining = s;
      else break;
    }
    const videoTitle = currentTraining?.video_title || '[Current Week Video Title]';
    const weekNumber = currentTraining?.week_number || '?';

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const subject = reminder_type === 'new'
      ? `New Safety Training Available: Week ${weekNumber}`
      : reminder_type === 'final'
      ? `⚠️ Final Reminder: Complete Your Safety Training Today`
      : `Reminder: Complete Your Safety Training`;

    const introLine = reminder_type === 'new'
      ? `A new safety training video is available for Week ${weekNumber}.`
      : reminder_type === 'final'
      ? `This is your final reminder for this week. Please complete your safety training today.`
      : `This is a reminder to complete your safety training for this week.`;

    const bodyHtml = `<p>Hello ${first_name},</p>
<p>${introLine}</p>
<p>Training: ${videoTitle}</p>
<p><a href="${appUrl}/Training">Complete your training</a></p>
<p>Thank you for prioritizing safety!</p>
<p>Aeroseal Safety Team</p>`;

    const { error } = await resend.emails.send({
      from: 'Aeroseal Safety Team <notifications@aeroseal.com>',
      to: to,
      subject: subject,
      html: bodyHtml,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ success: true, sent_to: to });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});