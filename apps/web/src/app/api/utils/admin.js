import { json, unauthorized } from "./http.js";
import { getSessionUser } from "./session.js";
import { getSupabaseAdmin } from "./supabase.js";

const LEGACY_ADMIN_PERMISSIONS = [
  "users:manage",
  "cards:manage",
  "billing:manage",
  "content:manage",
  "reports:export",
  "roles:manage",
];

export const DEFAULT_ADMIN_PERMISSIONS = [
  ...LEGACY_ADMIN_PERMISSIONS,
  "appointments:manage",
  "support:manage",
  "announcements:manage",
  "notifications:manage",
];

export function normalizePermissions(value) {
  return Array.isArray(value)
    ? value.map((permission) => String(permission || "").trim()).filter(Boolean)
    : [];
}

export function expandPermissions(role, permissions) {
  const normalized = normalizePermissions(permissions);
  const expanded = new Set(normalized);

  if (
    role === "admin" &&
    LEGACY_ADMIN_PERMISSIONS.every((permission) => expanded.has(permission))
  ) {
    for (const permission of DEFAULT_ADMIN_PERMISSIONS) {
      expanded.add(permission);
    }
  }

  return [...expanded];
}

export function hasAdminPermission(permissions, required) {
  const requiredList = Array.isArray(required) ? required : [required];
  const permissionSet = new Set(normalizePermissions(permissions));

  return requiredList.every(
    (permission) => !permission || permissionSet.has("*") || permissionSet.has(permission),
  );
}

async function getPermissionsForRole(role) {
  const fallback = role === "admin" ? DEFAULT_ADMIN_PERMISSIONS : [];

  if (!role) {
    return fallback;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permissions")
    .eq("role", role)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return expandPermissions(role, data?.permissions || fallback);
}

export async function requireAdmin(request, requiredPermission = null) {
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

  const permissions = await getPermissionsForRole(user.role);

  if (requiredPermission && !hasAdminPermission(permissions, requiredPermission)) {
    return {
      response: json(
        { error: "You do not have permission to perform this admin action." },
        { status: 403 },
      ),
    };
  }

  return { user, permissions };
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
