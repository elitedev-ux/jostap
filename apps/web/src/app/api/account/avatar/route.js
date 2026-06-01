import { json, unauthorized } from "../../utils/http.js";
import { getSessionUser } from "../../utils/session.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";
import { accountFromUserAndKyc } from "../../utils/profile.js";
import { PROFILE_IMAGE_MAX_BYTES, PROFILE_IMAGE_TYPES } from "../../../../utils/uploadRules.js";

const BUCKET = "avatars";
const MAX_BYTES = PROFILE_IMAGE_MAX_BYTES;
const ALLOWED_TYPES = new Set(PROFILE_IMAGE_TYPES);

function extensionFor(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

async function ensureAvatarBucket(supabase) {
  const { error } = await supabase.storage.getBucket(BUCKET);

  if (!error) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  });

  if (createError && !/already exists/i.test(createError.message || "")) {
    throw createError;
  }
}

export async function POST(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file.arrayBuffer !== "function") {
    return json({ error: "Choose an image to upload." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return json({ error: "Profile photo must be 2MB or smaller." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  await ensureAvatarBucket(supabase);

  const path = `${user.id}/profile-${Date.now()}.${extensionFor(file.type)}`;
  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const avatarUrl = publicUrl.publicUrl;

  const { data: profile, error: profileError } = await supabase
    .from("kyc_profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (profileError) {
    throw profileError;
  }

  return json({
    avatarUrl,
    user: accountFromUserAndKyc(user, profile),
  });
}
