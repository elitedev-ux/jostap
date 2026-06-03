import { badRequest, json } from "../../../utils/http.js";
import { requireAdmin, logAdminAction, fullName } from "../../../utils/admin.js";
import { cardFromRow } from "../../../utils/cards.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { publicCardUrl, cardQrUrl } from "../../../../../utils/publicUrl.js";

function cardResponse(row, request) {
  return {
    ...cardFromRow(row),
    publicUrl: publicCardUrl(row, { request }),
    qrUrl: cardQrUrl(row, { request }),
  };
}

async function findUser(supabase, userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function notifyAssignedUser(supabase, { adminUser, card, assignee }) {
  if (!assignee?.id) return;

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      admin_user_id: adminUser.id,
      target_user_id: assignee.id,
      title: "Card assigned to your account",
      message: `${card.name || "A JOSTAP card"} has been assigned to your account and is now available in your dashboard.`,
      type: "success",
      audience: "all",
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;

  await logAdminAction(supabase, adminUser, "card.assignment_notified", "announcement", data.id, {
    cardId: card.id,
    userId: assignee.id,
  });
}

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request, "cards:manage");

  if (response) return response;

  const body = await request.json().catch(() => null);

  if (!body || (typeof body.active !== "boolean" && !("userId" in body) && !("assignedUserId" in body))) {
    return badRequest("Choose a card update to apply.");
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("cards")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) return json({ error: "Card not found." }, { status: 404 });

  const updates = {};
  const actions = [];
  let assignee = null;
  let nextUserId = existing.user_id || null;
  const hasAssignmentUpdate = "userId" in body || "assignedUserId" in body;

  if (typeof body.active === "boolean") {
    updates.active = body.active;
    actions.push(body.active ? "card.activated" : "card.deactivated");
  }

  if (hasAssignmentUpdate) {
    nextUserId = String(body.userId ?? body.assignedUserId ?? "").trim() || null;
    assignee = await findUser(supabase, nextUserId);

    if (nextUserId && !assignee) {
      return badRequest("Choose a valid user to assign this card to.");
    }

    updates.user_id = nextUserId;
    if (!existing.user_id && nextUserId) actions.push("card.assigned");
    else if (existing.user_id && !nextUserId) actions.push("card.unassigned");
    else if (existing.user_id !== nextUserId) actions.push("card.reassigned");
  }

  if (Object.keys(updates).length === 0) {
    return badRequest("Choose a card update to apply.");
  }

  const { data, error } = await supabase
    .from("cards")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;

  for (const action of actions) {
    await logAdminAction(supabase, adminUser, action, "card", params.id, {
      active: typeof body.active === "boolean" ? body.active : undefined,
      previousUserId: existing.user_id || null,
      assignedUserId: nextUserId,
      assignedTo: assignee ? fullName(assignee) || assignee.email : nextUserId ? "Unknown" : "Unassigned",
    });
  }

  if (hasAssignmentUpdate && nextUserId && nextUserId !== existing.user_id) {
    await notifyAssignedUser(supabase, { adminUser, card: data, assignee });
  }

  return json({ card: cardResponse(data, request) });
}
