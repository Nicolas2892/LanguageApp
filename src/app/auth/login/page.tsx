'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { trackLogin } from '@/lib/analytics'

const schema = z.object({
  email: z.string().email('Introduce un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  // Handle ?error=auth_callback_failed from /auth/callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_callback_failed') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerError('El inicio de sesión falló. Inténtalo de nuevo o usa correo y contraseña.')
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      setServerError(error.message)
      return
    }
    trackLogin()
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — desktop only */}
      <AuthHeroPanel />

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-0 shadow-none" style={{ boxShadow: '0 10px 30px -10px rgba(26, 17, 8, 0.08)' }}>
          <CardHeader className="space-y-3 items-center text-center">
            <div className="lg:hidden flex flex-col items-center gap-2">
              <SvgSendaPath size={40} strokeWidth={3} />
              <span className="senda-heading text-xl" style={{ letterSpacing: '0.02em' }}>Senda</span>
            </div>
            <CardTitle className="senda-heading text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>Retoma donde lo dejaste.</CardDescription>
          </CardHeader>

          {/* Google OAuth */}
          <CardContent className="pb-0">
            <GoogleButton />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full h-px bg-[var(--d5-divider)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o</span>
              </div>
            </div>
          </CardContent>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-0">
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="senda-field-label">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="senda-input"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="senda-field-label">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  className="senda-input"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-y-5 pt-2">
              <Button type="submit" className="w-full rounded-full h-11 font-bold" disabled={isSubmitting}>
                {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                ¿Sin cuenta?{' '}
                <Link href="/auth/signup" className="underline text-primary hover:text-primary/80">
                  Regístrate
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
