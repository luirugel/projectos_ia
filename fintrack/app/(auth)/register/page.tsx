"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp, signInWithGoogle } from "@/lib/actions/auth"

const panelClass = "rounded-2xl border border-app-border/70 bg-app-surface p-6 sm:p-8"
const panelShadow = { boxShadow: "var(--app-shadow-lg)" }
const labelClass = "text-xs font-medium text-app-text-muted"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, startGoogleTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)

    const password = formData.get("password") as string
    const confirm = formData.get("confirm_password") as string
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  function handleGoogle() {
    startGoogleTransition(async () => {
      const result = await signInWithGoogle()
      if (result?.error) setError(result.error)
    })
  }

  const busy = isPending || isGooglePending

  if (success) {
    return (
      <div className={panelClass} style={panelShadow}>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-income" />
          <div>
            <h2 className="text-xl font-bold text-app-text">Revisa tu correo</h2>
            <p className="mt-1.5 text-sm text-app-text-subtle">{success}</p>
          </div>
          <Link href="/login" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={panelClass} style={panelShadow}>
      <header className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-app-text">
          Crea tu cuenta
        </h1>
        <p className="mt-1.5 text-sm text-app-text-subtle">
          Empieza a construir tu hábito financiero.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-expense/25 bg-expense/10 px-3 py-2.5 text-sm text-expense"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name" className={labelClass}>Nombre completo</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Juan Pérez"
            required
            autoComplete="name"
            disabled={busy}
            className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className={labelClass}>Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            disabled={busy}
            className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className={labelClass}>Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mín. 8 caracteres"
              required
              autoComplete="new-password"
              disabled={busy}
              className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 inline-flex h-full w-11 items-center justify-center rounded-r-md text-app-text-subtle hover:text-app-text transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password" className={labelClass}>Confirmar contraseña</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showPassword ? "text" : "password"}
            placeholder="Repite tu contraseña"
            required
            autoComplete="new-password"
            disabled={busy}
            className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={busy}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta
        </Button>
      </form>

      <div className="relative my-6">
        <span className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-app-border/70" />
        </span>
        <span className="relative mx-auto flex w-fit bg-app-surface px-3 text-xs text-app-text-subtle">
          o
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-app-border bg-transparent hover:bg-app-surface-alt text-app-text-muted"
        onClick={handleGoogle}
        disabled={busy}
      >
        {isGooglePending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Registrarse con Google
      </Button>

      <p className="mt-7 text-center text-sm text-app-text-subtle">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
