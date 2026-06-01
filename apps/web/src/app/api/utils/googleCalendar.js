const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function requiredGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

export function googleAppOrigin(request) {
  return (
    process.env.GOOGLE_CALENDAR_REDIRECT_ORIGIN ||
    process.env.GOOGLE_REDIRECT_ORIGIN ||
    process.env.APP_ORIGIN ||
    new URL(request.url).origin
  ).replace(/\/$/, "");
}

export function googleCalendarCallbackUrl(request) {
  return new URL("/api/integrations/google-calendar/callback", googleAppOrigin(request)).toString();
}

export function hasGoogleCalendarConfig() {
  return requiredGoogleAuth().configured;
}

async function refreshToken({ refreshToken, redirectUri }) {
  const { clientId, clientSecret } = requiredGoogleAuth();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      grant_type: "refresh_token",
      refresh_token: refreshToken || "",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google token refresh failed: ${response.status} ${body}`);
  }

  return response.json();
}

export async function getValidGoogleAccessToken({ supabase, userId, request }) {
  const { data: connection, error } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!connection) return null;

  const nowMs = Date.now();
  const expiresMs = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  const stillValid = connection.access_token && expiresMs > nowMs + 30_000;

  if (stillValid) {
    return {
      accessToken: connection.access_token,
      connection,
    };
  }

  if (!connection.refresh_token) {
    return null;
  }

  const refreshed = await refreshToken({
    refreshToken: connection.refresh_token,
    redirectUri: googleCalendarCallbackUrl(request),
  });

  const expiresAt = refreshed.expires_in
    ? new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString()
    : connection.expires_at;

  const payload = {
    access_token: refreshed.access_token,
    expires_at: expiresAt,
    token_type: refreshed.token_type || connection.token_type,
    scope: refreshed.scope || connection.scope,
  };

  if (refreshed.refresh_token) {
    payload.refresh_token = refreshed.refresh_token;
  }

  const { data: updated, error: updateError } = await supabase
    .from("google_calendar_connections")
    .update(payload)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateError) throw updateError;

  return {
    accessToken: updated.access_token,
    connection: updated,
  };
}

export async function createGoogleCalendarEvent({
  accessToken,
  summary,
  description,
  startsAt,
  endsAt,
  attendeeEmail,
}) {
  const event = {
    summary,
    description,
    start: { dateTime: startsAt },
    end: { dateTime: endsAt },
  };

  if (attendeeEmail) {
    event.attendees = [{ email: attendeeEmail }];
  }

  const response = await fetch(GOOGLE_CALENDAR_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google Calendar event create failed: ${response.status} ${body}`);
  }

  return response.json();
}
