import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up");

  const isPublicRoute =
    req.nextUrl.pathname.startsWith("/call") ||
    req.nextUrl.pathname.startsWith("/api/tutor/interact") ||
    req.nextUrl.pathname.startsWith("/api/tutor/evaluate");

  if (!session && !isAuthRoute && !isPublicRoute) {
    if (req.nextUrl.pathname !== "/") {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
