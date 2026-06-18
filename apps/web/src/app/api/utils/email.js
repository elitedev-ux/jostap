import { absolutePublicUrl } from "../../../utils/publicUrl.js";

const DEFAULT_FROM = "JOSTAP <no-reply@jostap.com>";

function configuredFrom() {
  return process.env.EMAIL_FROM || process.env.POSTMARK_FROM_EMAIL || DEFAULT_FROM;
}

export function escapeHtml(value) {
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
  <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    ${safePreheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>` : ""}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
            <tr>
              <td style="padding:18px 22px;border-bottom:1px solid #e5e7eb;background:#ffffff;border-radius:8px 8px 0 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <a href="${siteUrl}" style="text-decoration:none;display:inline-block;color:#111827;font-size:18px;line-height:1;font-weight:800;letter-spacing:0;">
                        JOSTAP
                      </a>
                    </td>
                    <td align="right" style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;">${safeEyebrow}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 22px 10px;">
                <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#111827;font-weight:800;">${safeTitle}</h1>
                <div style="font-size:15px;line-height:1.65;color:#374151;">${body}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 22px 24px;">
                <div style="border-top:1px solid #e5e7eb;padding-top:16px;color:#6b7280;font-size:12px;line-height:1.6;">
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
        <p style="margin:0 0 18px;">Use this code to continue your ${actionLabel} request:</p>
        <p style="margin:0 0 20px;color:#0f172a;font-size:34px;line-height:1;font-weight:800;letter-spacing:8px;">${escapeHtml(code)}</p>
        <p style="margin:0 0 14px;">This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.55;">For your security, never share this code with anyone. JOSTAP will never ask for it outside the app.</p>
      `,
    }),
  });
}
