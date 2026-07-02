import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { DeliveryItem } from "./useDeliveryItems";
import type { DeliveryCategory } from "./useDeliveryCategories";
import { DEFAULT_DELIVERY_ITEMS } from "@/lib/mediaDefaults";

export function useProductSearch(
  categoryId: string | null,
  query: string,
  useFallback = false,
  categories: DeliveryCategory[] = []
) {
  const [results, setResults] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (useFallback) {
      setLoading(true);
      // 1. Gather all fallback items
      let allFallback: DeliveryItem[] = [];
      if (categoryId) {
        const items = DEFAULT_DELIVERY_ITEMS[categoryId] || [];
        allFallback = items.map((item, index) => ({
          id: `${categoryId}-${index}`,
          category_id: categoryId,
          image_url: item.image_url,
          label: item.label,
          order_index: item.order_index,
          created_at: "",
        }));
      } else {
        Object.entries(DEFAULT_DELIVERY_ITEMS).forEach(([catId, items]) => {
          items.forEach((item, index) => {
            allFallback.push({
              id: `${catId}-${index}`,
              category_id: catId,
              image_url: item.image_url,
              label: item.label,
              order_index: item.order_index,
              created_at: "",
            });
          });
        });
      }

      // 2. Local search match logic (ignores case, extra spaces, partial matching)
      const queryLower = trimmed.toLowerCase();
      const matched = allFallback.filter((item) => {
        const labelMatch = item.label.toLowerCase().includes(queryLower);
        
        // Match category name
        const catName = categories.find((c) => c.id === item.category_id)?.name || "";
        const catMatch = catName.toLowerCase().includes(queryLower);
        
        return labelMatch || catMatch;
      });

      setResults(matched);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setResults([]);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Resolve categories that match the query
        const queryLower = trimmed.toLowerCase();
        const matchingCatIds = categories
          .filter((cat) => cat.name.toLowerCase().includes(queryLower))
          .map((cat) => cat.id);

        let sbQuery = supabase.from("delivery_items").select("*");

        // Category scoping
        if (categoryId) {
          sbQuery = sbQuery.eq("category_id", categoryId);
          sbQuery = sbQuery.ilike("label", `%${trimmed}%`);
        } else {
          // Global search
          if (matchingCatIds.length > 0) {
            // Match either the label OR if it belongs to one of the matching category IDs
            sbQuery = sbQuery.or(
              `label.ilike.%${trimmed}%,category_id.in.(${matchingCatIds.join(",")})`
            );
          } else {
            sbQuery = sbQuery.ilike("label", `%${trimmed}%`);
          }
        }

        const { data, error } = await sbQuery.order("order_index").limit(100);

        if (!active) return;

        if (error) {
          console.error("[useProductSearch] Database error:", error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error("[useProductSearch] Search failed:", err);
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      active = false;
    };
  }, [categoryId, query, useFallback, categories]);

  return { results, loading };
}
export default useProductSearch;
