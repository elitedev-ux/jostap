import { badRequest, contentLengthExceeds, json, readJson } from "../../utils/http.js";
import { rateLimit, rateLimitKey } from "../../utils/rateLimit.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";

const MAX_BODY_BYTES = 8 * 1024;
const NAME_MAX = 120;
const EMAIL_MAX = 160;
const PHONE_MAX = 40;
const COMPANY_MAX = 160;
const JOB_TITLE_MAX = 120;

function cleanText(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= EMAIL_MAX;
}

function validPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20 && /^[+\d().\-\s]{7,40}$/.test(value);
}

function validatedPayload(body) {
  const name = cleanText(body?.name || body?.fullName, NAME_MAX);
  const email = cleanText(body?.email, EMAIL_MAX).toLowerCase();
  const phone = cleanText(body?.phone, PHONE_MAX);
  const company = cleanText(body?.company || body?.businessName, COMPANY_MAX);
  const jobTitle = cleanText(body?.jobTitle || body?.job_title, JOB_TITLE_MAX);
  const token = cleanText(body?.cardId || body?.cardSlug || body?.token, 140);

  if (!token) return { error: "Card profile is required." };
  if (name.length < 2) return { error: "Full name is required." };
  if (!validPhone(phone)) return { error: "Enter a valid phone number." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };

  return {
    payload: {
      name,
      email,
      phone,
      company,
      jobTitle,
      token,
    },
  };
}

async function findActiveCard(supabase, token) {
  const value = String(token || "").trim();
  if (!value) return { data: null, error: null };

  const select = "id, user_id, name, slug, active";

  if (isUuid(value)) {
    const byId = await supabase
      .from("cards")
      .select(select)
      .eq("active", true)
      .eq("id", value)
      .maybeSingle();

    if (byId.error || byId.data) return byId;
  }

  return supabase
    .from("cards")
    .select(select)
    .eq("active", true)
    .eq("slug", value)
    .maybeSingle();
}

function missingJobTitleColumn(error) {
  const message = String(error?.message || "");
  return error?.code === "42703" || error?.code === "PGRST204" || /job_title/i.test(message);
}

function leadInsertPayload({ card, payload, includeJobTitle = true }) {
  return {
    user_id: card.user_id,
    card_id: card.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    company: payload.company || null,
    ...(includeJobTitle ? { job_title: payload.jobTitle || null } : {}),
    message: !includeJobTitle && payload.jobTitle ? `Job title: ${payload.jobTitle}` : null,
    source: "exchange_contact",
    status: "new",
  };
}

export async function POST(request) {
  if (contentLengthExceeds(request, MAX_BODY_BYTES)) {
    return json({ error: "Contact form is too large." }, { status: 413 });
  }

  const body = await readJson(request);
  const { payload, error } = validatedPayload(body);

  if (error) {
    return badRequest(error);
  }

  const limited = rateLimit(request, {
    key: rateLimitKey(request, "public-lead-exchange", [payload.token, payload.email]),
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (limited) return limited;

  if (!hasSupabase()) {
    return json({ error: "Contact sharing is unavailable." }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const { data: card, error: cardError } = await findActiveCard(supabase, payload.token);

  if (cardError) {
    throw cardError;
  }

  if (!card?.user_id) {
    return json({ error: "Card profile is unavailable." }, { status: 404 });
  }

  const insert = (includeJobTitle) => supabase
    .from("leads")
    .insert(leadInsertPayload({ card, payload, includeJobTitle }))
    .select("id")
    .single();

  let { data: lead, error: insertError } = await insert(true);

  if (insertError && missingJobTitleColumn(insertError)) {
    const fallback = await insert(false);
    lead = fallback.data;
    insertError = fallback.error;
  }

  if (insertError) {
    throw insertError;
  }

  return json({
    ok: true,
    leadId: lead.id,
    googleSync: { synced: false, status: "coming_soon" },
  });
}
