import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

let locales = ["en", "ru"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale in the pathname
  if (pathnameIsMissingLocale) {
    const locale = locales[0];
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
        request.url
      )
    );
  }

  // Check if this is an admin route
  if (pathname.includes("/admin")) {
    // Skip auth check for the admin login page
    if (pathname.endsWith("/admin")) {
      return NextResponse.next();
    }

    const authCookie = request.cookies.get("admin_session");

    if (!authCookie) {
      const locale = pathname.split("/")[1];
      return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next|api|favicon.ico).*)",
  ],
};
