const DEFAULT_FROM = "JOSTAP <no-reply@jostap.com>";

function configuredFrom() {
  return process.env.EMAIL_FROM || process.env.POSTMARK_FROM_EMAIL || DEFAULT_FROM;
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

async function sendWithResend({ to, subject, html, text }) {
  const token = process.env.RESEND_API_KEY;

  if (!token) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
  if (await sendWithPostmark(message)) return { delivered: true, provider: "postmark" };
  if (await sendWithResend(message)) return { delivered: true, provider: "resend" };

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
  const subject =
    purpose === "signin"
      ? "Your JOSTAP sign-in code"
      : "Verify your JOSTAP email";
  const text = `Your JOSTAP verification code is ${code}. It expires in 10 minutes.`;

  return sendEmail({
    to,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
        <h2 style="margin:0 0 12px">JOSTAP verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:800;letter-spacing:4px;margin:16px 0">${code}</p>
        <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });
}
