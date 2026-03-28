-- CIPHER Platform - Migration 004: Tools & Insane Features
-- Run this in Supabase SQL Editor

-- Content Calendar: add scheduled_for column
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Creator profile: phantom mode, vault PIN, bio
ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS phantom_mode BOOLEAN DEFAULT false;
ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS vault_pin_hash TEXT;
ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS bio TEXT;

-- Fan Messages table (Fan Message Blast tool)
CREATE TABLE IF NOT EXISTS fan_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  segment       TEXT NOT NULL DEFAULT 'all',
  recipient_count INT DEFAULT 0,
  sent_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE fan_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fan_messages_creator_all" ON fan_messages;
CREATE POLICY "fan_messages_creator_all" ON fan_messages
  FOR ALL USING (auth.uid() = creator_id);

-- Collab Proposals table (Collaboration Finder tool)
CREATE TABLE IF NOT EXISTS collab_proposals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_creator_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_handle         TEXT NOT NULL,
  split_percentage  INT DEFAULT 50 CHECK (split_percentage BETWEEN 0 AND 100),
  message           TEXT,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE collab_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collab_proposals_creator_all" ON collab_proposals;
CREATE POLICY "collab_proposals_creator_all" ON collab_proposals
  FOR ALL USING (auth.uid() = from_creator_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fan_messages_creator ON fan_messages(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_proposals_from ON collab_proposals(from_creator_id);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled ON content_items(scheduled_for) WHERE scheduled_for IS NOT NULL;
