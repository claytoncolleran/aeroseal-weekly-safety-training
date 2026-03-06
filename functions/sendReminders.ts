import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all data
    const schedules = await base44.asServiceRole.entities.TrainingSchedule.list();
    const teamMembers = await base44.asServiceRole.entities.TeamMember.list();
    const completions = await base44.asServiceRole.entities.TrainingCompletion.list();

    // Determine current week's training
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedSchedules = schedules.sort((a, b) =>
      new Date(a.scheduled_date) - new Date(b.scheduled_date)
    );

    let currentTraining = sortedSchedules[0];
    for (const schedule of sortedSchedules) {
      const scheduleDate = new Date(schedule.scheduled_date);
      scheduleDate.setHours(0, 0, 0, 0);
      if (today >= scheduleDate) {
        currentTraining = schedule;
      } else {
        break;
      }
    }

    if (!currentTraining) {
      return Response.json({ message: 'No active training found', sent: 0 });
    }

    // Get completions for current week
    const currentCompletions = completions.filter(
      c => c.week_number === currentTraining.week_number
    );
    const completedMemberIds = new Set(currentCompletions.map(c => c.team_member_id));

    // Find members who haven't completed
    const activeMembers = teamMembers.filter(m => m.is_active !== false);
    const pendingMembers = activeMembers.filter(m => !completedMemberIds.has(m.id));

    // Determine day type for message
    const dayOfWeek = today.getDay();
    let reminderType = 'reminder';
    if (dayOfWeek === 1) reminderType = 'new';
    else if (dayOfWeek === 3) reminderType = 'midweek';
    else if (dayOfWeek === 5) reminderType = 'final';

    const appUrl = Deno.env.get('APP_URL') || 'https://your-app-url.base44.app';

    // Get Gmail access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    const telnyxApiKey = Deno.env.get('TELNYX_API_KEY');
    const telnyxFromNumber = Deno.env.get('TELNYX_FROM_NUMBER');

    let emailSentCount = 0;
    let smsSentCount = 0;

    for (const member of pendingMembers) {
      const subject = reminderType === 'new'
        ? `New Safety Training Available: Week ${currentTraining.week_number}`
        : reminderType === 'final'
        ? `⚠️ Final Reminder: Complete Your Safety Training Today`
        : `Reminder: Complete Your Safety Training`;

      const bodyText = `Hello ${member.name},

${reminderType === 'new'
  ? `A new safety training video is available for Week ${currentTraining.week_number}.`
  : reminderType === 'final'
  ? `This is your final reminder for this week. Please complete your safety training today.`
  : `This is a reminder to complete your safety training for this week.`
}

Training: ${currentTraining.video_title}

Watch the video: ${currentTraining.video_link}

Complete your training form: ${appUrl}/Training

Please watch the video and submit the completion form as soon as possible.

Thank you for prioritizing safety!

Safety Training Team`.trim();

      // Send email via Gmail
      const emailLines = [
        `To: ${member.email}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        bodyText,
      ];
      const rawEmail = emailLines.join('\r\n');
      const encodedEmail = btoa(rawEmail).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      try {
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
          console.error(`Failed to send email to ${member.email}:`, err);
        } else {
          emailSentCount++;
        }
      } catch (emailError) {
        console.error(`Failed to send email to ${member.email}:`, emailError);
      }

      // SMS PAUSED - awaiting 10DLC compliance approval
      // Send SMS via Telnyx if member has a phone number
      if (false && member.phone && telnyxApiKey && telnyxFromNumber) {
        const smsText = reminderType === 'new'
          ? `Hi ${member.name}, new safety training is available for Week ${currentTraining.week_number}: "${currentTraining.video_title}". Complete it here: ${appUrl}/Training`
          : reminderType === 'final'
          ? `⚠️ Final reminder, ${member.name}: Please complete your safety training today. "${currentTraining.video_title}" - ${appUrl}/Training`
          : `Reminder, ${member.name}: Please complete this week's safety training. "${currentTraining.video_title}" - ${appUrl}/Training`;

        try {
          const smsRes = await fetch('https://api.telnyx.com/v2/messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${telnyxApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: telnyxFromNumber,
              to: member.phone,
              text: smsText,
            }),
          });

          if (!smsRes.ok) {
            const err = await smsRes.text();
            console.error(`Failed to send SMS to ${member.phone}:`, err);
          } else {
            smsSentCount++;
          }
        } catch (smsError) {
          console.error(`Failed to send SMS to ${member.phone}:`, smsError);
        }
      }
    }

    return Response.json({
      message: 'Reminders sent successfully',
      emailSent: emailSentCount,
      smsSent: smsSentCount,
      pending: pendingMembers.length,
      currentWeek: currentTraining.week_number,
      reminderType: reminderType,
    });

  } catch (error) {
    console.error('Error sending reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});