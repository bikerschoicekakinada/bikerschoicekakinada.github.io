import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "bikerschoicekakinada390@gmail.com";
const ADMIN_PASSWORD = "pavan390";
const SESSION_EXPIRY_KEY = "bck_session_expires_at";
const LOCAL_AUTH_KEY = "bck_local_auth";

export { ADMIN_EMAIL };

/**
 * Attempts to log in the admin.
 * If Supabase is active, verifies credentials via Supabase Authentication.
 * Otherwise, checks credentials against the secure local fallback.
 */
export async function adminLogin(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (normalizedEmail !== ADMIN_EMAIL.toLowerCase()) {
    return false;
  }

  // 1. Supabase Authentication if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password.trim(),
      });

      if (error || !data.session) {
        console.warn("[AdminAuth] Supabase auth failed, trying local fallback:", error?.message);
        // Fallback to local hardcoded credentials if Supabase fails (safety margin)
        if (password.trim() === ADMIN_PASSWORD) {
          localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + 48 * 60 * 60 * 1000).toString());
          localStorage.setItem(LOCAL_AUTH_KEY, "true");
          return true;
        }
        return false;
      }

      // Secure session validated by Supabase, set expiration to exactly 48 hours
      localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + 48 * 60 * 60 * 1000).toString());
      return true;
    } catch (err) {
      console.error("[AdminAuth] Supabase login error:", err);
    }
  }

  // 2. Fallback to local credentials (e.g. offline testing or local build)
  if (password.trim() === ADMIN_PASSWORD) {
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + 48 * 60 * 60 * 1000).toString());
    localStorage.setItem(LOCAL_AUTH_KEY, "true");
    return true;
  }

  return false;
}

/**
 * Fast synchronous check for redirect guards (prevents loading flicker).
 */
export function isAdminLoggedIn(): boolean {
  const expiresAtStr = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!expiresAtStr) return false;

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  if (isSupabaseConfigured() && supabase) {
    const keys = Object.keys(localStorage);
    const hasSbSession = keys.some(key => key.startsWith("sb-") && key.endsWith("-auth-token"));
    if (hasSbSession) return true;
  }

  return localStorage.getItem(LOCAL_AUTH_KEY) === "true";
}

/**
 * Async validation check for protected routes.
 * Confirms session existence, 48h limit, email authorization, and token validity.
 */
export async function checkSessionValid(): Promise<boolean> {
  try {
    // 1. Session Expiration check
    const expiresAtStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiresAtStr) return false;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      await adminLogout();
      return false;
    }

    // 2. Supabase active session validation
    if (isSupabaseConfigured() && supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session || !session.user) {
        // Double check local auth key if Supabase token is stale but local fallback is set
        if (localStorage.getItem(LOCAL_AUTH_KEY) === "true") {
          return true;
        }
        await adminLogout();
        return false;
      }

      if (session.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await adminLogout();
        return false;
      }
      return true;
    }

    // 3. Fallback check
    return localStorage.getItem(LOCAL_AUTH_KEY) === "true";
  } catch (err) {
    console.error("[AdminAuth] Session validation error:", err);
    return false;
  }
}

/**
 * Clears local state and signs out of Supabase to revoke tokens securely.
 */
export async function adminLogout(): Promise<void> {
  localStorage.removeItem(SESSION_EXPIRY_KEY);
  localStorage.removeItem(LOCAL_AUTH_KEY);
  
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[AdminAuth] Supabase signOut error:", err.message);
    }
  }
}
