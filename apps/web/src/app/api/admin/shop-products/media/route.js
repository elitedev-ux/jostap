import { json } from "../../../utils/http.js";
import { requireAdmin } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { toCdnStorageUrl } from "../../../utils/storageUrls.js";
import { PROFILE_IMAGE_TYPES } from "../../../../../utils/uploadRules.js";

const BUCKET = "shop-product-media";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(PROFILE_IMAGE_TYPES);

function cleanFilename(value) {
  return String(value || "product-artwork")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "product-artwork";
}

function extensionFor(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

async function ensureBucket(supabase) {
  const bucketOptions = {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_TYPES),
  };
  const { error } = await supabase.storage.getBucket(BUCKET);
  if (!error) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, bucketOptions);
    if (updateError) throw updateError;
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, bucketOptions);

  if (createError && !/already exists/i.test(createError.message || "")) {
    throw createError;
  }

  if (createError) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, bucketOptions);
    if (updateError) throw updateError;
  }
}

export async function POST(request) {
  try {
    const { user: adminUser, response } = await requireAdmin(request, "content:manage");
    if (response) return response;

    const body = await request.json().catch(() => null);
    const fileName = cleanFilename(body?.name);
    const fileType = String(body?.type || "");
    const fileSize = Number(body?.size || 0);

    if (!fileName || !fileType || !fileSize) {
      return json({ error: "Choose a product image to upload." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(fileType)) {
      return json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
    }

    if (fileSize > MAX_BYTES) {
      return json({ error: "Product artwork must be 10MB or smaller." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);

    const path = `${adminUser.id}/${fileName}-${Date.now()}.${extensionFor(fileType)}`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: true });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return json({
      signedUrl: data.signedUrl,
      path: data.path || path,
      token: data.token,
      url: toCdnStorageUrl(publicUrl.publicUrl),
      maxBytes: MAX_BYTES,
    });
  } catch (error) {
    return json({ error: error?.message || "Unable to prepare product artwork upload." }, { status: 500 });
  }
}
