-- Add columns to cache live Instagram count, last sync timestamp, and current status.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS instagram_followers_live_count INTEGER,
  ADD COLUMN IF NOT EXISTS instagram_followers_last_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS instagram_followers_status TEXT DEFAULT 'manual';
