import { NextResponse } from "next/server";

export async function middleware(request) {
  const {
    nextUrl: { search },
  } = request;
  const urlSearchParams = new URLSearchParams(search);
  const params = Object.fromEntries(urlSearchParams.entries());

  const path0 = request.nextUrl.pathname;

  // Los settings solo se necesitan para UNA decisión (checkout de invitados),
  // así que solo se consultan en ese caso — y NUNCA pueden tumbar el sitio:
  // si la API está fría/reiniciando (p. ej. Render), fallamos abierto y la
  // página decide el resto. Un middleware que hace fetch sin try/catch en
  // cada request convierte cualquier parpadeo de la API en un 500 global
  // (MIDDLEWARE_INVOCATION_FAILED).
  let settingData = null;
  if (path0 === "/checkout" && !request.cookies.has("uat") && process.env.API_PROD_URL) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(process.env.API_PROD_URL + "/settings", { method: "GET", signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) settingData = await res.json();
    } catch (_) {
      // API no disponible — se permite continuar; el checkout maneja el resto.
    }
  }
  const protectedRoutes = [`/account/dashboard`, `/account/notification`, `/account/point`, `/account/refund`, `/account/order`, `/account/addresses`];

  const path = request.nextUrl.pathname;
  if (request.cookies.has("maintenance") && path !== `/maintenance`) {
    let myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${request.cookies.get("uat")?.value}`);
    let requestOptions = {
      method: "GET",
      headers: myHeaders,
    };

    let data = null;
    try {
      const response = await fetch(process.env.API_PROD_URL + "/settings", requestOptions);
      if (response.ok) data = await response.json();
    } catch (_) {
      // API no disponible — no se puede confirmar mantenimiento; continuar.
    }

    if (data?.values?.maintenance?.maintenance_mode && path !== `/maintenance`) {
      return NextResponse.redirect(new URL(`/maintenance`, request.url));
    } else {
      if (request.cookies.get("maintenance")) {
        return NextResponse.next();
      } else {
        const response = NextResponse.next();
        response.cookies.delete("maintenance");
        return NextResponse.redirect(new URL(`/`, request.url));
      }
    }
  }

  if (protectedRoutes.includes(path) && !request.cookies.has("uat")) {
    const redirectTo = request?.cookies?.get("currentPath")?.value || "/";
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set("showAuthToast", "true", { httpOnly: false });
    return response;
  }

  if (!request.cookies.has("maintenance") && path == `/maintenance`) {
    return NextResponse.redirect(new URL(`/`, request.url));
  }

  if (path == `/checkout` && !request.cookies.has("uat")) {
    // Sin settings (API caída) se falla ABIERTO: dejar entrar al checkout es
    // mejor que redirigir a login por un parpadeo del servidor.
    const guestAllowed = settingData ? Boolean(settingData?.values?.activation?.guest_checkout) : true;
    if (guestAllowed) {
      if (request.cookies.get("cartData") == "digital") {
        return NextResponse.redirect(new URL(`/auth/login`, request.url));
      }
    } else {
      return NextResponse.redirect(new URL(`/auth/login`, request.url));
    }
  }

  if (path == `/auth/login` && request.cookies.has("uat")) {
    return NextResponse.redirect(new URL(`/`, request.url));
  }

  if (path != `/auth/login`) {
    if (path == `/auth/otp-verification` && !request.cookies.has("ue")) {
      return NextResponse.redirect(new URL(`/auth/login`, request.url));
    }
    if (path == `/auth/update-password` && (!request.cookies.has("uo") || !request.cookies.has("ue"))) {
      return NextResponse.redirect(new URL(`/auth/login`, request.url));
    }
  }

  if (request.headers.get("x-redirected")) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
