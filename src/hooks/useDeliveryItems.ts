import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!categoryId) {
      setItems([]);
      return;
    }

    if (useFallback) {
      const fallbackItems = DEFAULT_DELIVERY_ITEMS[categoryId] || [];
      setItems(
        fallbackItems.map((item, index) => ({
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
        }))
      );
      setError(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setError("Supabase not configured");
      return;
    }

    let active = true;

    const fetchItems = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("delivery_items")
          .select("*")
          .eq("category_id", categoryId)
          .order("created_at", { ascending: false });

        // Optional subcategory filter
        if (subcategoryId) {
          query = query.eq("subcategory_id", subcategoryId);
        } else if (subcategoryId === null) {
          // null means explicitly no subcategory filter — show all
        }

        const { data, error: err } = await query;

        if (!active) return;

        if (err) {
          setError(err.message);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.error("[useDeliveryItems] Fetch failed:", err);
        if (active) setError("Failed to load items");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchItems();

    const channel = supabase
      .channel(`delivery-items-${categoryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_items" },
        (payload) => {
          const newCategory = (payload.new as { category_id?: string })?.category_id;
          const oldCategory = (payload.old as { category_id?: string })?.category_id;
          if (newCategory === categoryId || oldCategory === categoryId) {
            fetchItems();
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [categoryId, subcategoryId, useFallback]);

  return { items, loading, error };
}
