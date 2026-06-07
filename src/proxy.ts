import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decrypt } from "@/lib/session-token";

// Optimistic auth gate (Next.js 16 renamed `middleware` to `proxy`, nodejs
// runtime). It only reads the session cookie to redirect unauthenticated users;
// the real authorization still happens in the DAL close to the data.

const PUBLIC_PATHS = ["/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public read-only share pages and the login page need no session.
  if (pathname.startsWith("/share") || PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
