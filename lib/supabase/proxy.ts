import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();

  const claims = data?.claims ?? null;

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  // غير مسجل ويحاول دخول لوحة الإدارة
  if (isAdminRoute && !isLoginPage && !claims) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/admin/login";

    return NextResponse.redirect(loginUrl);
  }

  // مسجل ويحاول فتح صفحة تسجيل الدخول
  if (isLoginPage && claims) {
    const adminUrl = request.nextUrl.clone();

    adminUrl.pathname = "/admin";

    return NextResponse.redirect(adminUrl);
  }

  return response;
}