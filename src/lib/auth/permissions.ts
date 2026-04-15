// ─────────────────────────────────────────────────────────────
// ROLE DEFINITIONS
// ─────────────────────────────────────────────────────────────

/** All valid platform roles, ordered from least to most privileged. */
export type UserRole = "fan" | "creator" | "admin" | "super_admin";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  fan: 0,
  creator: 1,
  admin: 2,
  super_admin: 3,
};

const VALID_ROLES = new Set<string>(Object.keys(ROLE_HIERARCHY));

/**
 * Returns true if `value` is a valid UserRole string.
 * Used to safely narrow unknown JWT values.
 */
export function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.has(value);
}

/**
 * Returns true if `role` is at least as privileged as `minimum`.
 *
 * Examples:
 *   hasMinimumRole("admin", "admin")       → true
 *   hasMinimumRole("super_admin", "admin") → true
 *   hasMinimumRole("creator", "admin")     → false
 *   hasMinimumRole("fan", "creator")       → false
 */
export function hasMinimumRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}
