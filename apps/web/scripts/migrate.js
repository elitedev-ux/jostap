import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");

  try {
    const env = readFileSync(envPath, "utf8");

    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional; DATABASE_URL can also come from the shell.
  }
}

function splitSqlStatements(source) {
  const statements = [];
  let current = "";
  let singleQuoted = false;
  let doubleQuoted = false;
  let dollarTag = null;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (!singleQuoted && !doubleQuoted && char === "$") {
      const match = source.slice(index).match(/^\$[A-Za-z0-9_]*\$/);

      if (match) {
        const tag = match[0];
        current += tag;
        index += tag.length - 1;
        dollarTag = dollarTag === tag ? null : tag;
        continue;
      }
    }

    if (!dollarTag && !doubleQuoted && char === "'" && next !== "'") {
      singleQuoted = !singleQuoted;
    } else if (!dollarTag && !singleQuoted && char === "\"") {
      doubleQuoted = !doubleQuoted;
    }

    if (!singleQuoted && !doubleQuoted && !dollarTag && char === ";") {
      const statement = current.trim();

      if (statement) {
        statements.push(statement);
      }

      current = "";
      continue;
    }

    current += char;
  }

  const statement = current.trim();

  if (statement) {
    statements.push(statement);
  }

  return statements;
}

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const sql = neon(process.env.DATABASE_URL);
  const schema = readFileSync(resolve(process.cwd(), "db/schema.sql"), "utf8");

  for (const statement of splitSqlStatements(schema)) {
    await sql(statement);
  }

  console.log("Database schema is ready.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
