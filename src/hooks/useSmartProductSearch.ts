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
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const fetchAllItems = useCallback(async () => {
    if (useFallback) {
      let fallbackItems: DeliveryItem[] = [];
      Object.entries(DEFAULT_DELIVERY_ITEMS).forEach(([catId, list]) => {
        list.forEach((item, index) => {
          fallbackItems.push({
            id: `${catId}-${index}`,
            category_id: catId,
            image_url: item.image_url,
            label: item.label,
            order_index: item.order_index,
            created_at: "",
          });
        });
      });
      setAllItems(fallbackItems);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("delivery_items")
        .select("*")
        .order("order_index");

      if (error) {
        console.error("[useSmartProductSearch] Fetch all items error:", error);
      } else if (data) {
        setAllItems(data);
        fetchedRef.current = true;
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
    const channel = supabase
      .channel("delivery-items-smart-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_items" },
        () => {
          console.log("[useSmartProductSearch] Syncing local catalog with database updates...");
          fetchAllItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      const matches = performSmartSearch(allItems, categories, trimmed, categoryIdScope);
      setSearchResults(matches.map((m) => m.item));

      // 2. Generate suggestions
      const suggs = generateSuggestions(allItems, categories, trimmed);
      setSuggestions(suggs);
    },
    [allItems, categories]
  );

  return { allItems, searchResults, suggestions, search, loading };
}

export default useSmartProductSearch;
