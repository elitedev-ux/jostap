import { json } from "../../../utils/http.js";
import { requireAdmin } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { toCdnStorageUrl } from "../../../utils/storageUrls.js";
import { PROFILE_IMAGE_TYPES } from "../../../../../utils/uploadRules.js";

const BUCKET = "shop-product-media";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(PROFILE_IMAGE_TYPES);

function extensionFor(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function detectedImageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") {
    return "image/webp";
  }

  return "";
}

async function ensureBucket(supabase) {
  const { error } = await supabase.storage.getBucket(BUCKET);
  if (!error) return;

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
  const { user: adminUser, response } = await requireAdmin(request, "content:manage");
  if (response) return response;

  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file.arrayBuffer !== "function") {
    return json({ error: "Choose a product image to upload." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return json({ error: "Product artwork must be 10MB or smaller." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);

  const buffer = await file.arrayBuffer();
  const detectedType = detectedImageType(new Uint8Array(buffer.slice(0, 16)));

  if (detectedType !== file.type) {
    return json({ error: "The uploaded file content does not match the image type." }, { status: 400 });
  }

  const path = `${adminUser.id}/product-artwork-${Date.now()}.${extensionFor(detectedType)}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: detectedType,
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return json({ url: toCdnStorageUrl(publicUrl.publicUrl) });
}
