import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled calls (no user) or admin users
    const user = await base44.auth.me().catch(() => null);
    if (user !== null && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { generated_by = 'Scheduled', send_email = true, divisions: requestedDivisions } = body;

    // For scheduled runs, check if the feature is enabled
    if (generated_by === 'Scheduled') {
      const settingsList = await base44.asServiceRole.entities.ReportScheduleSettings.list();
      if (settingsList.length > 0 && settingsList[0].is_enabled === false) {
        return Response.json({ skipped: true, reason: 'Scheduled reports are disabled.' });
      }
    }

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
    const generatedDateShort = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit', year: 'numeric' });
    const weekOfFormatted = (() => { const [y, m, d] = weekOf.split('-'); return `${m}/${d}/${y}`; })();

    // Get Gmail access token if emailing
    let accessToken = null;
    if (send_email) {
      const connection = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = connection.accessToken;
    }

    const divisions = (requestedDivisions && requestedDivisions.length > 0)
      ? requestedDivisions
      : ['East', 'Midwest', 'Southwest', 'Mountain'];
    const results = [];

    for (const division of divisions) {
      const divisionMembers = allTeamMembers
        .filter(m => m.is_active !== false && m.division === division)
        .sort((a, b) => a.name.localeCompare(b.name));

      // --- Generate PDF ---
      const doc = new jsPDF();
      const pageW = 210;
      const margin = 15;
      const colW = (pageW - margin * 2 - 6) / 2;

      const completedMembers = divisionMembers.filter(m => completedMemberIds.has(m.id));
      const notCompletedMembers = divisionMembers.filter(m => !completedMemberIds.has(m.id));
      const completedCount = completedMembers.length;
      const total = divisionMembers.length;
      const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      // --- TOP ACCENT BAR ---
      const barH = 5;
      const greenW = total > 0 ? (pageW * completedCount / total) : 0;
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, greenW, barH, 'F');
      doc.setFillColor(220, 38, 38);
      doc.rect(greenW, 0, pageW - greenW, barH, 'F');

      // --- HEADER ---
      let y = barH + 10;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${division.toUpperCase()} DIVISION`, margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('AEROSEAL SAFETY TRAINING', margin, y);
      y += 5;
      doc.text(
        `Week ${currentTraining.week_number}  ·  Week of ${weekOf}  ·  Generated ${generatedDateShort}`,
        margin, y
      );

      // Completion rate block (top-right)
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rate >= 100 ? 22 : rate >= 50 ? 15 : 220, rate >= 100 ? 163 : rate >= 50 ? 23 : 38, rate >= 100 ? 74 : rate >= 50 ? 42 : 38);
      doc.text(`${rate}%`, pageW - margin, barH + 12, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${completedCount} of ${total} members`, pageW - margin, barH + 20, { align: 'right' });

      // --- DIVIDER ---
      y += 7;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // --- TWO-COLUMN SECTION HEADERS ---
      const leftX = margin;
      const rightX = margin + colW + 6;

      // Left column header — green
      doc.setFillColor(240, 253, 244);
      doc.rect(leftX, y - 5, colW, 9, 'F');
      doc.setDrawColor(22, 163, 74);
      doc.setLineWidth(0.8);
      doc.line(leftX, y - 5, leftX, y + 4);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61);
      doc.text(`✓ COMPLETED (${completedCount})`, leftX + 3, y);

      // Right column header — red
      doc.setFillColor(255, 245, 245);
      doc.rect(rightX, y - 5, colW, 9, 'F');
      doc.setDrawColor(220, 38, 38);
      doc.line(rightX, y - 5, rightX, y + 4);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text(`✗ NOT COMPLETED (${notCompletedMembers.length})`, rightX + 3, y);

      y += 8;

      // --- MEMBER ROWS ---
      const rowH = 7;
      const maxRows = Math.max(completedMembers.length, notCompletedMembers.length);

      for (let i = 0; i < maxRows; i++) {
        if (y > 272) {
          doc.addPage();
          y = 15;
        }

        // Alternating background
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(leftX, y - 5, colW, rowH, 'F');
          doc.rect(rightX, y - 5, colW, rowH, 'F');
        }

        // Completed member (left)
        if (i < completedMembers.length) {
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(22, 101, 52);
          doc.text(`✓  ${completedMembers[i].name}`, leftX + 3, y);
        }

        // Not completed member (right — bold red)
        if (i < notCompletedMembers.length) {
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(185, 28, 28);
          doc.text(`✗  ${notCompletedMembers[i].name}`, rightX + 3, y);
        }

        y += rowH;
      }

      // --- FOOTER ---
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 7;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, y - 3, pageW, 12, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Aeroseal Safety Training  —  Automated Report  —  Confidential`,
        105, y + 4, { align: 'center' }
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
          const subject = `Week ${currentTraining.week_number} Safety Training Report - ${division} Division`;
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