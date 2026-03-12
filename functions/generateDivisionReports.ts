import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { generated_by, send_email } = await req.json();

    // Fetch all needed data
    const [schedules, allTeamMembers, completions] = await Promise.all([
      base44.asServiceRole.entities.TrainingSchedule.list(),
      base44.asServiceRole.entities.TeamMember.list(),
      base44.asServiceRole.entities.TrainingCompletion.list(),
    ]);

    // Determine current training week (same logic as sendReminders)
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
      return Response.json({ error: 'No active training found' }, { status: 400 });
    }

    const currentCompletions = completions.filter(c => c.week_number === currentTraining.week_number);
    const completedMemberIds = new Set(currentCompletions.map(c => c.team_member_id));

    const weekOf = currentTraining.scheduled_date;
    const generatedAt = new Date().toISOString();
    const generatedAtFormatted = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'long',
      timeStyle: 'short',
    });
    const generatedDateShort = new Date().toLocaleDateString('en-US');

    // Get Gmail access token if emailing
    let accessToken = null;
    if (send_email) {
      const connection = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = connection.accessToken;
    }

    const divisions = ['East', 'Midwest', 'Southwest', 'Mountain'];
    const results = [];

    for (const division of divisions) {
      const divisionMembers = allTeamMembers
        .filter(m => m.is_active !== false && m.division === division)
        .sort((a, b) => a.name.localeCompare(b.name));

      // --- Generate PDF ---
      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Aeroseal Safety Training — ${division} Division`, 105, 22, { align: 'center' });

      // Subheader
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Week ${currentTraining.week_number}  |  Week of ${weekOf}  |  Generated ${generatedDateShort}`,
        105, 30, { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);

      // Divider
      doc.setLineWidth(0.5);
      doc.line(15, 34, 195, 34);

      // Table header row
      let y = 44;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y - 6, 180, 8, 'F');
      doc.text('Team Member', 20, y);
      doc.text('Status', 160, y);
      doc.setFont('helvetica', 'normal');

      y += 6;

      let completedCount = 0;

      for (const member of divisionMembers) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const completed = completedMemberIds.has(member.id);
        if (completed) completedCount++;

        // Alternate row shading
        if (divisionMembers.indexOf(member) % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(15, y - 5, 180, 8, 'F');
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(member.name, 20, y);

        if (completed) {
          doc.setTextColor(22, 163, 74); // green
          doc.text('✓  Completed', 158, y);
        } else {
          doc.setTextColor(220, 38, 38); // red
          doc.text('✗  Not Completed', 155, y);
        }
        doc.setTextColor(0, 0, 0);

        y += 9;
      }

      // Footer
      y += 4;
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const total = divisionMembers.length;
      const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      doc.text(
        `Total Completed: ${completedCount} of ${total}  |  Completion Rate: ${rate}%`,
        105, y, { align: 'center' }
      );

      // Get PDF bytes and upload
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = `week-${currentTraining.week_number}-${division.toLowerCase()}-report.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });

      // Save DivisionReport record
      await base44.asServiceRole.entities.DivisionReport.create({
        week_number: currentTraining.week_number,
        week_of: weekOf,
        division,
        generated_at: generatedAt,
        generated_by,
        pdf_file: file_url,
      });

      // Send emails if requested
      if (send_email && accessToken) {
        const reportRecipients = divisionMembers.filter(m => m.receive_division_report === true);

        for (const recipient of reportRecipients) {
          const subject = `Week ${currentTraining.week_number} Safety Training Report — ${division} Division`;
          const bodyText = `Please find attached the Week ${currentTraining.week_number} training completion report for the ${division} division. This report reflects completions as of ${generatedAtFormatted}.`;

          const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2)}`;

          // Chunk PDF base64 at 76 chars per line (MIME standard)
          const chunkedPdf = pdfBase64.match(/.{1,76}/g).join('\r\n');

          const mimeLines = [
            `To: ${recipient.email}`,
            `Subject: ${subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/plain; charset=utf-8`,
            `Content-Transfer-Encoding: 7bit`,
            ``,
            bodyText,
            ``,
            `--${boundary}`,
            `Content-Type: application/pdf; name="${fileName}"`,
            `Content-Transfer-Encoding: base64`,
            `Content-Disposition: attachment; filename="${fileName}"`,
            ``,
            chunkedPdf,
            ``,
            `--${boundary}--`,
          ];

          const mimeMessage = mimeLines.join('\r\n');

          // Safe base64url encode for Gmail API
          const encodedBytes = new TextEncoder().encode(mimeMessage);
          let binary = '';
          for (const byte of encodedBytes) {
            binary += String.fromCharCode(byte);
          }
          const encodedEmail = btoa(binary)
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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
            console.error(`Failed to send email to ${recipient.email}:`, err);
          } else {
            console.log(`Sent report email to ${recipient.email} for ${division}`);
          }
        }
      }

      results.push({ division, members: total, completed: completedCount, rate });
    }

    return Response.json({
      success: true,
      week: currentTraining.week_number,
      week_of: weekOf,
      results,
    });

  } catch (error) {
    console.error('Error generating division reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});