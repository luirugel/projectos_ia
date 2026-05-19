import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest, extraRequestHeaders?: Record<string, string>) {
  const reqHeaders = new Headers(request.headers)
  if (extraRequestHeaders) {
    for (const [k, v] of Object.entries(extraRequestHeaders)) reqHeaders.set(k, v)
  }
  let supabaseResponse = NextResponse.next({ request: { headers: reqHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: reqHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do not remove this line
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const authPaths = ["/login", "/register", "/forgot-password", "/auth"]
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p))

  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
