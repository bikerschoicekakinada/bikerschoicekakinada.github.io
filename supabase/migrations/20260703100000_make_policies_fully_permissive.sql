-- Make all database tables and storage policies fully permissive for both anon and authenticated roles.
-- This ensures that whether the user is anonymous or logged in, all writes, updates, and deletes succeed.

-- 1. Drop existing storage policies
DROP POLICY IF EXISTS "Admins can upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anon can update files" ON storage.objects;
DROP POLICY IF EXISTS "Anon can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public select uploads" ON storage.objects;
DROP POLICY IF EXISTS "Permissive insert uploads" ON storage.objects;
DROP POLICY IF EXISTS "Permissive update uploads" ON storage.objects;
DROP POLICY IF EXISTS "Permissive delete uploads" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Public select uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Permissive insert uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Permissive update uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Permissive delete uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads');


-- 2. Drop existing delivery_categories policies
DROP POLICY IF EXISTS "Admins can manage delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Anon can insert delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Anon can update delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Anon can delete delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Public can read delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Public read delivery_categories" ON public.delivery_categories;

-- Recreate delivery_categories policies
CREATE POLICY "Public read delivery_categories" ON public.delivery_categories
  FOR SELECT USING (true);

CREATE POLICY "Permissive insert delivery_categories" ON public.delivery_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permissive update delivery_categories" ON public.delivery_categories
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permissive delete delivery_categories" ON public.delivery_categories
  FOR DELETE USING (true);


-- 3. Drop existing delivery_items policies
DROP POLICY IF EXISTS "Admins can manage delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Anon can insert delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Anon can update delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Anon can delete delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Public can read delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Public read delivery_items" ON public.delivery_items;

-- Recreate delivery_items policies
CREATE POLICY "Public read delivery_items" ON public.delivery_items
  FOR SELECT USING (true);

CREATE POLICY "Permissive insert delivery_items" ON public.delivery_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permissive update delivery_items" ON public.delivery_items
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permissive delete delivery_items" ON public.delivery_items
  FOR DELETE USING (true);


-- 4. Drop existing gallery policies
DROP POLICY IF EXISTS "Admins can manage gallery" ON public.gallery;
DROP POLICY IF EXISTS "Anon can insert gallery" ON public.gallery;
DROP POLICY IF EXISTS "Anon can update gallery" ON public.gallery;
DROP POLICY IF EXISTS "Anon can delete gallery" ON public.gallery;
DROP POLICY IF EXISTS "Public can read gallery" ON public.gallery;
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;

-- Recreate gallery policies
CREATE POLICY "Public read gallery" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "Permissive insert gallery" ON public.gallery
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permissive update gallery" ON public.gallery
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permissive delete gallery" ON public.gallery
  FOR DELETE USING (true);


-- 5. Drop existing signature_work policies
DROP POLICY IF EXISTS "Admins can manage signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Anon can insert signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Anon can update signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Anon can delete signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Public can read signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Public read signature_work" ON public.signature_work;

-- Recreate signature_work policies
CREATE POLICY "Public read signature_work" ON public.signature_work
  FOR SELECT USING (true);

CREATE POLICY "Permissive insert signature_work" ON public.signature_work
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permissive update signature_work" ON public.signature_work
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permissive delete signature_work" ON public.signature_work
  FOR DELETE USING (true);


-- 6. Drop existing site_settings policies
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anon can update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anon can insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;

-- Recreate site_settings policies
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Permissive insert site_settings" ON public.site_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permissive update site_settings" ON public.site_settings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permissive delete site_settings" ON public.site_settings
  FOR DELETE USING (true);


-- 7. Drop and recreate delivery_subcategories policies to be fully permissive as well
DROP POLICY IF EXISTS "Public can read delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Public read delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Admins can manage delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anon can insert delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anon can update delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anon can delete delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anyone can insert delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anyone can update delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Anyone can delete delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Permissive insert delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Permissive update delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Permissive delete delivery_subcategories" ON public.delivery_subcategories;

CREATE POLICY "Public read delivery_subcategories" ON public.delivery_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Permissive insert delivery_subcategories" ON public.delivery_subcategories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permissive update delivery_subcategories" ON public.delivery_subcategories
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permissive delete delivery_subcategories" ON public.delivery_subcategories
  FOR DELETE USING (true);

-- ==================================================================
-- CUMULATIVE SCHEMA ENSURANCE & CACHE RELOAD
-- ==================================================================

-- 1. Ensure before/after & instagram columns exist on public.gallery
ALTER TABLE public.gallery
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS before_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS after_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS before_label TEXT DEFAULT 'Before',
  ADD COLUMN IF NOT EXISTS after_label TEXT DEFAULT 'After',
  ADD COLUMN IF NOT EXISTS comparison_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instagram_post_url TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS compatible_bikes TEXT[] NOT NULL DEFAULT '{}';

-- 2. Ensure before/after & instagram columns exist on public.signature_work
ALTER TABLE public.signature_work
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS before_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS after_image_alt TEXT,
  ADD COLUMN IF NOT EXISTS before_label TEXT DEFAULT 'Before',
  ADD COLUMN IF NOT EXISTS after_label TEXT DEFAULT 'After',
  ADD COLUMN IF NOT EXISTS comparison_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instagram_post_url TEXT;

-- 3. Force reload schema cache
NOTIFY pgrst, 'reload schema';
