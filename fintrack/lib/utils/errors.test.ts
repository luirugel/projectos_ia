import { describe, it, expect } from 'vitest'
import { toUserMessage } from './errors'

describe('toUserMessage', () => {
  it('maps known Postgres codes', () => {
    expect(toUserMessage({ code: '23505' })).toMatch(/Ya existe/)
    expect(toUserMessage({ code: '42501' })).toMatch(/permiso/)
  })

  it('maps known message patterns', () => {
    expect(toUserMessage({ message: 'Invalid login credentials' })).toMatch(/incorrectos/)
    expect(toUserMessage({ message: 'JWT expired' })).toMatch(/sesión expiró/)
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(toUserMessage({ message: 'some internal db detail' })).toBe(
      'Ocurrió un error. Intenta de nuevo.',
    )
    expect(toUserMessage(null)).toBe('Ocurrió un error. Intenta de nuevo.')
  })

  it('honors a custom fallback', () => {
    expect(toUserMessage(undefined, 'No se pudo guardar')).toBe('No se pudo guardar')
  })
})
