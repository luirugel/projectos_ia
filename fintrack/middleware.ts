import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const isProd = process.env.NODE_ENV === "production"

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // Nonce for Next.js hydration + app scripts; strict-dynamic propagates to
    // dynamically-loaded scripts so chunk splitting continues to work.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Tailwind injects inline styles; nonce for styles is not yet supported
    // in all browsers so unsafe-inline is retained here only.
    "style-src 'self' 'unsafe-inline'",
    // Google OAuth avatars land on lh3.googleusercontent.com
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ")
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const csp = buildCsp(nonce)

  // Pass nonce via request header so Server Components can read it via headers()
  const response = await updateSession(request, {
    "x-nonce": nonce,
    "Content-Security-Policy": csp,
  })

  // Set CSP on the response so the browser enforces it
  response.headers.set("Content-Security-Policy", csp)
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
