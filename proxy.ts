import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  if (
    process.env.NODE_ENV === "production" &&
    !user &&
    !isLoginPage
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  
  if (
    process.env.NODE_ENV === "production" &&
    user
  ) {
    const { data: perfil } = await supabase
      .from("PERFILES_USUARIO")
      .select("Rol")
      .eq("UserID", user.id)
      .maybeSingle();
  
    const rol = (perfil as any)?.Rol;
  
    // Usuario de loterías: solo puede acceder a /loterias
    if (rol === "loterias") {
      const estaEnLoterias =
        request.nextUrl.pathname === "/loterias" ||
        request.nextUrl.pathname.startsWith("/loterias/");
  
      if (!estaEnLoterias && !isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/loterias";
        return NextResponse.redirect(url);
      }
    }
  
    // Si ya ha iniciado sesión y entra en /login,
    // lo enviamos a la página correspondiente a su rol.
    if (isLoginPage) {
      const url = request.nextUrl.clone();
  
      url.pathname =
        rol === "loterias"
          ? "/loterias"
          : "/";
  
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};