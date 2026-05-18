import { describe, it, expect } from 'vitest'
import { toUserMessage } from '../errors'

describe('toUserMessage', () => {
  it('returns fallback for null/undefined', () => {
    expect(toUserMessage(null)).toBe('Ocurrió un error. Intenta de nuevo.')
    expect(toUserMessage(undefined)).toBe('Ocurrió un error. Intenta de nuevo.')
  })

  it('uses custom fallback', () => {
    expect(toUserMessage(null, 'Custom error')).toBe('Custom error')
  })

  it('maps postgres duplicate-key code 23505', () => {
    expect(toUserMessage({ code: '23505' })).toBe('Ya existe un registro con esos datos.')
  })

  it('maps postgres FK violation code 23503', () => {
    expect(toUserMessage({ code: '23503' })).toBe('No se puede completar: el registro está en uso.')
  })

  it('maps invalid login message', () => {
    expect(toUserMessage({ message: 'Invalid login credentials' }))
      .toBe('Correo o contraseña incorrectos.')
  })

  it('maps email not confirmed', () => {
    expect(toUserMessage({ message: 'email not confirmed' }))
      .toBe('Confirma tu correo antes de iniciar sesión.')
  })

  it('maps password too short', () => {
    expect(toUserMessage({ message: 'Password should be at least 6 chars' }))
      .toBe('La contraseña es demasiado corta.')
  })

  it('maps network errors', () => {
    expect(toUserMessage({ message: 'Failed to fetch' }))
      .toBe('Sin conexión. Revisa tu internet e intenta de nuevo.')
  })

  it('maps RLS violation', () => {
    expect(toUserMessage({ message: 'violates row-level security policy' }))
      .toBe('No tienes permiso para realizar esta acción.')
  })

  it('maps user already registered to generic duplicate message (not email-revealing)', () => {
    const msg = toUserMessage({ message: 'user already registered' })
    expect(msg).toBe('Ya existe un registro con esos datos.')
    expect(msg).not.toContain('correo')
  })

  it('falls back gracefully for unknown errors', () => {
    expect(toUserMessage({ message: 'some unexpected db error xyz' }))
      .toBe('Ocurrió un error. Intenta de nuevo.')
  })
})
