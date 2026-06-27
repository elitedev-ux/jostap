import { badRequest, json } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";

const UPGRADE_PLANS = new Set(["jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const BILLING_CYCLES = new Set(["one_time", "yearly"]);

function upgradePassword() {
  return process.env.ADMIN_UPGRADE_PASSWORD || "Tosyn@1997";
}

function addPeriod(cycle) {
  const date = new Date();
  date.setMonth(date.getMonth() + (cycle === "yearly" ? 12 : 12));
  return date.toISOString();
}

function defaultBillingCycle(plan, value) {
  const requested = String(value || "").toLowerCase();
  if (BILLING_CYCLES.has(requested)) return requested;
  return ["basic_renewal", "premium_renewal"].includes(plan) ? "yearly" : "one_time";
}

export async function PATCH(request, { params }) {
  const body = await request.json().catch(() => null);
  const status = String(body?.status || "").toLowerCase();
  const role = String(body?.role || "").toLowerCase();
  const plan = String(body?.plan || "").toLowerCase();
  const requiredPermissions = [
    "users:manage",
    ...(role ? ["roles:manage"] : []),
    ...(plan ? ["billing:manage"] : []),
  ];
  const { user: adminUser, response } = await requireAdmin(request, requiredPermissions);

  if (response) return response;

  const updates = {};

  if (status) {
    if (!["active", "suspended"].includes(status)) {
      return badRequest("Choose a valid user status.");
    }
    updates.status = status;
  }

  if (role) {
    if (!["user", "admin"].includes(role)) {
      return badRequest("Choose a valid user role.");
    }
    updates.role = role;
  }

  if (!Object.keys(updates).length && !plan) {
    return badRequest("No valid user updates provided.");
  }

  if (params.id === adminUser.id && (updates.status === "suspended" || updates.role === "user")) {
    return badRequest("Admins cannot remove their own admin access.");
  }

  if (plan) {
    if (!UPGRADE_PLANS.has(plan)) {
      return badRequest("Choose a valid upgrade plan.");
    }

    if (String(body?.upgradePassword || "") !== upgradePassword()) {
      return json({ error: "Invalid upgrade password." }, { status: 403 });
    }
  }

  const supabase = getSupabaseAdmin();
  let data = null;

  if (Object.keys(updates).length) {
    const result = await supabase
      .from("users")
      .update(updates)
      .eq("id", params.id)
      .select("id, first_name, last_name, email, role, status")
      .single();

    if (result.error) throw result.error;
    data = result.data;
    await logAdminAction(supabase, adminUser, "user.updated", "user", params.id, updates);
  } else {
    const result = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role, status")
      .eq("id", params.id)
      .single();

    if (result.error) throw result.error;
    data = result.data;
  }

  let subscription = null;

  if (plan) {
    const now = new Date().toISOString();
    const billingCycle = defaultBillingCycle(plan, body?.billingCycle || body?.billing);
    const payload = {
      user_id: params.id,
      plan,
      billing_cycle: billingCycle,
      status: "active",
      provider: "admin_upgrade",
      provider_subscription_id: `admin-${adminUser.id}-${Date.now()}`,
      current_period_start: now,
      current_period_end: addPeriod(billingCycle),
      updated_at: now,
    };

    const { data: existing, error: lookupError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", params.id)
      .in("status", ["pending", "active", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) throw lookupError;

    const subscriptionQuery = existing
      ? supabase.from("subscriptions").update(payload).eq("id", existing.id)
      : supabase.from("subscriptions").insert(payload);

    const result = await subscriptionQuery.select("*").single();

    if (result.error) throw result.error;
    subscription = result.data;

    await logAdminAction(supabase, adminUser, "subscription.admin_upgraded", "subscription", subscription.id, {
      userId: params.id,
      plan,
      billingCycle,
    });
  }

  return json({ user: data, subscription });
}
