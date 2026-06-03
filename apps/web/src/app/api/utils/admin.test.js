import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADMIN_PERMISSIONS,
  expandPermissions,
  hasAdminPermission,
  normalizePermissions,
} from "./admin.js";

describe("admin permission helpers", () => {
  it("normalizes permission arrays safely", () => {
    expect(normalizePermissions(["users:manage", "", null, " cards:manage "])).toEqual([
      "users:manage",
      "cards:manage",
    ]);
    expect(normalizePermissions("users:manage")).toEqual([]);
  });

  it("expands legacy full-admin permissions to new granular permissions", () => {
    const expanded = expandPermissions("admin", [
      "users:manage",
      "cards:manage",
      "billing:manage",
      "content:manage",
      "reports:export",
      "roles:manage",
    ]);

    expect(expanded).toEqual(expect.arrayContaining(DEFAULT_ADMIN_PERMISSIONS));
  });

  it("requires every requested permission unless wildcard is present", () => {
    expect(hasAdminPermission(["users:manage", "roles:manage"], ["users:manage", "roles:manage"])).toBe(true);
    expect(hasAdminPermission(["users:manage"], ["users:manage", "roles:manage"])).toBe(false);
    expect(hasAdminPermission(["*"], ["users:manage", "roles:manage"])).toBe(true);
  });
});
