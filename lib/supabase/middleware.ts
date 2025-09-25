import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const pathname = request.nextUrl.pathname;

  console.log(
    `[MIDDLEWARE-DEBUG ${timestamp}] ========== MIDDLEWARE REQUEST ==========`
  );
  console.log(`[MIDDLEWARE-DEBUG ${timestamp}] Path: ${pathname}`);
  console.log(`[MIDDLEWARE-DEBUG ${timestamp}] Method: ${request.method}`);
  console.log(
    `[MIDDLEWARE-DEBUG ${timestamp}] Headers: ${JSON.stringify(
      Object.fromEntries(request.headers.entries())
    )}`
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(`[MIDDLEWARE-DEBUG ${timestamp}] User exists: ${!!user}`);
  console.log(`[MIDDLEWARE-DEBUG ${timestamp}] User ID: ${user?.id || "none"}`);

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/auth/verify-email",
    "/auth/error",
    "/auth/callback",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  console.log(
    `[MIDDLEWARE-DEBUG ${timestamp}] Is public route: ${isPublicRoute}`
  );
  console.log(
    `[MIDDLEWARE-DEBUG ${timestamp}] Public routes: ${JSON.stringify(
      publicRoutes
    )}`
  );

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    console.log(
      `[MIDDLEWARE-DEBUG ${timestamp}] ⚠️  No user, redirecting to login`
    );
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated, get their profile for role-based routing
  if (user && !isPublicRoute) {
    console.log(
      `[MIDDLEWARE-DEBUG ${timestamp}] 🔄 Fetching user profile for routing`
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log(
      `[MIDDLEWARE-DEBUG ${timestamp}] User profile role: ${
        profile?.role || "null"
      }`
    );

    // Role-based routing logic
    if (profile) {
      // Let admins access homepage - no auto-redirect
      // Admins can now choose whether to go to admin dashboard via sidebar navigation
      if (pathname === "/" && profile.role === "admin") {
        console.log(
          `[MIDDLEWARE-DEBUG ${timestamp}] ✅ Admin accessing homepage - allowing access`
        );
      }

      // Regular user trying to access admin routes - redirect to homepage
      if (pathname.startsWith("/admin-dashboard") && profile.role !== "admin") {
        console.log(
          `[MIDDLEWARE-DEBUG ${timestamp}] 🚫 Non-admin trying to access admin route, redirecting to /`
        );
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } else {
      console.log(
        `[MIDDLEWARE-DEBUG ${timestamp}] ⚠️  No profile found for user`
      );
    }
  }

  if (!user && pathname === "/") {
    console.log(
      `[MIDDLEWARE-DEBUG ${timestamp}] 🔄 No user at root, redirecting to login`
    );
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  console.log(
    `[MIDDLEWARE-DEBUG ${timestamp}] ✅ Middleware complete - allowing request`
  );
  return supabaseResponse;
}
