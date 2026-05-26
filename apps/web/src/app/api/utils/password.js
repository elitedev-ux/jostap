import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { isValidPassword } from "../../../utils/passwordPolicy.js";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export function validatePassword(password) {
  return typeof password === "string" && isValidPassword(password);
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(hash, password) {
  if (!hash?.startsWith("scrypt:")) {
    return false;
  }

  const [, salt, storedKey] = hash.split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedKey = await scrypt(password, salt, storedBuffer.length);

  return timingSafeEqual(storedBuffer, derivedKey);
}
