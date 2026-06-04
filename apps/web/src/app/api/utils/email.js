import { absolutePublicUrl } from "../../../utils/publicUrl.js";

const DEFAULT_FROM = "JOSTAP <no-reply@jostap.com>";

function configuredFrom() {
  return process.env.EMAIL_FROM || process.env.POSTMARK_FROM_EMAIL || DEFAULT_FROM;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appUrl(path = "/") {
  return absolutePublicUrl(path);
}

export function brandedEmailHtml({ title, eyebrow = "JOSTAP", preheader = "", body, footerNote = "" }) {
  const safeTitle = escapeHtml(title);
  const safeEyebrow = escapeHtml(eyebrow);
  const safePreheader = escapeHtml(preheader);
  const siteUrl = appUrl("/");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    ${safePreheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>` : ""}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 18px;background:#0d6ffd;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
                        <span style="display:inline-block;width:34px;height:34px;border-radius:10px;background:#ffffff;color:#0d6ffd;text-align:center;line-height:34px;font-size:18px;font-weight:900;margin-right:10px;vertical-align:middle;">J</span>
                        <span style="display:inline-block;color:#ffffff;font-size:20px;font-weight:900;letter-spacing:0;vertical-align:middle;">JOSTAP</span>
                      </a>
                    </td>
                    <td align="right" style="color:#dbeafe;font-size:12px;font-weight:700;text-transform:uppercase;">${safeEyebrow}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 12px;">
                <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:#0f172a;font-weight:900;">${safeTitle}</h1>
                <div style="font-size:15px;line-height:1.7;color:#374151;">${body}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 28px 28px;">
                <div style="border-top:1px solid #e5e7eb;padding-top:18px;color:#6b7280;font-size:12px;line-height:1.6;">
                  ${footerNote ? `<p style="margin:0 0 8px;">${footerNote}</p>` : ""}
                  <p style="margin:0;">This email was sent by JOSTAP. If you were not expecting it, you can safely ignore it.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function hasEmailDelivery() {
  return Boolean(process.env.POSTMARK_SERVER_TOKEN || process.env.RESEND_API_KEY) || process.env.NODE_ENV !== "production";
}

async function sendWithPostmark({ to, subject, html, text }) {
  const token = process.env.POSTMARK_SERVER_TOKEN;

  if (!token) return false;

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: configuredFrom(),
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || "outbound",
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Postmark email failed: ${details || response.status}`);
  }

  return true;
}

async function sendWithResend({ to, subject, html, text, idempotencyKey }) {
  const token = process.env.RESEND_API_KEY;

  if (!token) return false;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: configuredFrom(),
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Resend email failed: ${details || response.status}`);
  }

  return true;
}

export async function sendEmail(message) {
  if (await sendWithResend(message)) return { delivered: true, provider: "resend" };
  if (await sendWithPostmark(message)) return { delivered: true, provider: "postmark" };

  if (process.env.NODE_ENV !== "production") {
    console.info("[email:fallback]", {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return { delivered: false, provider: "console" };
  }

  throw new Error("Email is not configured. Add POSTMARK_SERVER_TOKEN or RESEND_API_KEY.");
}

export async function sendOtpEmail({ to, code, purpose = "verify" }) {
  const expiryMinutes = purpose === "password_reset" ? 15 : 10;
  const isPasswordReset = purpose === "password_reset";
  const subject =
    purpose === "signin"
      ? "Your JOSTAP sign-in code"
      : isPasswordReset
        ? "Reset your JOSTAP password"
      : "Verify your JOSTAP email";
  const text =
    isPasswordReset
      ? `Your JOSTAP password reset code is ${code}. It expires in ${expiryMinutes} minutes.`
      : `Your JOSTAP verification code is ${code}. It expires in ${expiryMinutes} minutes.`;
  const title = isPasswordReset ? "Reset your JOSTAP password" : "JOSTAP verification";
  const actionLabel = isPasswordReset ? "password reset" : "verification";

  return sendEmail({
    to,
    subject,
    text,
    html: brandedEmailHtml({
      title,
      eyebrow: "Security code",
      preheader: `Your JOSTAP ${actionLabel} code expires in ${expiryMinutes} minutes.`,
      body: `
        <p style="margin:0 0 16px;">Use the code below to continue your ${actionLabel} request.</p>
        <div style="margin:22px 0;padding:18px 20px;border-radius:14px;background:#f8fafc;border:1px solid #dbeafe;text-align:center;">
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:800;text-transform:uppercase;">Your secure code</p>
          <p style="margin:0;color:#0f172a;font-size:34px;line-height:1;font-weight:900;letter-spacing:8px;">${escapeHtml(code)}</p>
        </div>
        <p style="margin:0 0 12px;">This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
        <div style="margin-top:18px;padding:14px 16px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:13px;line-height:1.5;">
          For your security, never share this code with anyone. JOSTAP will never ask for it outside the app.
        </div>
      `,
    }),
  });
}
