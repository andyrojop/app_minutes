import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { isInviteOnlyMode } from "@/lib/env";

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

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthed = !!token && token.error !== "RefreshAccessTokenError";

  const path = request.nextUrl.pathname;

  if (path === "/register" && isInviteOnlyMode()) {
    const target = request.nextUrl.clone();
    if (isAuthed) {
      target.pathname = "/dashboard";
    } else {
      target.pathname = "/login";
      target.searchParams.set("notice", "invite_only");
    }
    return NextResponse.redirect(target);
  }

  if (path === "/") {
    const target = request.nextUrl.clone();
    target.pathname = isAuthed ? "/dashboard" : "/login";
    target.search = "";
    return NextResponse.redirect(target);
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!isAuthed && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isAuthed && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
