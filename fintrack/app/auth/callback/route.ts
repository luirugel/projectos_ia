import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Open-redirect guard: only allow same-site absolute paths. Rejects
// protocol-relative ("//evil.com"), backslash tricks, and absolute URLs.
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/"
  if (raw.startsWith("//") || raw.startsWith("/\\") || raw.startsWith("/%2f")) return "/"
  return raw
}

// Don't reflect an unbounded attacker-influenced string into the UI.
function safeError(raw: string | null, fallback: string): string {
  const s = (raw ?? "").replace(/[\r\n]/g, " ").trim()
  return s ? s.slice(0, 200) : fallback
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("next"))

  // The OAuth provider (or Supabase) can bounce back here with an error
  // instead of a code — e.g. provider not enabled, consent denied.
  const providerError = searchParams.get("error_description") ?? searchParams.get("error")

  if (providerError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(safeError(providerError, "No se pudo iniciar sesión."))}`,
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(safeError(error.message, "No se pudo iniciar sesión."))}`,
    )
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "No se pudo completar el inicio de sesión. Intenta de nuevo.",
    )}`,
  )
}
