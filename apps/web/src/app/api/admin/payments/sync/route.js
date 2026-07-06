import { json, badRequest, readJson } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { sendOrderConfirmationEmail } from "../../../utils/orderEmails.js";
import {
  PAYSTACK_PROVIDER,
  applyPaystackTransaction,
  verifyPaystackTransaction,
} from "../../../utils/paystack.js";

function cleanId(value) {
  return String(value || "").trim();
}

function isPendingPaystackPayment(payment) {
  return (
    payment?.provider === PAYSTACK_PROVIDER &&
    payment?.status === "pending" &&
    Boolean(payment?.provider_payment_id)
  );
}

export async function POST(request) {
  const { user: adminUser, response } = await requireAdmin(request, "billing:manage");

  if (response) {
    return response;
  }

  const body = (await readJson(request)) || {};
  const paymentId = cleanId(body.paymentId);

  if (!paymentId) {
    return badRequest("Choose a pending payment to sync.");
  }

  const supabase = getSupabaseAdmin();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError) {
    throw paymentError;
  }

  if (!payment) {
    return json({ error: "Payment record was not found." }, { status: 404 });
  }

  if (!isPendingPaystackPayment(payment)) {
    return badRequest("Only pending Paystack payments can be synced.");
  }

  let result;

  try {
    const transaction = await verifyPaystackTransaction(payment.provider_payment_id);
    result = await applyPaystackTransaction(supabase, transaction);
  } catch (error) {
    return badRequest(error?.message || "Unable to verify this Paystack payment.");
  }

  if (result.payment?.status === "succeeded") {
    await sendOrderConfirmationEmail({ supabase, payment: result.payment });
  }

  await logAdminAction(
    supabase,
    adminUser,
    "payment.paystack_synced",
    "payment",
    payment.id,
    {
      reference: payment.provider_payment_id,
      status: result.payment?.status || "unknown",
      orderId: result.payment?.order_id || payment.order_id || "",
    },
  );

  return json({
    payment: {
      id: result.payment?.id || payment.id,
      status: result.payment?.status || payment.status,
      orderId: result.payment?.order_id || payment.order_id || "",
    },
  });
}
