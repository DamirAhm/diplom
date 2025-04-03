import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

let locales = ["en", "ru"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = locales[0];
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
        request.url
      )
    );
  }

  if (pathname.includes("/admin")) {
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
    "/((?!_next|api|favicon.ico).*)",
  ],
};
