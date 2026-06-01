import { json, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";

export async function POST(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("announcement_reads")
    .upsert({
      announcement_id: params.id,
      user_id: user.id,
      read_at: new Date().toISOString(),
    });

  if (error) throw error;

  return json({ ok: true });
}
