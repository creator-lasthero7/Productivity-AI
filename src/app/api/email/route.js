import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getDbPath = () => path.join(process.cwd(), 'src', 'data', 'db.json');

const readDb = () => {
  const filePath = getDbPath();
  const fileData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileData);
};

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const recipientEmail = body.email || 'user@productivity.ai';
    const recipientName = body.name || 'ProductivityAI User';

    // ─── DEADLINE ALERT EMAIL MODE ───
    if (body.type === 'deadline-alert' && body.alerts?.length > 0) {
      const alerts = body.alerts;

      const urgencyColors = {
        CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5', label: '🚨 CRITICAL' },
        HIGH: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#fdba74', label: '🔥 HIGH' },
        APPROACHING: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fcd34d', label: '⏰ APPROACHING' },
      };

      const alertRows = alerts.map((a) => {
        const colors = urgencyColors[a.urgency] || urgencyColors.APPROACHING;
        return `
          <tr>
            <td style="padding: 16px; background: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 8px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 16px; font-weight: 700; color: #ffffff;">${a.title}</span>
                <span style="font-size: 11px; font-weight: 700; color: ${colors.text}; background: ${colors.bg}; padding: 3px 8px; border-radius: 6px; border: 1px solid ${colors.border};">${colors.label}</span>
              </div>
              <div style="font-size: 14px; color: #d1d5db; line-height: 1.5; margin-bottom: 6px;">${a.text}</div>
              <div style="font-size: 12px; color: #9ca3af;">⏱ Due in: <strong style="color: ${colors.text};">${a.timeLeft}</strong> · Priority: ${a.priority}</div>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
        `;
      }).join('');

      const deadlineHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>⏰ Deadline Alert — ProductivityAI</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050505; color: #f3f4f6; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: rgba(18, 18, 18, 0.95); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              
              <!-- Header with urgent gradient -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #f97316 50%, #f59e0b 100%); padding: 35px 20px; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">⏰</div>
                <div style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">Deadline Alert</div>
                <div style="color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px;">${alerts.length} task${alerts.length > 1 ? 's' : ''} approaching deadline</div>
              </div>

              <!-- Content -->
              <div style="padding: 30px 24px;">
                <div style="font-size: 16px; margin-bottom: 8px; color: #ffffff;">
                  Hey ${recipientName}! 👋
                </div>
                <p style="line-height: 1.6; color: #d1d5db; font-size: 14px; margin-bottom: 24px;">
                  You have upcoming deadlines that need your attention. Here's a quick summary of what's due soon:
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  ${alertRows}
                </table>

                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 28px;">
                  <a href="http://localhost:3000/dashboard" style="display: inline-block; background: linear-gradient(135deg, #dc2626, #f97316); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
                    Open Dashboard →
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px 24px; text-align: center; font-size: 12px; color: #6b7280; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05);">
                Sent automatically by ProductivityAI Hub · <a href="http://localhost:3000/settings" style="color: #f97316; text-decoration: none;">Notification Settings</a>
              </div>
            </div>
          </body>
        </html>
      `;

      // Send using nodemailer or simulate
      let nodemailer;
      try { nodemailer = require('nodemailer'); } catch (e) { /* not installed */ }

      let sent = false;
      let transportInfo = '';

      if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });

          await transporter.sendMail({
            from: `"ProductivityAI Alert" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: `⏰ Deadline Alert: ${alerts.length} task${alerts.length > 1 ? 's' : ''} due soon!`,
            html: deadlineHtml,
          });

          sent = true;
          transportInfo = `Deadline alert sent via SMTP to ${recipientEmail}`;
        } catch (err) {
          console.error('Nodemailer deadline email failed:', err);
        }
      }

      if (!sent) {
        console.log(`[SIMULATION] Deadline alert email to: ${recipientEmail}`);
        console.log(`[SIMULATION] ${alerts.length} deadline alerts dispatched.`);
        transportInfo = `Simulated deadline alert dispatch to ${recipientEmail}`;
      }

      return NextResponse.json({
        success: true,
        sent,
        simulated: !sent,
        message: transportInfo,
        email: { to: recipientEmail, subject: `⏰ Deadline Alert`, html: deadlineHtml },
      });
    }

    // ─── ORIGINAL DIGEST EMAIL MODE (unchanged below) ───

    const db = readDb();
    
    // Compile stats
    const totalTasks = db.tasks.length;
    const completedTasks = db.tasks.filter(t => t.done).length;
    const pendingTasks = db.tasks.filter(t => !t.done);
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const activeHabits = db.habits || [];
    const activeGoals = db.goals || [];

    // Generate beautifully styled HTML email with premium glassmorphism themes
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ProductivityAI Performance Digest</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #050505;
              color: #f3f4f6;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: rgba(18, 18, 18, 0.8);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            }
            .header {
              background: linear-gradient(135deg, #0d9488 0%, #7c3aed 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 1px;
              color: #ffffff;
              margin-bottom: 8px;
            }
            .subtitle {
              color: rgba(255,255,255,0.85);
              font-size: 14px;
            }
            .content {
              padding: 30px 24px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #ffffff;
            }
            .stat-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: rgba(255,255,255,0.03);
              border: 1px solid rgba(255,255,255,0.06);
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            .stat-val {
              font-size: 32px;
              font-weight: bold;
              color: #0d9488;
              margin-bottom: 4px;
            }
            .stat-label {
              font-size: 12px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              border-bottom: 1px solid rgba(255,255,255,0.08);
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 16px;
              color: #ffffff;
            }
            .item-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid rgba(255,255,255,0.03);
              font-size: 14px;
            }
            .item-row:last-child {
              border-bottom: none;
            }
            .badge {
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 10px;
              font-weight: bold;
            }
            .badge-high { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
            .badge-med { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
            .badge-low { background: rgba(13, 148, 136, 0.15); color: #0d9488; }
            .footer {
              padding: 24px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              background: rgba(0,0,0,0.2);
              border-top: 1px solid rgba(255,255,255,0.05);
            }
            .footer a {
              color: #0d9488;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚡ ProductivityAI</div>
              <div class="subtitle">Your Personalized Performance Digest</div>
            </div>
            <div class="content">
              <div class="greeting">Hello, ${recipientName}!</div>
              <p style="line-height: 1.5; color: #d1d5db; font-size: 14px;">
                Here is your current status overview. Keep pushing towards your goals! Below you will find your metrics and remaining items for today.
              </p>
              
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-val">${taskCompletionRate}%</div>
                  <div class="stat-label">Tasks Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-val">${pendingTasks.length}</div>
                  <div class="stat-label">Pending Tasks</div>
                </div>
              </div>

              ${pendingTasks.length > 0 ? `
                <div class="section-title">Remaining Tasks</div>
                <ul class="item-list">
                  ${pendingTasks.slice(0, 5).map(t => `
                    <li class="item-row">
                      <span>${t.marker?.value || '•'} <strong>${t.title}</strong></span>
                      <span class="badge badge-${t.priority.toLowerCase() === 'high' ? 'high' : t.priority.toLowerCase() === 'medium' ? 'med' : 'low'}">${t.priority}</span>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 14px;">
                  🎉 Amazing work! You have no pending tasks.
                </div>
              `}

              ${activeHabits.length > 0 ? `
                <div class="section-title">Active Habit Streaks</div>
                <ul class="item-list">
                  ${activeHabits.map(h => `
                    <li class="item-row">
                      <span>${h.emoji || '🔥'} ${h.name}</span>
                      <span style="color: #f59e0b; font-weight: bold;">${h.streak} day streak</span>
                    </li>
                  `).join('')}
                </ul>
              ` : ''}

              ${activeGoals.length > 0 ? `
                <div class="section-title">Goals Progress</div>
                <ul class="item-list">
                  ${activeGoals.map(g => `
                    <li class="item-row">
                      <span>${g.emoji || '🎯'} ${g.title}</span>
                      <span style="color: #7c3aed; font-weight: bold;">${g.progress}% Done</span>
                    </li>
                  `).join('')}
                </ul>
              ` : ''}
            </div>
            <div class="footer">
              Sent automatically by ProductivityAI Hub.<br>
              Change your notifications preferences in <a href="http://localhost:3000/settings">Settings</a>.
            </div>
          </div>
        </body>
      </html>
    `;

    // Attempt actual Nodemailer send if nodemailer can be loaded and credentials are set
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      console.log('Nodemailer not installed. Executing simulated dispatch.');
    }

    let sent = false;
    let transportInfo = '';

    if (nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"ProductivityAI Alert" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject: '⚡ ProductivityAI Performance Digest & Alerts',
          html: htmlContent,
        });

        sent = true;
        transportInfo = `Sent via Nodemailer SMTP to ${recipientEmail}`;
      } catch (err) {
        console.error('Nodemailer SMTP failed, falling back to simulation:', err);
      }
    }

    if (!sent) {
      // Simulation mode
      console.log(`[SIMULATION] Email dispatch to: ${recipientEmail}`);
      console.log(`[SIMULATION] Subject: ⚡ ProductivityAI Performance Digest & Alerts`);
      console.log(`[SIMULATION] Body: HTML generated with ${pendingTasks.length} pending tasks.`);
      transportInfo = `Simulated Nodemailer dispatch to ${recipientEmail}`;
    }

    return NextResponse.json({
      success: true,
      sent,
      simulated: !sent,
      message: transportInfo,
      email: {
        to: recipientEmail,
        subject: '⚡ ProductivityAI Performance Digest & Alerts',
        html: htmlContent
      }
    });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Failed to compile or send performance email summary' }, { status: 500 });
  }
}
