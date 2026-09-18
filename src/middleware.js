import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/utils/security/safeRedirect";

const ACCESS_COOKIE = "uat";
const PROTECTED_ROUTES = new Set([
  "/account/dashboard",
  "/account/notification",
  "/account/point",
  "/account/refund",
  "/account/order",
  "/account/addresses",
]);

// Los settings solo se necesitan para dos decisiones (mantenimiento y
// checkout de invitados) y NUNCA pueden tumbar el sitio: si la API está
// fría/reiniciando (p. ej. Render), fallamos abierto y la página decide el
// resto. Un middleware que hace fetch sin try/catch en cada request convierte
// cualquier parpadeo de la API en un 500 global (MIDDLEWARE_INVOCATION_FAILED).
const fetchPublicSettings = async () => {
  if (!process.env.API_PROD_URL) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${process.env.API_PROD_URL}/settings`, { method: "GET", signal: controller.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const redirect = (request, path) => NextResponse.redirect(new URL(path, request.url));

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.has(ACCESS_COOKIE);

  // ── Maintenance mode ─────────────────────────────────────────────────
  if (request.cookies.has("maintenance") && path !== "/maintenance") {
    const settings = await fetchPublicSettings();
    if (settings?.values?.maintenance?.maintenance_mode) return redirect(request, "/maintenance");
    // Stale flag (mode switched off, or API unreachable): drop it and go on.
    const response = NextResponse.next();
    response.cookies.delete("maintenance");
    return response;
  }
  if (!request.cookies.has("maintenance") && path === "/maintenance") return redirect(request, "/");

  // ── Account area needs a session cookie (the API re-checks every call) ──
  if (PROTECTED_ROUTES.has(path) && !hasSession) {
    // `currentPath` is a client-written cookie: only same-origin paths are
    // honoured (open-redirect hardening) and never a protected route (loop).
    const wanted = safeRedirectPath(request.cookies.get("currentPath")?.value, "/");
    const target = PROTECTED_ROUTES.has(wanted.split("?")[0]) ? "/" : wanted;
    const response = redirect(request, target);
    response.cookies.set("showAuthToast", "true", {
      httpOnly: false,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60,
    });
    return response;
  }

  // ── Guest checkout ───────────────────────────────────────────────────
  if (path === "/checkout" && !hasSession) {
    const settings = await fetchPublicSettings();
    // Sin settings (API caída) se falla ABIERTO: dejar entrar al checkout es
    // mejor que redirigir a login por un parpadeo del servidor.
    const guestAllowed = settings ? Boolean(settings?.values?.activation?.guest_checkout) : true;
    if (!guestAllowed) return redirect(request, "/auth/login");
    // Carritos solo digitales exigen cuenta (antes la comparación era contra
    // el objeto cookie, no su valor, y esta regla nunca se aplicaba).
    if (request.cookies.get("cartData")?.value === "digital") return redirect(request, "/auth/login");
  }

  // ── Auth pages ───────────────────────────────────────────────────────
  if (path === "/auth/login" && hasSession) return redirect(request, "/");
  if (path === "/auth/otp-verification" && !request.cookies.has("ue")) return redirect(request, "/auth/login");
  if (path === "/auth/update-password" && (!request.cookies.has("uo") || !request.cookies.has("ue"))) {
    return redirect(request, "/auth/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
