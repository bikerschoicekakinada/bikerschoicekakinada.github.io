import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { DEFAULT_DELIVERY_CATEGORIES } from "@/lib/mediaDefaults";

export type DeliveryCategory = {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  order_index: number;
  visibility: boolean;
  created_at: string;
};

export function useDeliveryCategories() {
  const [categories, setCategories] = useState<DeliveryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setCategories(
        DEFAULT_DELIVERY_CATEGORIES.map((cat) => ({
          ...cat,
          description: null,
          visibility: true,
          created_at: "",
        }))
      );
      setError(null);
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchCategories = async () => {
      try {
        const { data, error: err } = await supabase
          .from("delivery_categories")
          .select("*")
          .order("order_index");

        if (!active) return;

        if (err) {
          setError(err.message);
          setCategories(
            DEFAULT_DELIVERY_CATEGORIES.map((cat) => ({
              ...cat,
              description: null,
              visibility: true,
              created_at: "",
            }))
          );
          setUsingFallback(true);
          return;
        }

        if (data && data.length > 0) {
          setCategories(data);
          setUsingFallback(false);
        } else {
          setCategories(
            DEFAULT_DELIVERY_CATEGORIES.map((cat) => ({
              ...cat,
              description: null,
              visibility: true,
              created_at: "",
            }))
          );
          setError(null);
          setUsingFallback(true);
        }
      } catch (err) {
        console.error("[useDeliveryCategories] Fetch failed:", err);
        if (active) {
          setError("Failed to load categories");
          setCategories(
            DEFAULT_DELIVERY_CATEGORIES.map((cat) => ({
              ...cat,
              description: null,
              visibility: true,
              created_at: "",
            }))
          );
          setUsingFallback(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategories();

    const channel = supabase
      .channel("delivery-categories-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_categories" },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { categories, loading, error, usingFallback };
}
