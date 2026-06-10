import { getSupabaseAdmin } from "../../../utils/supabase.js";
import {
  applyPaystackTransaction,
  verifyPaystackTransaction,
} from "../../../utils/paystack.js";

function redirectTo(request, path) {
  return Response.redirect(new URL(path, request.url), 302);
}

export async function GET(request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");

  if (!reference) {
    return redirectTo(request, "/checkout?payment=missing-reference");
  }

  try {
    const supabase = getSupabaseAdmin();
    const transaction = await verifyPaystackTransaction(reference);
    const result = await applyPaystackTransaction(supabase, transaction);

    if (result.payment?.status !== "succeeded") {
      return redirectTo(request, `/checkout?payment=failed&reference=${encodeURIComponent(reference)}`);
    }

    return redirectTo(request, "/dashboard/billing?payment=success");
  } catch (error) {
    console.error("Paystack callback verification failed:", error);
    return redirectTo(request, `/checkout?payment=error&reference=${encodeURIComponent(reference)}`);
  }
}
