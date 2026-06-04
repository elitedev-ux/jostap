export function paginationFromRequest(request, { defaultLimit = 10, maxLimit = 50 } = {}) {
  const params = new URL(request.url).searchParams;
  const parsedLimit = Number.parseInt(params.get("limit") || `${defaultLimit}`, 10);
  const parsedOffset = Number.parseInt(params.get("offset") || "0", 10);
  const limit = Math.min(Math.max(parsedLimit || defaultLimit, 1), maxLimit);
  const offset = Math.max(parsedOffset || 0, 0);

  return { limit, offset };
}

export function paginationMeta({ limit, offset, total }) {
  const safeTotal = Number(total || 0);
  return {
    limit,
    offset,
    total: safeTotal,
    hasMore: offset + limit < safeTotal,
  };
}
