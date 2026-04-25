import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that don't require authentication.
 */
const PUBLIC_ROUTES = ["/login"];

/**
 * Routes that require admin role.
 */
const ADMIN_ROUTE_PREFIX = "/admin";

/**
 * Determine the role-based redirect path for an authenticated user.
 */
function getRoleRedirect(role: string | undefined): string {
  return role === "admin" ? "/admin/dashboard" : "/dashboard";
}

/**
 * Check if a user role is allowed to access a given pathname.
 */
export function isRouteAllowed(
  role: "employee" | "admin",
  pathname: string
): boolean {
  // Admin can access everything
  if (role === "admin") return true;
  // Employee cannot access admin routes
  if (pathname.startsWith("/admin")) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value }: any) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Helper to redirect while preserving cookies from the refreshed session
  const redirect = (url: string) => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = url;
    const response = NextResponse.redirect(redirectUrl);
    // Copy refreshed cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
      });
    });
    return response;
  };

  // Allow public routes (login)
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (isPublic) {
    // If already authenticated and visiting login, redirect to appropriate dashboard
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      return redirect(getRoleRedirect(profile?.role));
    }
    return supabaseResponse;
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    return redirect("/login");
  }

  // Role-based routing and auto-redirection
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // 1. Root path handling: redirect based on role
  if (pathname === "/") {
    return redirect(getRoleRedirect(role));
  }

  // 2. Admin trying to access employee dashboard — redirect to admin dashboard
  if (pathname === "/dashboard" && role === "admin") {
    return redirect("/admin/dashboard");
  }

  // 3. Employee trying to access admin route — redirect to app dashboard
  if (pathname.startsWith(ADMIN_ROUTE_PREFIX) && role !== "admin") {
    return redirect("/dashboard");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
