import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl, isInviteOnlyMode } from "@/lib/env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/meetings",
  "/minutes",
  "/commitments",
  "/my-commitments",
  "/reports",
  "/users",
  "/audit",
  "/settings",
  "/account",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path === "/register" && isInviteOnlyMode()) {
    const target = request.nextUrl.clone();
    if (user) {
      target.pathname = "/dashboard";
    } else {
      target.pathname = "/login";
      target.searchParams.set("notice", "invite_only");
    }
    return NextResponse.redirect(target);
  }

  if (path === "/") {
    const target = request.nextUrl.clone();
    target.pathname = user ? "/dashboard" : "/login";
    target.search = "";
    return NextResponse.redirect(target);
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
