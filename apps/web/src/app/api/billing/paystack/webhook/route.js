import { json } from "../../../utils/http.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import {
  applyPaystackTransaction,
  verifyPaystackSignature,
} from "../../../utils/paystack.js";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return json({ error: "Invalid Paystack signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    return json({ received: true });
  }

  const supabase = getSupabaseAdmin();
  await applyPaystackTransaction(supabase, event.data);

  return json({ received: true });
}
