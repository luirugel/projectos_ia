'use client'

import { useState, useEffect } from 'react'
import { Loader2, User, Lock, LogOut, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/actions/auth'
import { toUserMessage } from '@/lib/utils/errors'
import type { Profile } from '@/types/database'

export default function ConfiguracionPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [currency, setCurrency] = useState('USD')

  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
        setCurrency(data.currency ?? 'USD')
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, currency })
      .eq('id', user.id)
    if (err) { setError(toUserMessage(err)) } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null); setPwSaved(false)
    if (pwNew !== pwConfirm) { setPwError('Las contraseñas no coinciden.'); return }
    if (pwNew.length < 6) { setPwError('La contraseña debe tener al menos 6 caracteres.'); return }
    setPwSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password: pwNew })
    if (err) { setPwError(toUserMessage(err)) } else {
      setPwSaved(true)
      setPwNew(''); setPwConfirm('')
      setTimeout(() => setPwSaved(false), 3000)
    }
    setPwSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-5 max-w-xl">
        <div>
          <Skeleton className="h-8 w-40 bg-app-surface-alt" />
          <Skeleton className="h-4 w-56 mt-2 bg-app-surface-alt" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl bg-app-surface-alt" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-app-text">Configuración</h1>
        <p className="text-sm text-app-text-subtle mt-0.5">Administra tu perfil y preferencias</p>
      </div>

      {/* Profile */}
      <section className="bg-app-surface border border-app-border/60 rounded-xl p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <User className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-app-text">Perfil</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Nombre completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Moneda</Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 rounded-md border border-app-border bg-app-surface-alt text-app-text px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="USD">USD — Dólar americano</option>
              <option value="EUR">EUR — Euro</option>
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="COP">COP — Peso colombiano</option>
              <option value="PEN">PEN — Sol peruano</option>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="CLP">CLP — Peso chileno</option>
            </select>
          </div>
          {error && (
            <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-md px-3 py-2">{error}</p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-income font-medium">
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="bg-app-surface border border-app-border/60 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <GlossyIcon icon={Lock} color="#8b5cf6" size="sm" />
          <h2 className="text-sm font-semibold text-app-text">Cambiar contraseña</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Nueva contraseña</Label>
            <Input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-app-text-muted">Confirmar contraseña</Label>
            <Input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle"
            />
          </div>
          {pwError && (
            <p className="text-xs text-expense bg-expense/10 border border-expense/20 rounded-md px-3 py-2">{pwError}</p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={pwSaving}>
              {pwSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar contraseña
            </Button>
            {pwSaved && (
              <span className="flex items-center gap-1.5 text-sm text-income font-medium">
                <CheckCircle2 className="h-4 w-4" /> Actualizada
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Session */}
      <section className="bg-app-surface border border-app-border/60 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <GlossyIcon icon={LogOut} color="#ef4444" size="sm" />
          <h2 className="text-sm font-semibold text-app-text">Sesión</h2>
        </div>
        <p className="text-sm text-app-text-subtle mb-4">
          Cierra sesión en todos los dispositivos.
        </p>
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="border-expense/40 text-expense hover:bg-expense/10 hover:border-expense"
          >
            Cerrar sesión
          </Button>
        </form>
      </section>
    </div>
  )
}
