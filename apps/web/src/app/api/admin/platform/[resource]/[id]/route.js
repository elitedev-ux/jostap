import { badRequest, json } from "../../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../../utils/supabase.js";

const TABLES = {
  templates: "card_templates",
  features: "premium_features",
  emails: "email_templates",
  pages: "static_pages",
  faqs: "faqs",
  pricing: "pricing_plans",
  notifications: "admin_notifications",
  roles: "role_permissions",
};

const PERMISSIONS = {
  templates: "content:manage",
  features: "content:manage",
  emails: "content:manage",
  pages: "content:manage",
  faqs: "content:manage",
  pricing: "billing:manage",
  notifications: "notifications:manage",
  roles: "roles:manage",
};

function pickAllowed(resource, body) {
  const allowed = {
    templates: ["name", "description", "color_primary", "color_secondary", "is_premium", "is_active"],
    features: ["name", "description", "plan", "is_enabled"],
    emails: ["key", "subject", "body", "is_active"],
    pages: ["slug", "title", "content", "is_published"],
    faqs: ["question", "answer", "category", "sort_order", "is_published"],
    pricing: ["slug", "name", "monthly_cents", "yearly_cents", "card_limit", "features", "is_active"],
    notifications: ["title", "message", "type", "is_read"],
    roles: ["role", "permissions", "description"],
  }[resource];

  return Object.fromEntries(
    allowed
      .filter((key) => Object.prototype.hasOwnProperty.call(body || {}, key))
      .map((key) => [key, body[key]]),
  );
}

export async function PATCH(request, { params }) {
  const requiredPermission = PERMISSIONS[params.resource];
  const { user: adminUser, response } = await requireAdmin(request, requiredPermission);

  if (response) return response;

  const table = TABLES[params.resource];

  if (!table) return badRequest("Unknown admin resource.");

  const body = await request.json().catch(() => null);
  const updates = pickAllowed(params.resource, body);

  if (!Object.keys(updates).length) {
    return badRequest("No valid updates provided.");
  }

  const supabase = getSupabaseAdmin();
  if (params.resource === "notifications" && updates.is_read === true) {
    const { data: notification, error: notificationError } = await supabase
      .from("admin_notifications")
      .select("id,source,source_id")
      .eq("id", params.id)
      .maybeSingle();

    if (notificationError) throw notificationError;

    if (notification?.source === "support_ticket" && notification.source_id) {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("status")
        .eq("id", notification.source_id)
        .maybeSingle();

      if (ticketError) throw ticketError;
      if (ticket && ticket.status !== "closed") {
        return badRequest("Support ticket notifications stay unread until the ticket is closed.");
      }
    }
  }

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;

  await logAdminAction(supabase, adminUser, `${params.resource}.updated`, params.resource, params.id, updates);

  return json({ item: data });
}
