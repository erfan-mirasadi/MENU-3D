import { NextResponse } from "next/server";
import { getMiddlewareAuthContext } from "@/services/middlewareAuthService";

const LANDING_LANGS = new Set(["en", "tr", "fa", "ar", "de", "ru"]);

// Map country codes to landing languages
const COUNTRY_TO_LANG = {
  // Turkish
  TR: "tr",
  AZ: "tr",

  // Persian
  IR: "fa",
  AF: "fa",
  TJ: "fa",

  // Arabic
  SA: "ar",
  AE: "ar",
  IQ: "ar",
  EG: "ar",
  JO: "ar",
  KW: "ar",
  QA: "ar",
  BH: "ar",
  OM: "ar",
  LB: "ar",
  SY: "ar",
  YE: "ar",
  LY: "ar",
  TN: "ar",
  DZ: "ar",
  MA: "ar",
  SD: "ar",
  MR: "ar",
  SO: "ar",
  DJ: "ar",
  KM: "ar",
  PS: "ar",

  // German
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
  LU: "de",

  // Russian
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
  UZ: "ru",

  // English (explicit)
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  NZ: "en",
  IE: "en",
  ZA: "en",
  SG: "en",
  PH: "en",
  IN: "en",
  PK: "en",
  NG: "en",
  GH: "en",
  KE: "en",
  JM: "en",
};

function detectLang(request) {
  //Try geo-location (Vercel header)
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (country && COUNTRY_TO_LANG[country]) {
    return COUNTRY_TO_LANG[country];
  }

  // Fallback to Accept-Language header
  const header = request.headers.get("accept-language") || "";
  const codes = header
    .split(",")
    .map((p) => p.trim().split(";")[0].split("-")[0].toLowerCase());
  return codes.find((c) => LANDING_LANGS.has(c)) || "en";
}

export async function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname;

  // Set page language for landing routes (/en, /tr, etc.)
  const firstSegment = pathname.split("/")[1];
  if (LANDING_LANGS.has(firstSegment)) {
    requestHeaders.set("x-page-lang", firstSegment);
  }

  // Root → redirect to /{detected_language}
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${detectLang(request)}`;
    return NextResponse.redirect(url);
  }

  const { user, response } = await getMiddlewareAuthContext(
    request,
    requestHeaders,
  );

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
