import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const expectedTables = [
  "users",
  "sessions",
  "kyc_profiles",
  "cards",
  "leads",
  "appointments",
  "subscriptions",
  "payments",
  "invoices",
];
const shellEnv = new Set(Object.keys(process.env));

function unquote(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match || match[1].startsWith("#")) {
      continue;
    }

    if (!shellEnv.has(match[1])) {
      process.env[match[1]] = unquote(match[2]);
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.development");
loadEnvFile(".env.local");
loadEnvFile(".env.development.local");

const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing Supabase environment variable(s): ${missing.join(", ")}`);
  console.error(
    "Add them to apps/web/.env. See apps/web/.env.example for the expected names.",
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

let hasError = false;

for (const table of expectedTables) {
  const { error } = await supabase.from(table).select("id").limit(1);

  if (error) {
    hasError = true;
    console.error(`${table}: ${error.message}`);
  } else {
    console.log(`${table}: ok`);
  }
}

if (hasError) {
  console.error("Supabase responded, but one or more expected tables are missing or inaccessible.");
  console.error("Apply apps/web/db/schema.sql in your Supabase SQL editor, then run this again.");
  process.exit(1);
}

const smokeEmail = `supabase-check-${crypto.randomUUID()}@example.invalid`;
const { data: smokeUser, error: smokeUserError } = await supabase
  .from("users")
  .insert({
    first_name: "Supabase",
    last_name: "Check",
    company: "JOSTAP",
    email: smokeEmail,
    password_hash: "health-check",
  })
  .select("id")
  .single();

if (smokeUserError) {
  console.error(`signup write smoke test: ${smokeUserError.message}`);
  console.error("The tables exist, but the backend cannot create user accounts.");
  console.error(
    "Apply apps/web/db/schema.sql in Supabase, including the service_role GRANT statements.",
  );
  process.exit(1);
}

try {
  const { error: smokeSessionError } = await supabase.from("sessions").insert({
    user_id: smokeUser.id,
    token_hash: `health-check-${crypto.randomUUID()}`,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  });

  if (smokeSessionError) {
    throw smokeSessionError;
  }

  const { error: smokeKycError } = await supabase.from("kyc_profiles").insert({
    user_id: smokeUser.id,
    phone: "+10000000000",
    job_title: "Health Check",
    business_name: "JOSTAP",
    business_type: "Small business",
    country: "Nigeria",
    city: "Lagos",
    website: "https://example.invalid",
    primary_goal: "Share my digital business card",
  });

  if (smokeKycError) {
    throw smokeKycError;
  }

  console.log("signup write smoke test: ok");
} catch (error) {
  console.error(`signup write smoke test: ${error.message}`);
  hasError = true;
} finally {
  const { error: cleanupError } = await supabase
    .from("users")
    .delete()
    .eq("id", smokeUser.id);

  if (cleanupError) {
    console.error(`smoke test cleanup: ${cleanupError.message}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log("Supabase is configured and the expected tables are reachable.");
