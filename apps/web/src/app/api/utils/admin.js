import { json, unauthorized } from "./http.js";
import { getSessionUser } from "./session.js";

export async function requireAdmin(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return { response: unauthorized() };
  }

  if (user.role !== "admin") {
    return {
      response: json(
        { error: "Admin access is required for this area." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export function money(cents, currency = "usd") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

export function fullName(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
}

export async function logAdminAction(supabase, adminUser, action, targetType, targetId, metadata = {}) {
  await supabase.from("admin_audit_logs").insert({
    admin_user_id: adminUser?.id || null,
    action,
    target_type: targetType || null,
    target_id: targetId ? String(targetId) : null,
    metadata,
  });
}
