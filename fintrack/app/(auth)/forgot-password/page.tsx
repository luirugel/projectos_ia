"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/actions/auth"

const panelClass = "rounded-2xl border border-app-border/70 bg-app-surface p-6 sm:p-8"
const panelShadow = { boxShadow: "var(--app-shadow-lg)" }
const labelClass = "text-xs font-medium text-app-text-muted"

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  if (success) {
    return (
      <div className={panelClass} style={panelShadow}>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <MailCheck className="h-12 w-12 text-income" />
          <div>
            <h2 className="text-xl font-bold text-app-text">Correo enviado</h2>
            <p className="mt-1.5 text-sm text-app-text-subtle">{success}</p>
          </div>
          <Link href="/login" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
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
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-1.5 text-sm text-app-text-subtle">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
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
          <Label htmlFor="email" className={labelClass}>Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            disabled={isPending}
            className="border-app-border bg-app-surface-alt text-app-text placeholder:text-app-text-subtle/60"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar enlace de recuperación
        </Button>
      </form>

      <p className="mt-7 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-app-text-subtle hover:text-app-text transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  )
}
