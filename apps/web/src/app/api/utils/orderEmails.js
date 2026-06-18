import { absolutePublicUrl } from "../../../utils/publicUrl.js";
import { brandedEmailHtml, escapeHtml, sendEmail } from "./email.js";
import { paystackPlanName } from "./paystack.js";

function clean(value) {
  return String(value || "").trim();
}

function money(cents, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: String(currency || "NGN").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(Number(cents || 0) / 100);
  } catch {
    return `NGN ${Math.round(Number(cents || 0) / 100).toLocaleString("en-NG")}`;
  }
}

function detailRow(label, value) {
  if (!value) return "";

  return `
    <tr>
      <td style="padding:9px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">${escapeHtml(label)}</td>
      <td align="right" style="padding:9px 0;color:#111827;font-size:13px;font-weight:700;border-bottom:1px solid #f3f4f6;">${escapeHtml(value)}</td>
    </tr>
  `;
}

async function userForPayment(supabase, payment) {
  if (!payment?.user_id) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("id", payment.user_id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function reserveOrderEmail(supabase, paymentId) {
  const { data, error } = await supabase
    .from("payments")
    .update({ order_email_sent_at: new Date().toISOString() })
    .eq("id", paymentId)
    .is("order_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function releaseOrderEmailReservation(supabase, paymentId) {
  const { error } = await supabase
    .from("payments")
    .update({ order_email_sent_at: null })
    .eq("id", paymentId);

  if (error) {
    console.error("[order-email:release]", error);
  }
}

export async function sendOrderConfirmationEmail({ supabase, payment }) {
  if (!supabase || !payment || payment.status !== "succeeded") return;
  if (payment.order_email_sent_at) return;

  let reserved = false;

  try {
    reserved = await reserveOrderEmail(supabase, payment.id);
    if (!reserved) return;

    const user = await userForPayment(supabase, payment);
    const orderAccount = payment.order_account || {};
    const recipient = clean(orderAccount.email || user?.email);

    if (!recipient) {
      console.error("[order-email]", {
        event: "missing_recipient",
        paymentId: payment.id,
        orderId: payment.order_id,
      });
      return;
    }

    const fullName = clean(
      orderAccount.name ||
        [user?.first_name, user?.last_name].map(clean).filter(Boolean).join(" "),
    );
    const firstName = fullName ? fullName.split(/\s+/)[0] : "there";
    const product = clean(payment.order_product_name) || paystackPlanName(payment.order_plan);
    const orderId = clean(payment.order_id || payment.provider_payment_id || payment.id);
    const amount = money(payment.amount_cents, payment.currency);
    const dashboardUrl = absolutePublicUrl("/dashboard/billing");
    const whatsappUrl = `https://wa.me/2348066613437?text=${encodeURIComponent(
      `Hi JOSTAP, I just paid for my NFC card. Order ID: ${orderId}. Product: ${product}.`,
    )}`;

    await sendEmail({
      idempotencyKey: `order-confirmation:${payment.id}`,
      to: recipient,
      subject: `Your JOSTAP order ${orderId}`,
      text: `Hi ${firstName}, your payment for ${product} was successful. Order ID: ${orderId}. Amount: ${amount}. Please send this order ID to JOSTAP on WhatsApp so we can process your card.`,
      html: brandedEmailHtml({
        title: "Order received",
        eyebrow: "Order confirmation",
        preheader: `Your JOSTAP order ${orderId} has been received.`,
        body: `
          <p style="margin:0 0 14px;">Hi ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 16px;">Your payment was successful and your card order has been received.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 18px;border-top:1px solid #f3f4f6;">
            ${detailRow("Order ID", orderId)}
            ${detailRow("Product", product)}
            ${detailRow("Amount", amount)}
          </table>
          <p style="margin:0 0 14px;">Please send your order ID to us on WhatsApp so we can confirm your card details and process the order.</p>
          <p style="margin:0 0 18px;">
            <a href="${whatsappUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:14px;font-weight:700;">Send order ID on WhatsApp</a>
          </p>
          <p style="margin:0;color:#6b7280;font-size:13px;">You can also view your billing details here: <a href="${dashboardUrl}" style="color:#0d6ffd;text-decoration:none;">${dashboardUrl}</a></p>
        `,
        footerNote: "Keep this email for your records.",
      }),
    });
  } catch (error) {
    if (reserved) {
      await releaseOrderEmailReservation(supabase, payment.id);
    }

    console.error("[order-email]", {
      event: "send_failed",
      paymentId: payment?.id,
      orderId: payment?.order_id,
      error: error?.message || String(error),
    });
  }
}
