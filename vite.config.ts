import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "api-instagram-followers",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const urlPath = req.url || "";
          console.log("[ViteDevAPI] Middleware check URL:", urlPath);
          
          if (urlPath.startsWith("/api/instagram-followers")) {
            console.log("[ViteDevAPI] Intercepted path!");
            (async () => {
              try {
                const env = loadEnv(server.config.mode, process.cwd());
                const supabaseUrl = env.VITE_SUPABASE_URL || "https://ztolpmfzemhqyzdudbik.supabase.co";
                const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "sb_publishable_zaGtYw4hO9zzxtx76NUs3A_skIt7IDm";
                
                const { createClient } = await import("@supabase/supabase-js");
                const sb = createClient(supabaseUrl, supabaseAnonKey);

                const { data: settings } = await sb
                  .from("site_settings")
                  .select("*")
                  .limit(1)
                  .maybeSingle();

                if (!settings) {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ count: 4800, source: "default" }));
                  return;
                }

                const urlObj = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
                const forceRefresh = urlObj.searchParams.get("refresh") === "true";

                const lastSync = settings.updated_at ? new Date(settings.updated_at).getTime() : 0;
                const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
                const manualCount = parseInt(settings.instagram_followers?.replace(/[^\d]/g, "") || "", 10) || 4800;

                if (!forceRefresh && settings.updated_at && (Date.now() - lastSync < CACHE_TTL_MS)) {
                  console.log("[ViteDevAPI] Returning cached count from database:", manualCount);
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({
                    count: manualCount,
                    source: "live",
                    status: "Live Count Active",
                    lastSync: settings.updated_at,
                  }));
                  return;
                }

                let username = "bikers_choice_kakinada";
                if (settings.instagram_link) {
                  const trimmed = settings.instagram_link.trim();
                  const linkMatch = trimmed.match(/instagram\.com\/([^/?#]+)/i);
                  if (linkMatch?.[1]) username = linkMatch[1];
                  else if (trimmed.startsWith("@")) username = trimmed.slice(1);
                  else if (/^[A-Za-z0-9._]+$/.test(trimmed)) username = trimmed;
                }

                let count: number | null = null;
                
                // --- STRATEGY 1: Direct Instagram (Masquerade as Googlebot) ---
                try {
                  const directController = new AbortController();
                  const directTimeout = setTimeout(() => directController.abort(), 6000);
                  
                  const directResponse = await fetch(`https://www.instagram.com/${username}/`, {
                    headers: { 
                      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
                    },
                    signal: directController.signal,
                  });
                  
                  clearTimeout(directTimeout);

                  if (directResponse.ok) {
                    const html = await directResponse.text();
                    const ogPatterns = [
                      /<meta\s+property="og:description"\s+content="([^"]+)"/i,
                      /<meta\s+content="([^"]+)"\s+property="og:description"/i,
                    ];
                    for (const pattern of ogPatterns) {
                      const match = html.match(pattern);
                      if (match) {
                        const followerMatch = match[1].match(/([\d,\.]+[KkMm]?)\s*Followers/i);
                        if (followerMatch) {
                          const rawVal = followerMatch[1].replace(/,/g, "").trim();
                          if (/k$/i.test(rawVal)) count = Math.round(parseFloat(rawVal.replace(/k$/i, "")) * 1000);
                          else if (/m$/i.test(rawVal)) count = Math.round(parseFloat(rawVal.replace(/m$/i, "")) * 1000000);
                          else count = parseInt(rawVal, 10);
                          console.log("[ViteDevAPI] Direct Instagram successfully extracted count:", count);
                          break;
                        }
                      }
                    }
                  }
                } catch (directErr) {
                  console.error("[ViteDevAPI] Direct Instagram fetch failed:", directErr);
                }

                // --- STRATEGY 2: DuckDuckGo (Backup) ---
                if (!count || count <= 0) {
                  try {
                    const ddgController = new AbortController();
                    const ddgTimeout = setTimeout(() => ddgController.abort(), 6000);
                    
                    const ddgResponse = await fetch(`https://html.duckduckgo.com/html/?q=instagram+${username}`, {
                      headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                      },
                      signal: ddgController.signal,
                    });
                    
                    clearTimeout(ddgTimeout);
                    
                    if (ddgResponse.ok) {
                      const html = await ddgResponse.text();
                      // Match all snippets on the search results page
                      const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)(?:<\/td>|<\/div>)/gi;
                      const snippets = html.match(snippetRegex) || [];
                      
                      for (const snippet of snippets) {
                        // Strip HTML tags (e.g. <b>, <a>) to get clean plain text
                        const cleanText = snippet.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                        const followerMatch = cleanText.match(/([\d,\.]+[KkMm]?)\s*Followers/i);
                        if (followerMatch) {
                          const rawVal = followerMatch[1].replace(/,/g, "").trim();
                          let parsedCount = 0;
                          if (/k$/i.test(rawVal)) {
                            parsedCount = Math.round(parseFloat(rawVal.replace(/k$/i, "")) * 1000);
                          } else if (/m$/i.test(rawVal)) {
                            parsedCount = Math.round(parseFloat(rawVal.replace(/m$/i, "")) * 1000000);
                          } else {
                            parsedCount = parseInt(rawVal, 10);
                          }
                          if (parsedCount > 0) {
                            count = parsedCount;
                            console.log("[ViteDevAPI] DuckDuckGo scraper successfully extracted count:", count);
                            break;
                          }
                        }
                      }
                    }
                  } catch (ddgErr) {
                    console.error("[ViteDevAPI] DuckDuckGo fetch failed:", ddgErr);
                  }
                }

                // --- WRITE RESULT & FINALIZE ---
                if (count && count > 0) {
                  const now = new Date().toISOString();
                  const formattedCount = count.toLocaleString("en-IN") + "+";
                  // Update only existing columns
                  await sb.from("site_settings").update({
                    instagram_followers: formattedCount,
                    updated_at: now
                  }).eq("id", settings.id);

                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ count, source: "live", status: "Live Count Active", lastSync: now }));
                  return;
                }

                // If live fetch failed, we just return the current parsed value and update updated_at
                const now = new Date().toISOString();
                const manual = parseInt(settings.instagram_followers?.replace(/[^\d]/g, "") || "", 10) || 4800;
                await sb.from("site_settings").update({
                  updated_at: now
                }).eq("id", settings.id);

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ count: manual, source: "manual", status: "Manual Count Active", lastSync: settings.updated_at || null }));
                return;
              } catch (err) {
                console.error("[ViteDevAPI] Error:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Local dev API error" }));
                return;
              }
            })();
            return;
          }
          next();
        });

        // Prepend our custom middleware to the absolute front of Connect's stack.
        // This bypasses Vite's static file and module resolvers.
        const stack = server.middlewares.stack;
        const ourMiddleware = stack.pop();
        if (ourMiddleware) {
          stack.unshift(ourMiddleware);
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
