import { badRequest, json, readJson } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { sendAppointmentStatusEmail } from "../../../utils/appointmentEmails.js";

const STATUSES = new Set(["pending", "approved", "rejected", "cancelled", "completed"]);

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request, "appointments:manage");
  if (response) return response;

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const status = String(body.status || "").trim().toLowerCase();
  if (!STATUSES.has(status)) return badRequest("Invalid appointment status.");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", params.id)
    .neq("status", status)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const { data: existing, error: existingError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) return json({ error: "Appointment not found." }, { status: 404 });
    return json({ appointment: existing, unchanged: true });
  }

  await logAdminAction(supabase, adminUser, "appointment.status_updated", "appointment", params.id, { status });
  await sendAppointmentStatusEmail({ appointment: data, status });

  return json({ appointment: data });
}
