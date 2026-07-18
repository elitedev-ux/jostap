import { badRequest, json, readJson } from "../../utils/http.js";
import { hashPassword, validatePassword } from "../../utils/password.js";
import { getSupabaseAdmin, hasSupabase, isUniqueViolation } from "../../utils/supabase.js";
import { authRateLimit } from "../../utils/rateLimit.js";
import { createEmailVerificationChallenge, normalizeEmail } from "../../utils/authSecurity.js";

export async function POST(request) {
  if (!hasSupabase()) {
    return json(
      { error: "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env." },
      { status: 503 },
    );
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const phone = String(body.phone || "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const limited = authRateLimit(request, "signup", email || "missing-email", {
    limit: 5,
    windowMs: 30 * 60_000,
  });
  if (limited) return limited;

  if (!firstName || !lastName || !phone || !email || !password) {
    return badRequest("First name, last name, phone number, email, and password are required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Enter a valid email address.");
  }

  if (!validatePassword(password)) {
    return badRequest(
      "Password must be at least 8 characters and include 1 capital letter, 1 number, and 1 symbol.",
    );
  }

  const passwordHash = await hashPassword(password);
  const supabase = getSupabaseAdmin();
  const userPayload = {
    first_name: firstName,
    last_name: lastName,
    company: null,
    phone,
    email,
    password_hash: passwordHash,
  };

  try {
    let result = await supabase
      .from("users")
      .insert(userPayload)
      .select("id, first_name, last_name, company, email, role, email_verified_at, created_at")
      .single();

    if (result.error?.code === "42703" || result.error?.code === "PGRST204") {
      const { phone: _phone, ...fallbackPayload } = userPayload;
      result = await supabase
        .from("users")
        .insert(fallbackPayload)
        .select("id, first_name, last_name, company, email, role, email_verified_at, created_at")
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    const user = result.data;
    await createEmailVerificationChallenge(supabase, user);

    return json(
      {
        user,
        requiresVerification: true,
        message: "Account created. Enter the verification code sent to your email.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return badRequest("An account with this email already exists.");
    }

    throw error;
  }
}
