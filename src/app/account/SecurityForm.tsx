'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
  isOAuthUser: boolean
}

export function SecurityForm({ userEmail, isOAuthUser }: Props) {
  const supabase = createClient()

  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMessage, setPwdMessage] = useState<string | null>(null)
  const [pwdError, setPwdError] = useState<string | null>(null)

  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  async function handleEmailChange() {
    setEmailMessage(null)
    setEmailError(null)

    const emailRegex = /\S+@\S+\.\S+/
    if (!emailRegex.test(newEmail)) {
      setEmailError('Introduce un correo válido.')
      return
    }

    setEmailSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      setEmailMessage('Correo de confirmación enviado — revisa tu bandeja.')
      setNewEmail('')
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Algo salió mal.')
    } finally {
      setEmailSaving(false)
    }
  }

  async function handlePasswordChange() {
    setPwdMessage(null)
    setPwdError(null)

    if (newPwd.length < 6) {
      setPwdError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Las contraseñas no coinciden.')
      return
    }

    setPwdSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPwd,
      })
      if (signInError) throw new Error('La contraseña actual es incorrecta.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPwd })
      if (updateError) throw updateError

      setPwdMessage('Contraseña actualizada.')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Algo salió mal.')
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      <span className="senda-eyebrow block mb-3">Seguridad</span>

      {/* ── Change Email ── */}
      <div className="flex flex-col gap-3 pb-4">
        <span className="senda-sub-header">Cambiar correo</span>
        <p className="text-xs -mt-2" style={{ color: 'var(--d5-muted)' }}>Actual: {userEmail}</p>

        <div className="flex flex-col gap-1">
          <label htmlFor="new_email" className="senda-field-label">Nuevo correo</label>
          <input
            id="new_email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="tu@ejemplo.com"
            className="senda-input"
          />
        </div>

        {emailError && (
          <p style={{ fontSize: '0.75rem', color: 'var(--d5-error)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--d5-error-surface)' }}>{emailError}</p>
        )}
        {emailMessage && (
          <p style={{ fontSize: '0.75rem', color: 'var(--d5-terracotta)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(196,82,46,0.06)' }}>{emailMessage}</p>
        )}

        <Button
          onClick={handleEmailChange}
          disabled={emailSaving || !newEmail}
          className="w-full rounded-full active:scale-95 transition-transform"
        >
          {emailSaving ? 'Enviando…' : 'Actualizar correo'}
        </Button>
      </div>

      {/* ── Change Password ── */}
      <div className="flex flex-col gap-3 pt-2">
        <span className="senda-sub-header">Cambiar contraseña</span>

        {isOAuthUser ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--d5-muted)' }}>
            Los cambios de contraseña no están disponibles para cuentas de Google.
          </p>
        ) : (
          <>
            {/* Current password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="current_password" className="senda-field-label">Contraseña actual</label>
              <div className="relative">
                <input
                  id="current_password"
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="senda-input pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="senda-focus-ring absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0"
                  aria-label={showCurrentPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showCurrentPwd
                    ? <EyeOff size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
                    : <Eye size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="new_password" className="senda-field-label">Nueva contraseña</label>
              <div className="relative">
                <input
                  id="new_password"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="senda-input pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="senda-focus-ring absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0"
                  aria-label={showNewPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNewPwd
                    ? <EyeOff size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
                    : <Eye size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />}
                </button>
              </div>
              {newPwd.length > 0 && (
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: newPwd.length < 6 ? 'var(--destructive)' : newPwd.length < 12 ? 'var(--d5-warning)' : 'var(--d5-terracotta)',
                  marginTop: '0.125rem',
                }}>
                  {newPwd.length < 6 ? 'Muy corta' : newPwd.length < 12 ? 'Aceptable' : 'Segura'}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="confirm_password" className="senda-field-label">Confirmar contraseña</label>
              <div className="relative">
                <input
                  id="confirm_password"
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="senda-input pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="senda-focus-ring absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0"
                  aria-label={showConfirmPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPwd
                    ? <EyeOff size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
                    : <Eye size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />}
                </button>
              </div>
            </div>

            {pwdError && (
              <p style={{ fontSize: '0.75rem', color: 'var(--d5-error)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--d5-error-surface)' }}>{pwdError}</p>
            )}
            {pwdMessage && (
              <p style={{ fontSize: '0.75rem', color: 'var(--d5-terracotta)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(196,82,46,0.06)' }}>{pwdMessage}</p>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={pwdSaving}
              className="w-full rounded-full active:scale-95 transition-transform"
            >
              {pwdSaving ? 'Actualizando…' : 'Actualizar contraseña'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
