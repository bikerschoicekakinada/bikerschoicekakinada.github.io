-- Add label and compatible_bikes columns to gallery table for rich search support.
ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS compatible_bikes TEXT[] NOT NULL DEFAULT '{}';

-- Force reload schema cache
NOTIFY pgrst, 'reload schema';
