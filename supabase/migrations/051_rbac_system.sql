-- =============================================================
-- MULUK — Migration 051: Role-Based Access Control System
-- Roles: fan | creator | admin | super_admin
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: ROLE ENUM & COLUMN
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('fan', 'creator', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add primary role to users table (defaults everyone to fan)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'fan';

-- Fast index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- ─────────────────────────────────────────────────────────────
-- STEP 2: ADMIN EMAIL ALLOWLIST
-- Admins must BOTH have the admin role AND appear in this table.
-- This is a defence-in-depth control: a compromised account that
-- gets the admin role via DB cannot access the panel unless their
-- email was explicitly allowlisted by a super_admin.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL UNIQUE,
  role        user_role   NOT NULL DEFAULT 'admin',
  notes       TEXT,
  added_by    UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_allowlist_email
  ON public.admin_allowlist (email) WHERE is_active = true;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: PERMISSIONS REFERENCE TABLE
-- Named as "resource:action" strings for easy string-matching
-- in TypeScript without a DB round-trip.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE, -- e.g. 'content:read'
  description TEXT,
  resource    TEXT        NOT NULL,        -- e.g. 'content'
  action      TEXT        NOT NULL,        -- e.g. 'read'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- STEP 4: ROLE → PERMISSION MAPPING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role            user_role NOT NULL,
  permission_name TEXT      NOT NULL REFERENCES public.permissions (name) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_name)
);

-- ─────────────────────────────────────────────────────────────
-- STEP 5: PER-USER PERMISSION OVERRIDES
-- Lets super_admins grant or deny individual permissions beyond
-- what the role provides (e.g. grant a creator admin:analytics).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  permission_name TEXT        NOT NULL REFERENCES public.permissions (name) ON DELETE CASCADE,
  granted         BOOLEAN     NOT NULL DEFAULT true, -- true = grant, false = explicit deny
  granted_by      UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  reason          TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_name)
);

CREATE INDEX IF NOT EXISTS idx_upo_user_id
  ON public.user_permission_overrides (user_id);

-- ─────────────────────────────────────────────────────────────
-- STEP 6: SEED PERMISSIONS
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.permissions (name, description, resource, action) VALUES
  -- Content
  ('content:read',              'View any public content',                    'content',      'read'),
  ('content:create',            'Create new content',                         'content',      'create'),
  ('content:update:own',        'Update own content',                         'content',      'update:own'),
  ('content:delete:own',        'Delete own content',                         'content',      'delete:own'),
  ('content:delete:any',        'Delete any content (moderation)',            'content',      'delete:any'),
  -- Fans (as data subjects for creators)
  ('fans:view',                 'View fan list and profiles',                 'fans',         'view'),
  ('fans:message',              'Send direct messages to fans',               'fans',         'message'),
  ('fans:export',               'Export fan data (CSV)',                      'fans',         'export'),
  -- Creator dashboard
  ('creator:dashboard',         'Access creator dashboard',                   'creator',      'dashboard'),
  ('creator:analytics',         'View creator analytics',                     'creator',      'analytics'),
  ('creator:earnings',          'View and manage earnings',                   'creator',      'earnings'),
  ('creator:settings',          'Manage creator profile and settings',        'creator',      'settings'),
  -- Fan dashboard
  ('fan:dashboard',             'Access fan dashboard',                       'fan',          'dashboard'),
  ('fan:purchases',             'View own purchase history',                  'fan',          'purchases'),
  ('fan:library',               'Access unlocked content library',            'fan',          'library'),
  ('fan:messages',              'Access fan inbox',                           'fan',          'messages'),
  ('fan:following',             'View and manage followed creators',          'fan',          'following'),
  -- Admin
  ('admin:panel',               'Access admin panel',                         'admin',        'panel'),
  ('admin:applications',        'Review creator applications',                'admin',        'applications'),
  ('admin:users:view',          'View all user accounts',                     'admin',        'users:view'),
  ('admin:users:manage',        'Edit and ban user accounts',                 'admin',        'users:manage'),
  ('admin:analytics',           'View platform-wide analytics',               'admin',        'analytics'),
  ('admin:audit_logs',          'Read audit logs',                            'admin',        'audit_logs'),
  ('admin:bans',                'Issue and revoke bans',                      'admin',        'bans'),
  ('admin:content:moderate',    'Moderate / remove any content',              'admin',        'content:moderate'),
  -- Super admin
  ('super_admin:admins',        'Manage admin users and the email allowlist', 'super_admin',  'admins'),
  ('super_admin:config',        'Change platform configuration',              'super_admin',  'config'),
  ('super_admin:override',      'Override any access restriction',            'super_admin',  'override')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 7: ASSIGN PERMISSIONS TO ROLES
-- ─────────────────────────────────────────────────────────────

-- FAN: read content, own fan dashboard features
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('fan', 'content:read'),
  ('fan', 'fan:dashboard'),
  ('fan', 'fan:purchases'),
  ('fan', 'fan:library'),
  ('fan', 'fan:messages'),
  ('fan', 'fan:following')
ON CONFLICT DO NOTHING;

-- CREATOR: content management + fan tooling + fan dashboard access
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('creator', 'content:read'),
  ('creator', 'content:create'),
  ('creator', 'content:update:own'),
  ('creator', 'content:delete:own'),
  ('creator', 'fans:view'),
  ('creator', 'fans:message'),
  ('creator', 'fans:export'),
  ('creator', 'creator:dashboard'),
  ('creator', 'creator:analytics'),
  ('creator', 'creator:earnings'),
  ('creator', 'creator:settings'),
  ('creator', 'fan:dashboard'),
  ('creator', 'fan:purchases'),
  ('creator', 'fan:library'),
  ('creator', 'fan:messages'),
  ('creator', 'fan:following')
ON CONFLICT DO NOTHING;

-- ADMIN: moderation + user management (no creator tooling, no super_admin controls)
INSERT INTO public.role_permissions (role, permission_name) VALUES
  ('admin', 'content:read'),
  ('admin', 'content:delete:any'),
  ('admin', 'fans:view'),
  ('admin', 'admin:panel'),
  ('admin', 'admin:applications'),
  ('admin', 'admin:users:view'),
  ('admin', 'admin:users:manage'),
  ('admin', 'admin:analytics'),
  ('admin', 'admin:audit_logs'),
  ('admin', 'admin:bans'),
  ('admin', 'admin:content:moderate')
ON CONFLICT DO NOTHING;

-- SUPER_ADMIN: every permission
INSERT INTO public.role_permissions (role, permission_name)
  SELECT 'super_admin', name FROM public.permissions
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 8: JWT SYNC TRIGGER
-- Whenever a user's role changes, write it into auth.users
-- app_metadata so the JWT automatically carries the role.
-- This eliminates DB queries in middleware for 95% of requests.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_role_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_sync_role ON public.users;
CREATE TRIGGER trg_users_sync_role
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_jwt();

-- ─────────────────────────────────────────────────────────────
-- STEP 9: ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.admin_allowlist          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

-- admin_allowlist: service role only (managed via API routes, never client-direct)
CREATE POLICY admin_allowlist_deny_all ON public.admin_allowlist
  USING (false) WITH CHECK (false);

-- permissions: public read (role metadata is not sensitive)
CREATE POLICY permissions_public_read ON public.permissions
  FOR SELECT USING (true);

-- role_permissions: public read
CREATE POLICY role_permissions_public_read ON public.role_permissions
  FOR SELECT USING (true);

-- user_permission_overrides: own row or admin
CREATE POLICY upo_read ON public.user_permission_overrides
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- STEP 10: HELPER — check if a user has a permission (SQL)
-- Call from RLS policies or DB functions where needed.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id       UUID,
  p_permission    TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check explicit deny override first
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_permission_overrides upo
      WHERE upo.user_id         = p_user_id
        AND upo.permission_name = p_permission
        AND upo.granted         = false
        AND (upo.expires_at IS NULL OR upo.expires_at > now())
    ) THEN false
    -- Then check explicit grant override
    WHEN EXISTS (
      SELECT 1 FROM public.user_permission_overrides upo
      WHERE upo.user_id         = p_user_id
        AND upo.permission_name = p_permission
        AND upo.granted         = true
        AND (upo.expires_at IS NULL OR upo.expires_at > now())
    ) THEN true
    -- Fall back to role permissions
    ELSE EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.role_permissions rp ON rp.role = u.role
      WHERE u.id              = p_user_id
        AND rp.permission_name = p_permission
    )
  END;
$$;

-- ─────────────────────────────────────────────────────────────
-- STEP 11: BACKFILL EXISTING USERS
-- Anyone already in admin_users → 'admin' role
-- Anyone in creator_applications (approved) → 'creator' role
-- Everyone else stays 'fan'
-- ─────────────────────────────────────────────────────────────

-- Promote existing approved creators
UPDATE public.users u
SET role = 'creator'
WHERE u.id IN (
  SELECT ca.user_id
  FROM public.creator_applications ca
  WHERE ca.status = 'approved'
    AND ca.user_id IS NOT NULL
)
AND u.role = 'fan';

-- Promote existing admins
UPDATE public.users u
SET role = 'admin'
WHERE u.id IN (
  SELECT au.user_id FROM public.admin_users au
)
AND u.role = 'fan';

-- Sync all existing roles into JWT metadata
UPDATE auth.users au
SET raw_app_meta_data =
  COALESCE(au.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', u.role::text)
FROM public.users u
WHERE au.id = u.id;

-- ─────────────────────────────────────────────────────────────
-- STEP 12: COMMENTS
-- ─────────────────────────────────────────────────────────────

COMMENT ON TABLE public.admin_allowlist IS
  'Email addresses approved for admin panel access. Role must ALSO be admin/super_admin. Defence-in-depth.';
COMMENT ON TABLE public.permissions IS
  'Canonical permission strings in resource:action format. Mirrored in TypeScript src/lib/auth/permissions.ts.';
COMMENT ON TABLE public.role_permissions IS
  'Static role → permission assignments. Add rows here to grant a permission to an entire role.';
COMMENT ON TABLE public.user_permission_overrides IS
  'Per-user grants and denies that augment the role default. Supports optional expiry.';
COMMENT ON FUNCTION public.user_has_permission IS
  'Returns true if user has permission via role or override (deny overrides win).';
COMMENT ON FUNCTION public.sync_role_to_jwt IS
  'Keeps auth.users.raw_app_meta_data.role in sync so middleware reads role from JWT — no DB query.';
