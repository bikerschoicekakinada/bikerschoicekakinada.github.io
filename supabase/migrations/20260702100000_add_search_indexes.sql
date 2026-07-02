-- Add performance indexes for product searching and category lookups on delivery_items
CREATE INDEX IF NOT EXISTS idx_delivery_items_label ON public.delivery_items (label);
CREATE INDEX IF NOT EXISTS idx_delivery_items_category_id ON public.delivery_items (category_id);
