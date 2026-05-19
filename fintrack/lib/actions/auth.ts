"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { toUserMessage } from "@/lib/utils/errors"
import { siteUrl } from "@/lib/config"
import { checkRateLimit } from "@/lib/rateLimit"

// x-real-ip is set by Vercel/Nginx from the actual socket address and cannot
// be forged by the client. Fall back to the rightmost XFF entry (appended by
// the last trusted proxy) only when x-real-ip is absent.
async function clientIp(): Promise<string> {
  const h = await headers()
  const realIp = h.get('x-real-ip')
  if (realIp) return realIp.trim()
  const xff = h.get('x-forwarded-for')
  return xff?.split(',').at(-1)?.trim() ?? 'unknown'
}

export async function signIn(formData: FormData) {
  const ip = await clientIp()
  if (!await checkRateLimit(`signin:${ip}`, 10, 60_000)) {
    return { error: 'Demasiados intentos. Espera un momento.' }
  }

  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: toUserMessage(error) }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signUp(formData: FormData) {
  const ip = await clientIp()
  if (!await checkRateLimit(`signup:${ip}`, 5, 300_000)) {
    return { error: 'Demasiados intentos. Espera unos minutos.' }
  }

  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const full_name = ((formData.get("full_name") as string) ?? "").trim().slice(0, 100)

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: full_name || null },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  })

  if (error) {
    // Never confirm whether the email is already registered — return the
    // same success message so attackers cannot enumerate valid accounts.
    if (/user already registered/i.test(error.message)) {
      return { success: "Revisa tu correo para confirmar tu cuenta." }
    }
    return { error: toUserMessage(error) }
  }

  return { success: "Revisa tu correo para confirmar tu cuenta." }
}

export async function forgotPassword(formData: FormData) {
  const ip = await clientIp()
  if (!await checkRateLimit(`forgot:${ip}`, 3, 300_000)) {
    return { error: 'Demasiados intentos. Espera unos minutos.' }
  }

  const supabase = await createClient()

  const email = formData.get("email") as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/settings`,
  })

  if (error) {
    return { error: toUserMessage(error) }
  }

  return { success: "Revisa tu correo para restablecer tu contraseña." }
}

// Returns the OAuth URL so the client can do a full browser navigation.
// Using server-side redirect() here causes PKCE code-verifier cookies set
// by @supabase/ssr to be lost in some Next.js runtimes, breaking the
// code-exchange step in /auth/callback. Returning the URL and letting the
// client navigate via window.location.href is the reliable path.
export async function signInWithGoogle(): Promise<{ error?: string; url?: string }> {
  const ip = await clientIp()
  if (!await checkRateLimit(`oauth:${ip}`, 20, 60_000)) {
    return { error: 'Demasiados intentos. Espera un momento.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback`,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    return { error: toUserMessage(error) }
  }

  if (!data.url) {
    return { error: 'No se pudo iniciar sesión con Google. Intenta de nuevo.' }
  }

  // Validate the redirect URL using origin comparison (not startsWith, which
  // is bypassable by look-alike domains like accounts.google.com.evil.com).
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname
  const allowedOrigins = [
    'https://accounts.google.com',
    `https://${supabaseHost}`,
    `https://${new URL(siteUrl()).hostname}`,
  ]
  const parsedUrl = new URL(data.url)
  if (!allowedOrigins.includes(parsedUrl.origin)) {
    return { error: 'URL de autenticación inesperada.' }
  }

  return { url: data.url }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
  revalidatePath("/", "layout")
  redirect("/login")
}
