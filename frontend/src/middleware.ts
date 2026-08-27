import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const ROLE_PREFIXES: Record<string, string> = {
  "/admin": "ADMIN",
  "/distributor": "DISTRIBUTOR",
  "/customer": "CUSTOMER",
};

function stripLocale(pathname: string): { locale: string; path: string } {
  const match = pathname.match(/^\/(en|hi)(\/.*)?$/);
  if (!match) {
    return { locale: routing.defaultLocale, path: pathname };
  }
  return {
    locale: match[1],
    path: match[2] || "/",
  };
}

export default function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { locale, path } = stripLocale(request.nextUrl.pathname);
  const roleCookie = request.cookies.get("milk-auth-role")?.value;

  for (const [prefix, requiredRole] of Object.entries(ROLE_PREFIXES)) {
    if (path.startsWith(prefix)) {
      if (roleCookie && roleCookie !== requiredRole) {
        return NextResponse.redirect(
          new URL(`/${locale}/login`, request.url),
        );
      }
      break;
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
