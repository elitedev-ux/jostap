import { json, unauthorized } from "../utils/http.js";
import { paginationFromRequest, paginationMeta } from "../utils/pagination.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

function jobTitleFromRow(row) {
  if (row.job_title) return row.job_title;

  const match = String(row.message || "").match(/^Job title:\s*(.+)$/i);
  return match?.[1]?.trim() || "";
}

function leadFromRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    company: row.company || "",
    jobTitle: jobTitleFromRow(row),
    message: row.message || "",
    source: row.source || "",
    status: row.status || "new",
    cardName: row.cards?.name || row.card_name || "",
    createdAt: row.created_at || "",
  };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const { limit, offset } = paginationFromRequest(request);
  const { data: rows, error, count } = await supabase
    .from("leads")
    .select("*, cards(name)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return json({
    leads: (rows || []).map(leadFromRow),
    pagination: paginationMeta({ limit, offset, total: count }),
  });
}
