-- Secure database tables and storage policies by restricting all writes (INSERT, UPDATE, DELETE)
-- to authenticated roles only, while keeping SELECT fully permissive to public visitors.

-- 1. Secure storage.objects policies (uploads bucket)
DROP POLICY IF EXISTS "Public select uploads" ON storage.objects;
DROP POLICY IF EXISTS "Permissive insert uploads" ON storage.objects;
DROP POLICY IF EXISTS "Permissive update uploads" ON storage.objects;
DROP POLICY IF EXISTS "Permissive delete uploads" ON storage.objects;

CREATE POLICY "Public select uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated insert uploads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Authenticated update uploads" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Authenticated delete uploads" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'uploads');


-- 2. Secure public.delivery_categories policies
DROP POLICY IF EXISTS "Public read delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Permissive insert delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Permissive update delivery_categories" ON public.delivery_categories;
DROP POLICY IF EXISTS "Permissive delete delivery_categories" ON public.delivery_categories;

CREATE POLICY "Public read delivery_categories" ON public.delivery_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated manage delivery_categories" ON public.delivery_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. Secure public.delivery_items policies
DROP POLICY IF EXISTS "Public read delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Permissive insert delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Permissive update delivery_items" ON public.delivery_items;
DROP POLICY IF EXISTS "Permissive delete delivery_items" ON public.delivery_items;

CREATE POLICY "Public read delivery_items" ON public.delivery_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated manage delivery_items" ON public.delivery_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 4. Secure public.gallery policies
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
DROP POLICY IF EXISTS "Permissive insert gallery" ON public.gallery;
DROP POLICY IF EXISTS "Permissive update gallery" ON public.gallery;
DROP POLICY IF EXISTS "Permissive delete gallery" ON public.gallery;

CREATE POLICY "Public read gallery" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "Authenticated manage gallery" ON public.gallery
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 5. Secure public.signature_work policies
DROP POLICY IF EXISTS "Public read signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Permissive insert signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Permissive update signature_work" ON public.signature_work;
DROP POLICY IF EXISTS "Permissive delete signature_work" ON public.signature_work;

CREATE POLICY "Public read signature_work" ON public.signature_work
  FOR SELECT USING (true);

CREATE POLICY "Authenticated manage signature_work" ON public.signature_work
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 6. Secure public.site_settings policies
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Permissive insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Permissive update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Permissive delete site_settings" ON public.site_settings;

CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated manage site_settings" ON public.site_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 7. Secure public.delivery_subcategories policies
DROP POLICY IF EXISTS "Public read delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Permissive insert delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Permissive update delivery_subcategories" ON public.delivery_subcategories;
DROP POLICY IF EXISTS "Permissive delete delivery_subcategories" ON public.delivery_subcategories;

CREATE POLICY "Public read delivery_subcategories" ON public.delivery_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated manage delivery_subcategories" ON public.delivery_subcategories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Force reload schema cache
NOTIFY pgrst, 'reload schema';
