import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const INSTAGRAM_USERNAME_FALLBACK = "bikers_choice_kakinada";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_FOLLOWERS = 4800;

// Hardcoded fallbacks — safe to embed since these are public credentials
const SUPABASE_URL_FALLBACK = "https://ztolpmfzemhqyzdudbik.supabase.co";
const SUPABASE_KEY_FALLBACK = "sb_publishable_zaGtYw4hO9zzxtx76NUs3A_skIt7IDm";

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK;
  const key = process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_KEY_FALLBACK;
  if (!url || !key) return null;
  return createClient(url, key);
}

function parseFollowerCount(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();

  if (/k$/i.test(cleaned)) {
    return Math.round(parseFloat(cleaned.replace(/k$/i, "")) * 1000);
  }
  if (/m$/i.test(cleaned)) {
    return Math.round(parseFloat(cleaned.replace(/m$/i, "")) * 1_000_000);
  }

  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function parseInstagramUsername(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const linkMatch = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  if (linkMatch?.[1]) return linkMatch[1];

  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1);
    return handle ? handle : null;
  }

  if (/^[A-Za-z0-9._]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Strategy 1: Fetch and parse DuckDuckGo search result snippets (bypasses direct Instagram blocks)
 */
async function fetchFromDuckDuckGo(username: string): Promise<number | null> {
  const url = `https://html.duckduckgo.com/html/?q=instagram+${username}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[instagram-followers] DuckDuckGo search status ${response.status}`);
      return null;
    }

    const html = await response.text();
    // Match all snippets on the search results page
    const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)(?:<\/td>|<\/div>)/gi;
    const snippets = html.match(snippetRegex) || [];

    for (const snippet of snippets) {
      // Strip HTML tags (e.g. <b>, <a>) to get clean plain text
      const cleanText = snippet.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const followerMatch = cleanText.match(/([\d,\.]+[KkMm]?)\s*Followers/i);
      if (followerMatch) {
        const count = parseFollowerCount(followerMatch[1]);
        if (count > 0) return count;
      }
    }

    return null;
  } catch (err) {
    console.error("[instagram-followers] DuckDuckGo fetch error:", err);
    return null;
  }
}

/**
 * Strategy 2: Direct Instagram scraping (backup in case DDG fails)
 */
async function fetchFromInstagramDirect(username: string): Promise<number | null> {
  const instagramUrl = `https://www.instagram.com/${username}/`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(instagramUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[instagram-followers] Instagram status ${response.status}`);
      return null;
    }

    const html = await response.text();

    // og:description meta tag
    const ogPatterns = [
      /<meta\s+property="og:description"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+property="og:description"/i,
    ];
    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match) {
        const followerMatch = match[1].match(/([\d,\.]+[KkMm]?)\s*Followers/i);
        if (followerMatch) {
          const count = parseFollowerCount(followerMatch[1]);
          if (count > 0) return count;
        }
      }
    }

    // description meta tag
    const descPattern = /<meta\s+name="description"\s+content="([^"]+)"/i;
    const descMatch = html.match(descPattern);
    if (descMatch) {
      const followerMatch = descMatch[1].match(/([\d,\.]+[KkMm]?)\s*Followers/i);
      if (followerMatch) {
        const count = parseFollowerCount(followerMatch[1]);
        if (count > 0) return count;
      }
    }

    // edge_followed_by JSON count
    const jsonPattern = /"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)\s*\}/;
    const jsonMatch = html.match(jsonPattern);
    if (jsonMatch) {
      const count = parseInt(jsonMatch[1], 10);
      if (count > 0) return count;
    }

    // window._sharedData / follower_count
    const sharedDataPattern = /"follower_count"\s*:\s*(\d+)/;
    const sharedDataMatch = html.match(sharedDataPattern);
    if (sharedDataMatch) {
      const count = parseInt(sharedDataMatch[1], 10);
      if (count > 0) return count;
    }

    return null;
  } catch (err) {
    console.error("[instagram-followers] Direct Instagram fetch error:", err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const sb = getSupabaseClient();
  if (!sb) {
    return res.status(200).json({ count: DEFAULT_FOLLOWERS, source: "default" });
  }

  try {
    // 1. Fetch current settings row
    const { data: settings } = await sb
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const username = parseInstagramUsername(settings?.instagram_link) || INSTAGRAM_USERNAME_FALLBACK;
    const manualString = settings?.instagram_followers || "";
    const manualCount = parseInt(manualString.replace(/[^\d]/g, ""), 10) || DEFAULT_FOLLOWERS;
    const lastSync = settings?.updated_at ? new Date(settings.updated_at).getTime() : 0;
    const forceRefresh = req.query.refresh === "true";

    // 2. Check if cache is still fresh (< 1 hour)
    if (!forceRefresh && settings?.updated_at && Date.now() - lastSync < CACHE_TTL_MS) {
      return res.status(200).json({
        count: manualCount,
        source: "live",
        status: "Live Count Active",
        lastSync: settings.updated_at,
      });
    }

    // 3. Cache expired/missing, fetch live count. Try direct Instagram first, then DuckDuckGo.
    let freshCount = await fetchFromInstagramDirect(username);
    if (!freshCount || freshCount <= 0) {
      console.log("[instagram-followers] Direct Instagram failed, falling back to DuckDuckGo...");
      freshCount = await fetchFromDuckDuckGo(username);
    }

    if (freshCount && freshCount > 0) {
      // Success! Cache it in Supabase
      const now = new Date().toISOString();
      const formattedCount = freshCount.toLocaleString("en-IN") + "+";
      await sb
        .from("site_settings")
        .update({
          instagram_followers: formattedCount,
          updated_at: now,
        })
        .eq("id", settings.id);

      return res.status(200).json({
        count: freshCount,
        source: "live",
        status: "Live Count Active",
        lastSync: now,
      });
    }

    // 4. Live fetch failed — fallback to existing manual count and record attempt timestamp
    const now = new Date().toISOString();
    await sb
      .from("site_settings")
      .update({
        updated_at: now,
      })
      .eq("id", settings.id);

    return res.status(200).json({
      count: manualCount,
      source: "manual",
      status: "Manual Count Active",
      lastSync: settings?.updated_at || null,
    });
  } catch (err) {
    console.error("[instagram-followers] Serverless function crashed:", err);
    return res.status(200).json({ count: DEFAULT_FOLLOWERS, source: "default" });
  }
}
