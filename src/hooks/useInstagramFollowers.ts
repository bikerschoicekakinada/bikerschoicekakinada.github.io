import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const DEFAULT_FOLLOWERS = 4800;
const RECOVERY_INTERVAL_MS = 30 * 60 * 1000; // Auto-recovery refresh: 30 minutes

export function useInstagramFollowers() {
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetCountRef = useRef(0);

  useEffect(() => {
    targetCountRef.current = targetCount;
  }, [targetCount]);

  // Parse the stored follower string into a number
  const parseFollowers = useCallback((raw: string | null | undefined): number => {
    if (!raw) return 0;
    const parsed = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  }, []);

  // Fetch manual count from Supabase settings as fallback
  const fetchManualFromSupabase = useCallback(async (): Promise<number> => {
    if (!isSupabaseConfigured() || !supabase) return 0;
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("instagram_followers")
        .limit(1)
        .maybeSingle();
      if (!error && data?.instagram_followers) {
        return parseFollowers(data.instagram_followers);
      }
    } catch (err) {
      console.error("[useInstagramFollowers] Supabase fallback error:", err);
    }
    return 0;
  }, [parseFollowers]);

  // Combined fetch logic: Prio 1 & 2 (Vercel API: Live or Cached), Prio 3 (Supabase Manual), Prio 4 (Default)
  const loadFollowersCount = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch("/api/instagram-followers", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.count && data.count > 0) {
          setTargetCount(data.count);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("[useInstagramFollowers] Live API fetch failed, trying manual fallback:", err);
    }

    // Fallback: fetch manual count
    const manualCount = await fetchManualFromSupabase();
    if (manualCount > 0) {
      setTargetCount(manualCount);
      setLoading(false);
      return;
    }

    // Default fallback
    setTargetCount(DEFAULT_FOLLOWERS);
    setLoading(false);
  }, [fetchManualFromSupabase]);

  // Initial load
  useEffect(() => {
    loadFollowersCount();
  }, [loadFollowersCount]);

  // Auto-recovery polling in background every 30 minutes
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      console.log("[useInstagramFollowers] Background recovery refresh triggered...");
      loadFollowersCount(true);
    }, RECOVERY_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadFollowersCount]);

  // Real-time subscription - listen to site_settings changes in Supabase
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel("instagram-followers-live-db")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
        },
        (payload) => {
          // If the status is live or cached, try to use the live_count column
          const newStatus = payload.new?.instagram_followers_status;
          const newLiveCount = payload.new?.instagram_followers_live_count;
          const newManualFollowers = payload.new?.instagram_followers;

          if (newStatus === "live" && newLiveCount) {
            setTargetCount(newLiveCount);
          } else if (newStatus === "cached" && newLiveCount) {
            setTargetCount(newLiveCount);
          } else if (newManualFollowers) {
            const parsed = parseFollowers(newManualFollowers);
            if (parsed > 0) {
              setTargetCount(parsed);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parseFollowers]);

  // Callback ref for IntersectionObserver
  const setRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCount(0);
            startTimeRef.current = null;
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  }, []);

  // Animation effect
  useEffect(() => {
    if (!isVisible || targetCount === 0) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;

    const duration = 2000;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * targetCount));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(targetCount);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isVisible, targetCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { count, targetCount, loading, ref: setRef };
}
