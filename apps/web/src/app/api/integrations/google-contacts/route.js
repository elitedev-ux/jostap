import { json, readJson, unauthorized } from "../../utils/http.js";
import { getSessionUser } from "../../utils/session.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";
import { GOOGLE_CONTACTS_PROVIDER } from "../../utils/googleContacts.js";

function integrationFromRow(row) {
  if (!row) {
    return {
      connected: false,
      syncEnabled: false,
      status: "dashboard_only",
      accountEmail: "",
      lastSyncedAt: "",
      lastError: "",
    };
  }

  return {
    connected: row.status !== "disabled",
    syncEnabled: Boolean(row.sync_enabled),
    status: row.status || "active",
    accountEmail: row.provider_account_email || "",
    lastSyncedAt: row.last_synced_at || "",
    lastError: row.last_error || "",
  };
}

function integrationTableMissing(error) {
  return error?.code === "42P01" || /contact_integrations/i.test(error?.message || "");
}

async function currentIntegration(supabase, userId) {
  return supabase
    .from("contact_integrations")
    .select("provider_account_email, sync_enabled, status, last_synced_at, last_error")
    .eq("user_id", userId)
    .eq("provider", GOOGLE_CONTACTS_PROVIDER)
    .maybeSingle();
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();
  if (!hasSupabase()) return json({ integration: integrationFromRow(null) });

  const supabase = getSupabaseAdmin();
  const { data, error } = await currentIntegration(supabase, user.id);

  if (error) {
    if (integrationTableMissing(error)) {
      return json({ integration: integrationFromRow(null) });
    }
    throw error;
  }

  return json({ integration: integrationFromRow(data) });
}

export async function PATCH(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const body = await readJson(request);
  const syncEnabled = Boolean(body?.syncEnabled);
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("contact_integrations")
    .update({
      sync_enabled: syncEnabled,
      status: syncEnabled ? "active" : "disabled",
      last_error: null,
      updated_at: now,
    })
    .eq("user_id", user.id)
    .eq("provider", GOOGLE_CONTACTS_PROVIDER)
    .select("provider_account_email, sync_enabled, status, last_synced_at, last_error")
    .maybeSingle();

  if (error) {
    if (integrationTableMissing(error)) {
      return json({ error: "Google Contacts storage is not ready yet." }, { status: 503 });
    }
    throw error;
  }

  return json({ integration: integrationFromRow(data) });
}

export async function DELETE(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("contact_integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", GOOGLE_CONTACTS_PROVIDER);

  if (error) {
    if (integrationTableMissing(error)) {
      return json({ integration: integrationFromRow(null) });
    }
    throw error;
  }

  return json({ integration: integrationFromRow(null) });
}
