"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { toUserMessage } from "@/lib/utils/errors"
import { checkRateLimit } from "@/lib/rateLimit"

async function clientIp(): Promise<string> {
  const h = await headers()
  const realIp = h.get('x-real-ip')
  if (realIp) return realIp.trim()
  const xff = h.get('x-forwarded-for')
  return xff?.split(',').at(-1)?.trim() ?? 'unknown'
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ error?: string; success?: boolean }> {
  const ip = await clientIp()
  if (!await checkRateLimit(`pwchange:${ip}`, 5, 300_000)) {
    return { error: 'Demasiados intentos. Espera unos minutos.' }
  }

  if (!currentPassword) return { error: 'Ingresa tu contraseña actual.' }
  if (newPassword.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'No se pudo verificar la sesión.' }

  // Verify current password before allowing the change
  const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
  if (reAuthError) return { error: 'La contraseña actual es incorrecta.' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: toUserMessage(error) }
  return { success: true }
}
