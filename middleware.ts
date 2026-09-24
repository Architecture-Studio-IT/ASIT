import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Garde d'accès : les espaces de travail exigent une session valide.
 * Les pages publiques (connexion, inscription, CGU, robots) restent ouvertes.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/designer", "/marketplace", "/profile", "/api/account"];
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !userId) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Déjà connecté : les pages d'authentification renvoient vers l'espace de travail.
  if (AUTH_PAGES.includes(pathname) && userId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
