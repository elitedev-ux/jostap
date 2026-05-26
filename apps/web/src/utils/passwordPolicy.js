export const PASSWORD_RULES =
  "At least 8 characters, 1 capital letter, 1 number, and 1 symbol.";

export const PASSWORD_PATTERN = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";

export function getPasswordChecks(password) {
  return [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "1 capital letter", valid: /[A-Z]/.test(password) },
    { label: "1 number", valid: /\d/.test(password) },
    { label: "1 symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function isValidPassword(password) {
  return getPasswordChecks(password).every((rule) => rule.valid);
}
