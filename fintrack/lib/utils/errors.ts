// Translates raw Supabase / PostgREST errors into safe Spanish messages.
// Raw `error.message` strings are English, leak DB/internal wording, and
// shouldn't reach end users — map the known ones, fall back to a generic.

interface SupabaseLikeError {
  message?: string
  code?: string
  details?: string
}

const CODE_MESSAGES: Record<string, string> = {
  '23505': 'Ya existe un registro con esos datos.',
  '23503': 'No se puede completar: el registro está en uso.',
  '23514': 'Algún valor no cumple las reglas permitidas.',
  '23502': 'Faltan datos obligatorios.',
  '22P02': 'Uno de los valores tiene un formato inválido.',
  '42501': 'No tienes permiso para realizar esta acción.',
  PGRST301: 'Tu sesión expiró. Inicia sesión de nuevo.',
}

const MESSAGE_PATTERNS: Array<[RegExp, string]> = [
  [/duplicate key|already (registered|exists)/i, 'Ya existe un registro con esos datos.'],
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Confirma tu correo antes de iniciar sesión.'],
  [/user already registered/i, 'Ya existe una cuenta con ese correo.'],
  [/password should be at least/i, 'La contraseña es demasiado corta.'],
  [/jwt expired|invalid token|not authenticated/i, 'Tu sesión expiró. Inicia sesión de nuevo.'],
  [/row-level security|violates row-level/i, 'No tienes permiso para realizar esta acción.'],
  [/network|fetch failed|failed to fetch/i, 'Sin conexión. Revisa tu internet e intenta de nuevo.'],
]

export function toUserMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intenta de nuevo.',
): string {
  if (!error) return fallback
  const e = error as SupabaseLikeError
  if (e.code && CODE_MESSAGES[e.code]) return CODE_MESSAGES[e.code]
  const msg = typeof e.message === 'string' ? e.message : ''
  for (const [pattern, friendly] of MESSAGE_PATTERNS) {
    if (pattern.test(msg)) return friendly
  }
  return fallback
}
