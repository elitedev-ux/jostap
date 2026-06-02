import { badRequest, json, readJson } from "../../utils/http.js";
import { requireAdmin, logAdminAction, fullName } from "../../utils/admin.js";
import { activePlanForUser, applyPlanLimits, cardFromRow, cardPayload } from "../../utils/cards.js";
import { getSupabaseAdmin, isUniqueViolation } from "../../utils/supabase.js";
import { cardProfileUrl, cardQrUrl } from "../../../../utils/publicUrl.js";

function cardResponse(row, request) {
  return {
    ...cardFromRow(row),
    publicUrl: cardProfileUrl(row.slug, { request }),
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

export async function POST(request) {
  const { user: adminUser, response } = await requireAdmin(request);

  if (response) return response;

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const supabase = getSupabaseAdmin();
  const userId = String(body.userId || body.assignedUserId || "").trim() || null;
  const assignee = await findUser(supabase, userId);

  if (userId && !assignee) {
    return badRequest("Choose a valid user to assign this card to.");
  }

  try {
    const plan = assignee ? await activePlanForUser(supabase, assignee.id) : "free";
    const card = applyPlanLimits(cardPayload(body), plan);

    if (!card.name || !card.slug) {
      return badRequest("Card name and public slug are required.");
    }

    const { data: row, error } = await supabase
      .from("cards")
      .insert({
        user_id: assignee?.id || null,
        name: card.name,
        title: card.title,
        company: card.company,
        slug: card.slug,
        bio: card.bio,
        email: card.email || null,
        phone: card.phone,
        website: card.website,
        avatar_url: card.avatarUrl,
        theme: card.theme,
        social_links: card.socialLinks,
        active: card.active,
      })
      .select("*")
      .single();

    if (error) throw error;

    const normalized = cardResponse(row, request);

    await logAdminAction(supabase, adminUser, "card.created", "card", row.id, {
      assignedUserId: assignee?.id || null,
      assignedTo: assignee ? fullName(assignee) || assignee.email : "Unassigned",
    });

    if (assignee) {
      await notifyAssignedUser(supabase, { adminUser, card: normalized, assignee });
    }

    return json({ card: normalized }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return badRequest("This public slug is already in use.");
    }

    throw error;
  }
}
