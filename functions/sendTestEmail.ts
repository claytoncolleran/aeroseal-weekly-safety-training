import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { to, first_name = 'there' } = await req.json();
    const appUrl = Deno.env.get('APP_URL') || 'https://your-app-url.base44.app';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const subject = `Reminder: Complete Your Safety Training`;
    const bodyHtml = `<p>Hello ${first_name},</p>
<p>This is a reminder to complete your safety training for this week.</p>
<p>Training: [Current Week Video Title]</p>
<p><a href="${appUrl}/Training">Complete Your Training Form</a></p>
<p>Please watch the video and submit the completion form as soon as possible.</p>
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