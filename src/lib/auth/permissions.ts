// =============================================================
// MULUK — Permission System
// Single source of truth for roles and permission strings.
// Mirrors the DB seed in supabase/migrations/051_rbac_system.sql.
// =============================================================

// ─────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────

export type UserRole = 'fan' | 'creator' | 'admin' | 'super_admin';

export const ROLES = {
  FAN: 'fan',
  CREATOR: 'creator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const satisfies Record<string, UserRole>;

/** Ordered by privilege level — useful for >= comparisons. */
export const ROLE_RANK: Record<UserRole, number> = {
  fan: 0,
  creator: 1,
  admin: 2,
  super_admin: 3,
};

/** Returns true if `role` is at least as privileged as `minimum`. */
export function hasMinimumRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

// ─────────────────────────────────────────────────────────────
// PERMISSION STRINGS
// Format: "resource:action" — kept in sync with the DB seed.
// ─────────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Content
  CONTENT_READ: 'content:read',
  CONTENT_CREATE: 'content:create',
  CONTENT_UPDATE_OWN: 'content:update:own',
  CONTENT_DELETE_OWN: 'content:delete:own',
  CONTENT_DELETE_ANY: 'content:delete:any',
  // Fans (as a data resource for creators)
  FANS_VIEW: 'fans:view',
  FANS_MESSAGE: 'fans:message',
  FANS_EXPORT: 'fans:export',
  // Creator dashboard
  CREATOR_DASHBOARD: 'creator:dashboard',
  CREATOR_ANALYTICS: 'creator:analytics',
  CREATOR_EARNINGS: 'creator:earnings',
  CREATOR_SETTINGS: 'creator:settings',
  // Fan dashboard
  FAN_DASHBOARD: 'fan:dashboard',
  FAN_PURCHASES: 'fan:purchases',
  FAN_LIBRARY: 'fan:library',
  FAN_MESSAGES: 'fan:messages',
  FAN_FOLLOWING: 'fan:following',
  // Admin
  ADMIN_PANEL: 'admin:panel',
  ADMIN_APPLICATIONS: 'admin:applications',
  ADMIN_USERS_VIEW: 'admin:users:view',
  ADMIN_USERS_MANAGE: 'admin:users:manage',
  ADMIN_ANALYTICS: 'admin:analytics',
  ADMIN_AUDIT_LOGS: 'admin:audit_logs',
  ADMIN_BANS: 'admin:bans',
  ADMIN_CONTENT_MODERATE: 'admin:content:moderate',
  // Super admin
  SUPER_ADMIN_ADMINS: 'super_admin:admins',
  SUPER_ADMIN_CONFIG: 'super_admin:config',
  SUPER_ADMIN_OVERRIDE: 'super_admin:override',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─────────────────────────────────────────────────────────────
// STATIC ROLE → PERMISSION MAP
// Used for in-process checks without a DB query.
// Must stay in sync with the DB seed in migration 051.
// ─────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  fan: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.FAN_DASHBOARD,
    PERMISSIONS.FAN_PURCHASES,
    PERMISSIONS.FAN_LIBRARY,
    PERMISSIONS.FAN_MESSAGES,
    PERMISSIONS.FAN_FOLLOWING,
  ],

  creator: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_UPDATE_OWN,
    PERMISSIONS.CONTENT_DELETE_OWN,
    PERMISSIONS.FANS_VIEW,
    PERMISSIONS.FANS_MESSAGE,
    PERMISSIONS.FANS_EXPORT,
    PERMISSIONS.CREATOR_DASHBOARD,
    PERMISSIONS.CREATOR_ANALYTICS,
    PERMISSIONS.CREATOR_EARNINGS,
    PERMISSIONS.CREATOR_SETTINGS,
    // Creators can also use the fan dashboard
    PERMISSIONS.FAN_DASHBOARD,
    PERMISSIONS.FAN_PURCHASES,
    PERMISSIONS.FAN_LIBRARY,
    PERMISSIONS.FAN_MESSAGES,
    PERMISSIONS.FAN_FOLLOWING,
  ],

  admin: [
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_DELETE_ANY,
    PERMISSIONS.FANS_VIEW,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.ADMIN_APPLICATIONS,
    PERMISSIONS.ADMIN_USERS_VIEW,
    PERMISSIONS.ADMIN_USERS_MANAGE,
    PERMISSIONS.ADMIN_ANALYTICS,
    PERMISSIONS.ADMIN_AUDIT_LOGS,
    PERMISSIONS.ADMIN_BANS,
    PERMISSIONS.ADMIN_CONTENT_MODERATE,
  ],

  super_admin: Object.values(PERMISSIONS) as Permission[],
};

// ─────────────────────────────────────────────────────────────
// CHECK HELPERS (pure functions — no I/O)
// ─────────────────────────────────────────────────────────────

/** Returns true if `role` statically has `permission`. */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as string[]).includes(permission);
}

/** Returns true if `role` has at least one of the given permissions. */
export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

/** Validate an untrusted string is a known UserRole. */
export function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.values(ROLES).includes(value as UserRole);
}
