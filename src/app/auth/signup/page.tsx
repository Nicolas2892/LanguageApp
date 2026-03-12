'use client'

import { useState } from 'react'
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
import { LogoMark } from '@/components/LogoMark'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'

const schema = z.object({
  display_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Introduce un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { display_name: values.display_name },
      },
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader>
            <CardTitle className="senda-heading text-2xl">Un paso más</CardTitle>
            <CardDescription>
              Te hemos enviado un enlace. Haz clic y estás dentro — tarda menos de un minuto.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full rounded-full" variant="outline">
              <Link href="/auth/login">Volver a iniciar sesión</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 bg-[var(--d5-ink)] text-[var(--d5-paper)] flex-col items-center justify-center p-12 relative overflow-hidden">
        <BackgroundMagicS opacity={0.06} style={{ right: -40, top: -30, width: 280, height: 364 }} />
        <div className="relative z-10 space-y-4 text-center">
          <LogoMark size={56} />
          <h1 className="senda-heading text-3xl text-[var(--d5-paper)]">Español Avanzado</h1>
          <p className="text-base opacity-70 max-w-xs leading-relaxed">
            Español avanzado. Hermosamente estructurado.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="space-y-3 items-center text-center">
            <div className="md:hidden">
              <LogoMark size={48} />
            </div>
            <CardTitle className="senda-heading text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>El B2 no sucede por accidente.</CardDescription>
          </CardHeader>

          {/* Google OAuth */}
          <CardContent className="pb-0">
            <GoogleButton />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
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
                <Label htmlFor="display_name">Nombre</Label>
                <Input
                  id="display_name"
                  placeholder="Maria"
                  className="senda-input"
                  {...register('display_name')}
                />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
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
                <Label htmlFor="password">Contraseña</Label>
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
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  className="senda-input"
                  {...register('confirm_password')}
                />
                {errors.confirm_password && (
                  <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="underline text-primary hover:text-primary/80">
                  Inicia sesión
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
