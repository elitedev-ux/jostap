import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { getSessionUser } from "../../utils/session.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";

const STATUSES = new Set(["pending", "approved", "rejected", "cancelled", "completed"]);

export async function PATCH(request, { params }) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const status = String(body.status || "").trim().toLowerCase();
  if (!STATUSES.has(status)) return badRequest("Invalid appointment status.");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", params.id)
    .eq("assigned_user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return json({ error: "Appointment not found." }, { status: 404 });

  return json({ appointment: data });
}
