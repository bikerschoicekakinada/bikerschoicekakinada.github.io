-- Add optional Instagram Post/Reel URL to gallery and signature_work.
-- Nullable column, existing rows get NULL automatically.

ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS instagram_post_url TEXT;

ALTER TABLE public.signature_work
  ADD COLUMN IF NOT EXISTS instagram_post_url TEXT;
