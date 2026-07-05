import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { DeliveryItem } from "./useDeliveryItems";
import type { DeliveryCategory } from "./useDeliveryCategories";
import { performSmartSearch, type SearchSuggestion } from "@/lib/searchEngine";
import { DEFAULT_DELIVERY_ITEMS } from "@/lib/mediaDefaults";

export function useSmartProductSearch(
  categories: DeliveryCategory[],
  useFallback = false
) {
  const [searchResults, setSearchResults] = useState<DeliveryItem[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const searchCounterRef = useRef(0);

  const search = useCallback(
    async (query: string, categoryIdScope: string | null = null) => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) {
        setSearchResults([]);
        setSuggestions([]);
        return;
      }

      // Fallback local search
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

        // Run smart ranking on fallback items
        const results = performSmartSearch(fallbackItems, categories, trimmed, categoryIdScope, []);
        setSearchResults(results.map(r => r.item));

        // Generate mock suggestions
        const suggs: SearchSuggestion[] = [];
        categories.forEach(c => {
          if (c.name.toLowerCase().includes(trimmed)) {
            suggs.push({ text: c.name, type: "category", categoryName: c.name });
          }
        });
        fallbackItems.forEach(item => {
          if (item.label.toLowerCase().includes(trimmed)) {
            suggs.push({ text: item.label, type: "product" });
          }
        });
        setSuggestions(suggs.slice(0, 5));
        return;
      }

      if (!isSupabaseConfigured() || !supabase) return;

      const currentCounter = ++searchCounterRef.current;
      setLoading(true);

      try {
        // 1. Identify matching Categories
        const matchingCatIds = categories
          .filter(c => c.name.toLowerCase().includes(trimmed))
          .map(c => c.id);

        // 2. Fetch matching Subcategories from database
        const { data: matchedSubcats } = await supabase
          .from("delivery_subcategories")
          .select("id, name")
          .ilike("name", `%${trimmed}%`);

        const matchingSubcatIds = (matchedSubcats || []).map(s => s.id);

        // 3. Build optimized search query for items
        // Match label OR bike compatibility array OR parent category OR subcategory
        const orConditions = [`label.ilike.%${trimmed}%`];
        
        // Postgres array check: overlaps or exact inclusion check
        orConditions.push(`compatible_bikes.cs.{"${query.trim()}"}`);

        if (matchingCatIds.length > 0) {
          orConditions.push(`category_id.in.(${matchingCatIds.map(id => `"${id}"`).join(",")})`);
        }
        if (matchingSubcatIds.length > 0) {
          orConditions.push(`subcategory_id.in.(${matchingSubcatIds.map(id => `"${id}"`).join(",")})`);
        }

        let queryBuilder = supabase
          .from("delivery_items")
          .select("id, category_id, subcategory_id, image_url, label, compatible_bikes, visibility, order_index")
          .or(orConditions.join(","))
          .eq("visibility", true);

        if (categoryIdScope) {
          queryBuilder = queryBuilder.eq("category_id", categoryIdScope);
        }

        const { data: matchedItems, error: err } = await queryBuilder.limit(60);

        if (currentCounter !== searchCounterRef.current) return; // Outdated request

        if (err) {
          console.error("[useSmartProductSearch] Search query error:", err);
          return;
        }

        const mappedItems: DeliveryItem[] = (matchedItems || []).map(d => ({
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

        // Format subcategory mapping for search engine scoring
        const subcatMap = (matchedSubcats || []).map(s => ({ id: s.id, name: s.name }));

        // 4. Score and Rank matched items client-side
        const ranked = performSmartSearch(mappedItems, categories, trimmed, categoryIdScope, subcatMap);
        setSearchResults(ranked.map(r => r.item));

        // 5. Build suggestions dynamically
        const suggsList: SearchSuggestion[] = [];
        categories.forEach(c => {
          if (c.name.toLowerCase().includes(trimmed)) {
            suggsList.push({ text: c.name, type: "category", categoryName: c.name });
          }
        });
        (matchedItems || []).slice(0, 6).forEach(item => {
          suggsList.push({ text: item.label, type: "product" });
        });

        setSuggestions(suggsList.slice(0, 5));
      } catch (ex) {
        console.error("[useSmartProductSearch] Exception during search:", ex);
      } finally {
        if (currentCounter === searchCounterRef.current) {
          setLoading(false);
        }
      }
    },
    [categories, useFallback]
  );

  return { searchResults, suggestions, search, loading };
}

export default useSmartProductSearch;
