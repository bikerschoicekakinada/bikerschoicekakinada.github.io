import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { DEFAULT_DELIVERY_ITEMS } from "@/lib/mediaDefaults";

export type DeliveryItem = {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  image_url: string;
  label: string;
  order_index: number;
  created_at: string;
  brand: string | null;
  price: number | null;
  description: string | null;
  availability: boolean;
  compatible_bikes: string[];
  instagram_reel_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  tags: string[];
  search_keywords: string[];
  featured: boolean;
  visibility: boolean;
  additional_images: string[];
};

export function useDeliveryItems(
  categoryId: string | null,
  useFallback = false,
  subcategoryId?: string | null
) {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);

  const PAGE_SIZE = 24;

  const fetchItems = useCallback(async (pageNum: number, reset = false) => {
    if (!categoryId) {
      setItems([]);
      return;
    }

    if (useFallback) {
      const fallbackItems = DEFAULT_DELIVERY_ITEMS[categoryId] || [];
      const mapped = fallbackItems.map((item, index) => ({
        id: `${categoryId}-${index}`,
        category_id: categoryId,
        subcategory_id: null,
        image_url: item.image_url,
        label: item.label,
        order_index: item.order_index,
        created_at: "",
        brand: null,
        price: null,
        description: null,
        availability: true,
        compatible_bikes: [],
        instagram_reel_url: null,
        before_image_url: null,
        after_image_url: null,
        tags: [],
        search_keywords: [],
        featured: false,
        visibility: true,
        additional_images: [],
      }));
      setItems(mapped);
      setHasMore(false);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setError("Supabase not configured");
      return;
    }

    if (isFetchingRef.current && !reset) return;
    isFetchingRef.current = true;

    if (reset) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }

    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Select only the columns required for the product card
      let query = supabase
        .from("delivery_items")
        .select("id, category_id, subcategory_id, image_url, label, compatible_bikes, visibility, order_index")
        .eq("category_id", categoryId)
        .order("order_index", { ascending: true })
        .range(from, to);

      if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
      } else if (subcategoryId === null) {
        query = query.is("subcategory_id", null);
      }

      const { data, error: err } = await query;

      if (err) {
        setError(err.message);
        setHasMore(false);
      } else if (data) {
        const newItems = data.map((d) => ({
          id: d.id,
          category_id: d.category_id,
          subcategory_id: d.subcategory_id,
          image_url: d.image_url,
          label: d.label,
          order_index: d.order_index,
          created_at: "",
          brand: null,
          price: null,
          description: null,
          availability: true,
          compatible_bikes: d.compatible_bikes || [],
          instagram_reel_url: null,
          before_image_url: null,
          after_image_url: null,
          tags: [],
          search_keywords: [],
          featured: false,
          visibility: d.visibility !== false,
          additional_images: [],
        }));

        setItems((prev) => {
          const next = reset ? newItems : [...prev, ...newItems];
          return next;
        });
        setHasMore(newItems.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("[useDeliveryItems] Fetch failed:", err);
      setError("Failed to load items");
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [categoryId, subcategoryId, useFallback]);

  // Reset & load page 0 when filters change
  useEffect(() => {
    fetchItems(0, true);
  }, [categoryId, subcategoryId, fetchItems]);

  // Real-time updates subscription
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || useFallback || !categoryId) return;

    const channel = supabase
      .channel(`delivery-items-${categoryId}-${subcategoryId || "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_items" },
        () => {
          fetchItems(0, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId, subcategoryId, useFallback, fetchItems]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isFetchingRef.current) {
      fetchItems(page + 1, false);
    }
  }, [loading, hasMore, page, fetchItems]);

  return { items, loading, error, hasMore, loadMore };
}
