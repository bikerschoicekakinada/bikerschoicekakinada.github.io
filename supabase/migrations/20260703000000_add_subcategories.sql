-- Add subcategories and detailed product catalog support
-- Evolving delivery_items into a rich catalog table while maintaining full backward compatibility.

-- 1. Create delivery_subcategories table if it does not exist
CREATE TABLE IF NOT EXISTS public.delivery_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.delivery_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  visibility BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

-- 2. Drop existing policies if they exist to prevent errors on recreate
DROP POLICY IF EXISTS "Public can read delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Admins can manage delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anon can insert delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anon can update delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anon can delete delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anyone can insert delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anyone can update delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anyone can delete delivery_subcategories" ON public.delivery_subcategories;

-- 3. Enable RLS on delivery_subcategories
ALTER TABLE public.delivery_subcategories ENABLE ROW LEVEL SECURITY;

-- 4. Recreate Permissive Policies for delivery_subcategories
CREATE POLICY "Public can read delivery_subcategories"
  ON public.delivery_subcategories FOR SELECT USING (true);

CREATE POLICY "Anyone can insert delivery_subcategories"
  ON public.delivery_subcategories FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update delivery_subcategories"
  ON public.delivery_subcategories FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete delivery_subcategories"
  ON public.delivery_subcategories FOR DELETE USING (true);

-- 5. Add new detailed columns to delivery_items (all nullable or defaulted for backward compatibility)
ALTER TABLE public.delivery_items
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.delivery_subcategories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS availability BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS compatible_bikes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instagram_reel_url TEXT,
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS after_image_url TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS search_keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS additional_images TEXT[] NOT NULL DEFAULT '{}';

-- 6. Add description & visibility to delivery_categories if they do not exist
ALTER TABLE public.delivery_categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS visibility BOOLEAN NOT NULL DEFAULT true;

-- 7. Performance indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_delivery_subcategories_category_id
  ON public.delivery_subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_delivery_items_subcategory_id
  ON public.delivery_items(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_delivery_items_featured
  ON public.delivery_items(featured) WHERE featured = true;
