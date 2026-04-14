import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isAdminRoute,
  isBypassPath,
  isCreatorRoute,
  isFanRoute,
  isDebugRoute,
  isMarketingRoute,
  isPublicRoute,
  shouldNoIndex,
  isEmailInAdminAllowlist,
  getRoleFromUser,
} from "@/lib/auth/role-guards";
import { hasMinimumRole } from "@/lib/auth/permissions";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.searchParams.set("next", request.nextUrl.pathname + (request.nextUrl.search ?? ""));
  return NextResponse.redirect(url);
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────

async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // ── Legacy onboarding redirect (308 permanent) ──────────────
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/onboarding";
    return NextResponse.redirect(url, { status: 308 });
  }

  // ── Static assets and API routes bypass auth entirely ───────
  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  // ── Build mutable response so cookies can be refreshed ──────
  const response = NextResponse.next({
    request: { headers: request.headers },
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Read role from JWT app_metadata — no extra DB query needed.
  // The sync_role_to_jwt trigger keeps this current on every role change.
  const role = getRoleFromUser(user);

  // ── Debug routes: invisible in production ───────────────────
  if (process.env.NODE_ENV === "production" && isDebugRoute(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // ── Admin routes ─────────────────────────────────────────────
  // Return 404 (not 401/403) for all non-admins — security by obscurity.
  // Three gates must all pass:
  //   1. User is authenticated
  //   2. JWT role is admin or super_admin
  //   3. Email is in the admin_allowlist (defence-in-depth; one DB query)
  if (isAdminRoute(pathname)) {
    if (!user) {
      return new NextResponse(null, { status: 404 });
    }
    if (!hasMinimumRole(role, "admin")) {
      return new NextResponse(null, { status: 404 });
    }
    if (!user.email) {
      return new NextResponse(null, { status: 404 });
    }
    const { allowed } = await isEmailInAdminAllowlist(user.email);
    if (!allowed) {
      return new NextResponse(null, { status: 404 });
    }

    response.headers.set("X-User-Role", role);
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  // ── Creator routes (/dashboard, /onboarding) ─────────────────
  // Requires authentication AND creator (or higher) role.
  // Fans who land here are redirected to their own dashboard.
  if (isCreatorRoute(pathname)) {
    if (!user) {
      return redirectTo(request, "/login");
    }
    if (!hasMinimumRole(role, "creator")) {
      // Fan trying to access creator dashboard — send to fan dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/fan";
      url.searchParams.delete("next");
      return NextResponse.redirect(url);
    }
    response.headers.set("X-User-Role", role);
    return response;
  }

  // ── Fan routes (/fan) ─────────────────────────────────────────
  // Any authenticated user can access the fan dashboard.
  if (isFanRoute(pathname)) {
    if (!user) {
      return redirectTo(request, "/login");
    }
    response.headers.set("X-User-Role", role);
    return response;
  }

  // ── Marketing routes ─────────────────────────────────────────
  if (isMarketingRoute(pathname)) {
    if (!user) {
      return redirectTo(request, "/login");
    }
    response.headers.set("X-User-Role", role);
    return response;
  }

  // ── All other non-public routes ───────────────────────────────
  if (!isPublicRoute(pathname)) {
    if (!user) {
      return redirectTo(request, "/login");
    }
  }

  // ── SEO: noindex on all authenticated/private areas ──────────
  if (shouldNoIndex(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store");
  }

  if (user) {
    response.headers.set("X-User-Role", role);
  }

  return response;
}

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static file extensions
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml|woff|woff2|ttf)$).*)",
  ],
};
