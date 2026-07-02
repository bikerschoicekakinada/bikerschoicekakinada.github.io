-- Create gallery_categories table for dynamic gallery tab management
CREATE TABLE IF NOT EXISTS public.gallery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;

-- Select policy (accessible to everyone)
CREATE POLICY "Anon can select gallery_categories" ON public.gallery_categories
  FOR SELECT TO anon USING (true);

-- Insert policy
CREATE POLICY "Anon can insert gallery_categories" ON public.gallery_categories
  FOR INSERT TO anon WITH CHECK (true);

-- Update policy
CREATE POLICY "Anon can update gallery_categories" ON public.gallery_categories
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Delete policy
CREATE POLICY "Anon can delete gallery_categories" ON public.gallery_categories
  FOR DELETE TO anon USING (true);

-- Seed default categories
INSERT INTO public.gallery_categories (name, order_index) VALUES
  ('Custom Builds', 0),
  ('LED & Neon', 1),
  ('Wraps & Paint', 2),
  ('Alloy & Tyre', 3),
  ('Before & After', 4),
  ('Workshop', 5)
ON CONFLICT (name) DO NOTHING;
