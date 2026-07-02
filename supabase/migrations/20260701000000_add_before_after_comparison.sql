-- Add optional Before/After comparison support to gallery and signature_work tables.
-- All new columns are nullable (except comparison_enabled which defaults to false).
-- Existing rows remain fully functional without any modification.

-- ===== gallery table =====
ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS before_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS after_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS before_label TEXT DEFAULT 'Before',
  ADD COLUMN IF NOT EXISTS after_label TEXT DEFAULT 'After',
  ADD COLUMN IF NOT EXISTS comparison_enabled BOOLEAN NOT NULL DEFAULT false;

-- ===== signature_work table =====
ALTER TABLE public.signature_work
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS before_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS after_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS before_label TEXT DEFAULT 'Before',
  ADD COLUMN IF NOT EXISTS after_label TEXT DEFAULT 'After',
  ADD COLUMN IF NOT EXISTS comparison_enabled BOOLEAN NOT NULL DEFAULT false;
