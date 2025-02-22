import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of supported languages
export const locales = ["en", "ru"]
export const defaultLocale = "en"

// Get the preferred locale from request
function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get("accept-language")
  return acceptLanguage?.split(",")[0].split("-")[0] || defaultLocale
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  // Get the theme from the cookie
  const theme = request.cookies.get("theme")?.value || "light"

  // Clone the response
  const response = NextResponse.next()

  // Set the theme class on the html element
  response.headers.set("Set-Cookie", `theme=${theme}; Path=/; Max-Age=31536000`)
  response.headers.set('x-pathname', request.nextUrl.pathname)

  if (pathnameHasLocale) return response

  // Redirect if there is no locale
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next|api|favicon.ico).*)",
  ],
}

