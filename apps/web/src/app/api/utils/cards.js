export function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function cardFromRow(row) {
  const theme = row.theme || {};
  const social = row.social_links || {};

  return {
    id: row.id,
    name: row.name || "",
    title: row.title || "",
    role: row.title || "",
    company: row.company || "",
    bio: row.bio || "",
    phone: row.phone || "",
    email: row.email || "",
    website: row.website || "",
    whatsapp: social.whatsapp || "",
    linkedin: social.linkedin || "",
    twitter: social.twitter || "",
    instagram: social.instagram || "",
    portfolio: social.portfolio || "",
    slug: row.slug || "",
    template: theme.template || "Navy Pro",
    active: Boolean(row.active),
    showServices: theme.showServices ?? true,
    showTestimonials: theme.showTestimonials ?? true,
    showGallery: theme.showGallery ?? false,
    showFaq: theme.showFaq ?? false,
    views: Number(row.views || 0),
    taps: Number(row.taps || 0),
    qr: Number(row.qr_scans || 0),
    created: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
    updatedAt: row.updated_at || row.created_at || "",
  };
}

export function cardPayload(body) {
  const slug = normalizeSlug(body.slug);

  return {
    name: String(body.name || "").trim(),
    title: String(body.title || body.role || "").trim() || null,
    company: String(body.company || "").trim() || null,
    bio: String(body.bio || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    email: String(body.email || "").trim(),
    website: String(body.website || "").trim() || null,
    slug,
    active: body.active ?? true,
    theme: {
      template: body.template || "Navy Pro",
      showServices: body.showServices ?? true,
      showTestimonials: body.showTestimonials ?? true,
      showGallery: body.showGallery ?? false,
      showFaq: body.showFaq ?? false,
    },
    socialLinks: {
      whatsapp: body.whatsapp || "",
      linkedin: body.linkedin || "",
      twitter: body.twitter || "",
      instagram: body.instagram || "",
      portfolio: body.portfolio || "",
    },
  };
}
