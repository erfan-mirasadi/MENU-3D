import { NextResponse } from "next/server";
import { getMiddlewareAuthContext } from "@/services/middlewareAuthService";

export async function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);

  const { user, response } = await getMiddlewareAuthContext(
    request,
    requestHeaders,
  );
  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/admin") && !pathname.includes("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", "owner");
    return NextResponse.redirect(url);
  }

  if (!user && pathname.startsWith("/waiter") && !pathname.includes("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", "waiter");
    return NextResponse.redirect(url);
  }

  if (
    !user &&
    pathname.startsWith("/cashier") &&
    !pathname.includes("/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", "cashier");
    return NextResponse.redirect(url);
  }

  if (!user && pathname.startsWith("/chef") && !pathname.includes("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("role", "chef");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
