import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export type DeliverySubcategory = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  order_index: number;
  visibility: boolean;
  created_at: string;
};

export function useDeliverySubcategories(categoryId: string | null) {
  const [subcategories, setSubcategories] = useState<DeliverySubcategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubcategories = useCallback(async () => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    if (!isSupabaseConfigured() || !supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("delivery_subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .eq("visibility", true)
        .order("order_index");

      if (!error && data) {
        setSubcategories(data);
      }
    } catch (err) {
      console.error("[useDeliverySubcategories] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchSubcategories();

    if (!isSupabaseConfigured() || !supabase || !categoryId) return;

    const channel = supabase
      .channel(`subcategories-${categoryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_subcategories" },
        (payload) => {
          const changedCatId =
            (payload.new as { category_id?: string })?.category_id ||
            (payload.old as { category_id?: string })?.category_id;
          if (changedCatId === categoryId) fetchSubcategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId, fetchSubcategories]);

  return { subcategories, loading, refetch: fetchSubcategories };
}
