export function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function badRequest(message, details) {
  return json({ error: message, details }, { status: 400 });
}

export function payloadTooLarge(message = "Uploaded file is too large.") {
  return json({ error: message }, { status: 413 });
}

export function contentLengthExceeds(request, maxBytes) {
  const value = request.headers.get("content-length");
  if (!value) return false;

  const contentLength = Number(value);
  return Number.isFinite(contentLength) && contentLength > maxBytes;
}

export function unauthorized(message = "Unauthorized") {
  return json({ error: message }, { status: 401 });
}
