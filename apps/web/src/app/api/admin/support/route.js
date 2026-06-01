import { json } from "../../utils/http.js";
import { requireAdmin } from "../../utils/admin.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";

function applySearch(rows, query) {
  const value = String(query || "").trim().toLowerCase();
  if (!value) return rows;

  return rows.filter((row) =>
    [row.subject, row.message, row.category, row.priority, row.status, row.account]
      .some((item) => String(item || "").toLowerCase().includes(value)),
  );
}

export async function GET(request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") || "").trim().toLowerCase();
  const priority = String(url.searchParams.get("priority") || "").trim().toLowerCase();
  const query = String(url.searchParams.get("q") || "");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, users(first_name,last_name,email)")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  let tickets = (data || []).map((ticket) => ({
    ...ticket,
    account:
      [ticket.users?.first_name, ticket.users?.last_name].filter(Boolean).join(" ").trim() ||
      ticket.users?.email ||
      "Unknown",
  }));

  if (status) {
    tickets = tickets.filter((ticket) => ticket.status === status);
  }

  if (priority) {
    tickets = tickets.filter((ticket) => ticket.priority === priority);
  }

  tickets = applySearch(tickets, query);

  return json({ tickets });
}
