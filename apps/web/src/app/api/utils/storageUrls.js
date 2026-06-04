const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const cdnOrigin =
  process.env.STORAGE_CDN_ORIGIN ||
  process.env.SUPABASE_STORAGE_CDN_ORIGIN ||
  process.env.CLOUDFLARE_STORAGE_CDN_ORIGIN ||
  "";

function cleanOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function originFromUrl(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

const supabaseOrigin = cleanOrigin(originFromUrl(supabaseUrl));
const storageCdnOrigin = cleanOrigin(cdnOrigin);

function replaceOrigin(value, fromOrigin, toOrigin) {
  if (!value || !fromOrigin || !toOrigin) return value || "";
  const text = String(value);
  return text.startsWith(`${fromOrigin}/`) ? `${toOrigin}${text.slice(fromOrigin.length)}` : text;
}

export function toCdnStorageUrl(value) {
  return replaceOrigin(value, supabaseOrigin, storageCdnOrigin);
}

export function toOriginStorageUrl(value) {
  return replaceOrigin(value, storageCdnOrigin, supabaseOrigin);
}
