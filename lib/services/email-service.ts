// ============================================================================
// EMAIL SERVICE — sends the weekly dashboard digest via Resend.
// ============================================================================

import { Resend } from 'resend';

export interface DigestChartSummary {
  title: string;
  refreshed: boolean;
  summary: string;
}

export interface SendDashboardDigestParams {
  to: string;
  dashboardTitle: string;
  dashboardUrl: string;
  charts: DigestChartSummary[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml({ dashboardTitle, dashboardUrl, charts }: SendDashboardDigestParams): string {
  const rows = charts
    .map(c => {
      const icon = c.refreshed ? '✅' : '⚠️';
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e4e4e7;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#18181b;">${icon} ${escapeHtml(c.title)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#71717a;">${escapeHtml(c.summary)}</p>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#18181b;">
      <h1 style="font-size:18px;margin:0 0 4px;">${escapeHtml(dashboardTitle)}</h1>
      <p style="font-size:13px;color:#71717a;margin:0 0 20px;">Your scheduled refresh just ran. Here's what changed:</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <a href="${dashboardUrl}" style="display:inline-block;margin-top:24px;padding:10px 18px;border-radius:8px;background:#6366f1;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">
        View dashboard
      </a>
      <p style="font-size:11px;color:#a1a1aa;margin-top:24px;">
        You're receiving this because a weekly digest is enabled for this dashboard. Turn it off from the dashboard's settings.
      </p>
    </div>`;
}

/**
 * Sends the weekly digest email. Errors are logged and swallowed — a failed
 * send must not abort the cron loop for other dashboards.
 */
export async function sendDashboardDigest(params: SendDashboardDigestParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email-service] RESEND_API_KEY not configured — skipping digest send');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'VisualMe <onboarding@resend.dev>',
      to: [params.to],
      subject: `Your "${params.dashboardTitle}" dashboard was refreshed`,
      html: buildHtml(params),
    });

    if (error) {
      console.error('[email-service] Resend error:', error);
    }
  } catch (err) {
    console.error('[email-service] Failed to send digest:', err);
  }
}
