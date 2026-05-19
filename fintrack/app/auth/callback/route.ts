import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Open-redirect guard: resolves the path against a dummy origin and rejects
// anything that lands on a different origin (handles //, /\, %2f, %2F, etc.)
function safeNext(raw: string | null): string {
  if (!raw) return "/"
  try {
    const resolved = new URL(raw, "https://example.com")
    if (resolved.origin !== "https://example.com") return "/"
    return resolved.pathname + resolved.search
  } catch {
    return "/"
  }
}

// Whitelist of known OAuth error codes → user-facing Spanish messages.
// Never reflect the raw error_description (attacker-controlled) into the UI.
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Inicio de sesión cancelado.',
  provider_not_enabled: 'Este método de inicio de sesión no está disponible.',
  server_error: 'Error del servidor. Intenta de nuevo.',
  temporarily_unavailable: 'Servicio temporalmente no disponible.',
}

function safeOAuthError(code: string | null): string {
  return OAUTH_ERROR_MESSAGES[code ?? ''] ?? 'No se pudo iniciar sesión.'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("next"))

  // The OAuth provider can bounce back here with an error instead of a code.
  const errorCode = searchParams.get("error")
  if (errorCode) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(safeOAuthError(errorCode))}`,
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No se pudo iniciar sesión.")}`,
    )
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "No se pudo completar el inicio de sesión. Intenta de nuevo.",
    )}`,
  )
}
