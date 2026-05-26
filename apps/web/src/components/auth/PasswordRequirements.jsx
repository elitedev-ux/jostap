import { Check } from "lucide-react";
import { getPasswordChecks } from "../../utils/passwordPolicy";

export default function PasswordRequirements({ password }) {
  const unmetRules = getPasswordChecks(password).filter((rule) => !rule.valid);

  if (unmetRules.length === 0) {
    return null;
  }

  return (
    <div className="auth-password-rules">
      {unmetRules.map((rule) => (
        <div key={rule.label}>
          <Check size={12} />
          {rule.label}
        </div>
      ))}
    </div>
  );
}
