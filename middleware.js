import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const middleware = async (req) => {
  const response = await getToken({ req });
  const token = response?.accessToken;
  const isPinVerified = response?.pinVerified;

  const path = req.nextUrl.pathname;
  const isStaticAsset = /\.[^/]+$/.test(path);
  const isPublic = path === "/login" || path === "/verify-pin" || isStaticAsset;

  // 1. No token -> go to login
  if (!token && !isPublic) {
    const url = req.nextUrl.clone();
    const callbackUrl = encodeURIComponent(url.pathname);
    url.pathname = "/login";
    url.search = `callbackUrl=${callbackUrl}`;
    return NextResponse.redirect(url);
  }

  // 2. Token but pin not verified -> go to verify-pin
  if (token && !isPinVerified && path !== "/verify-pin" && path !== "/login") {
    const url = req.nextUrl.clone();
    const callbackUrl = encodeURIComponent(url.pathname);
    url.pathname = "/verify-pin";
    url.search = `callbackUrl=${callbackUrl}`;
    return NextResponse.redirect(url);
  }

  // 3. Token + pin verified -> prevent access to verify-pin or login
  if (token && isPinVerified && (path === "/verify-pin" || path === "/login")) {
    const url = req.nextUrl.clone();
    const redirectTo = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";
    url.pathname = redirectTo;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Proceed normally otherwise
  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
