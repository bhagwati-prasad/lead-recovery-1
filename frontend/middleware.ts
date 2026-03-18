import { NextRequest, NextResponse } from "next/server";

// Routes that require a specific role subset, mirroring bootstrap.js route definitions.
const ROLE_RESTRICTED: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/funnels\/[^/]+\/editor(\/.*)?$/, roles: ["admin"] },
  { pattern: /^\/calls\/make(\/.*)?$/, roles: ["admin", "sales_manager"] },
  { pattern: /^\/agents(\/.*)?$/, roles: ["admin"] },
  { pattern: /^\/settings(\/.*)?$/, roles: ["admin"] },
];

const PUBLIC_PREFIXES = ["/login", "/api/", "/_next/", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("lr.token")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = request.cookies.get("lr.role")?.value ?? "";
  for (const rule of ROLE_RESTRICTED) {
    if (rule.pattern.test(pathname) && !rule.roles.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.delete("redirect");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|public/).*)"],
};
