import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

/**
 * Authentication middleware for admin routes.
 * This runs on every request in SSR mode.
 */
export const onRequest = defineMiddleware(
  async ({ url, redirect, locals, cookies }, next) => {
    // Check if the current request is for an admin page
    const isAdminPath = url.pathname.startsWith("/admin");
    const isLoginPage = url.pathname === "/admin/login";

    // Handle Supabase auth tokens from cookies for SSR
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // If it's an admin route and not the login page, verify authentication
    if (isAdminPath && !isLoginPage) {
      // Check for an active session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // No active session found, redirect to the login page
        return redirect("/admin/login");
      }

      // Pass session/user data to the page through locals if needed
      locals.user = session.user;
      locals.session = session;
    }

    // Proceed to the next middleware or the actual page rendering
    return next();
  },
);
