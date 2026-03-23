import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

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

    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      bodyHtml,
    ];
    const rawEmail = emailLines.join('\r\n');
    const encodedBytes = new TextEncoder().encode(rawEmail);
    let binary = '';
    for (const byte of encodedBytes) binary += String.fromCharCode(byte);
    const encodedEmail = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: 500 });
    }

    return Response.json({ success: true, sent_to: to });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});