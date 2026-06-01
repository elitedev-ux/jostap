export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PROFILE_IMAGE_RULES = "JPG, PNG, or WebP, max 2MB";

export function isAllowedProfileImage(file) {
  return Boolean(
    file &&
      PROFILE_IMAGE_TYPES.includes(file.type) &&
      Number(file.size || 0) <= PROFILE_IMAGE_MAX_BYTES,
  );
}
