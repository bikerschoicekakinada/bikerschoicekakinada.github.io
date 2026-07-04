import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { DeliveryItem } from "./useDeliveryItems";
import type { DeliveryCategory } from "./useDeliveryCategories";
import { performSmartSearch, generateSuggestions, type SearchSuggestion } from "@/lib/searchEngine";
import { DEFAULT_DELIVERY_ITEMS } from "@/lib/mediaDefaults";

export function useSmartProductSearch(
  categories: DeliveryCategory[],
  useFallback = false
) {
  const [allItems, setAllItems] = useState<DeliveryItem[]>([]);
  const [searchResults, setSearchResults] = useState<DeliveryItem[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const fetchAllItems = useCallback(async () => {
    if (useFallback) {
      const fallbackItems: DeliveryItem[] = [];
      Object.entries(DEFAULT_DELIVERY_ITEMS).forEach(([catId, list]) => {
        list.forEach((item, index) => {
          fallbackItems.push({
            id: `${catId}-${index}`,
            category_id: catId,
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
          });
        });
      });
      setAllItems(fallbackItems);
      setSubcategories([]);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) return;
    setLoading(true);

    try {
      const [itemsRes, subcatsRes] = await Promise.all([
        supabase.from("delivery_items").select("*").order("created_at", { ascending: false }),
        supabase.from("delivery_subcategories").select("id, name").order("order_index"),
      ]);

      if (itemsRes.error) {
        console.error("[useSmartProductSearch] Fetch all items error:", itemsRes.error);
      } else if (itemsRes.data) {
        setAllItems(itemsRes.data);
        fetchedRef.current = true;
      }

      if (subcatsRes.error) {
        console.error("[useSmartProductSearch] Fetch subcategories error:", subcatsRes.error);
      } else if (subcatsRes.data) {
        setSubcategories(subcatsRes.data);
      }
    } catch (err) {
      console.error("[useSmartProductSearch] Fetch all items exception:", err);
    } finally {
      setLoading(false);
    }
  }, [useFallback]);

  // Initial catalog load
  useEffect(() => {
    fetchAllItems();

    if (useFallback || !isSupabaseConfigured() || !supabase) return;

    // Realtime listener for product updates
    const channelItems = supabase
      .channel("delivery-items-smart-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_items" },
        () => {
          console.log("[useSmartProductSearch] Syncing local catalog items...");
          fetchAllItems();
        }
      )
      .subscribe();

    const channelSubcats = supabase
      .channel("delivery-subcats-smart-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_subcategories" },
        () => {
          console.log("[useSmartProductSearch] Syncing local catalog subcategories...");
          fetchAllItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelItems);
      supabase.removeChannel(channelSubcats);
    };
  }, [fetchAllItems, useFallback]);

  // Performs fast local search on cached collection
  const search = useCallback(
    (query: string, categoryIdScope: string | null = null) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        setSuggestions([]);
        return;
      }

      // 1. Perform relevance matching
      const matches = performSmartSearch(allItems, categories, trimmed, categoryIdScope, subcategories);
      setSearchResults(matches.map((m) => m.item));

      // 2. Generate suggestions
      const suggs = generateSuggestions(allItems, categories, trimmed);
      setSuggestions(suggs);
    },
    [allItems, categories, subcategories]
  );

  return { allItems, searchResults, suggestions, search, loading };
}

export default useSmartProductSearch;
