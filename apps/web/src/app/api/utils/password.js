import argon2 from "argon2";
import { isValidPassword } from "../../../utils/passwordPolicy.js";

export function validatePassword(password) {
  return typeof password === "string" && isValidPassword(password);
}

export function hashPassword(password) {
  return argon2.hash(password);
}

export function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}
