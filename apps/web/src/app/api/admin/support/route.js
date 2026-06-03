import { json } from "../../utils/http.js";
import { requireAdmin } from "../../utils/admin.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";

function applySearch(rows, query) {
  const value = String(query || "").trim().toLowerCase();
  if (!value) return rows;

  return rows.filter((row) =>
    [
      row.subject,
      row.message,
      row.category,
      row.priority,
      row.status,
      row.account,
      row.contactName,
      row.contactEmail,
      row.guest_name,
      row.guest_email,
      row.users?.email,
    ]
      .some((item) => String(item || "").toLowerCase().includes(value)),
  );
}

function contactForTicket(ticket) {
  const contactName =
    [ticket.users?.first_name, ticket.users?.last_name].filter(Boolean).join(" ").trim() ||
    ticket.guest_name ||
    ticket.users?.email ||
    ticket.guest_email ||
    "Guest";
  const contactEmail = ticket.users?.email || ticket.guest_email || "";

  return {
    contactName,
    contactEmail,
    account: contactEmail ? `${contactName} (${contactEmail})` : contactName,
  };
}

export async function GET(request) {
  const { response } = await requireAdmin(request, "support:manage");
  if (response) return response;

  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") || "").trim().toLowerCase();
  const priority = String(url.searchParams.get("priority") || "").trim().toLowerCase();
  const query = String(url.searchParams.get("q") || "");

  const supabase = getSupabaseAdmin();
  let queryBuilder = supabase
    .from("support_tickets")
    .select("*, users(first_name,last_name,email)")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (status) {
    queryBuilder = queryBuilder.eq("status", status);
  }

  if (priority) {
    queryBuilder = queryBuilder.eq("priority", priority);
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;

  let tickets = (data || []).map((ticket) => ({
    ...ticket,
    ...contactForTicket(ticket),
  }));

  tickets = applySearch(tickets, query);

  return json({ tickets });
}
