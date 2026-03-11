'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
  isOAuthUser: boolean
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--d5-muted)',
  display: 'block',
  marginBottom: 14,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: 'rgba(26,17,8,0.5)',
}

const subHeaderStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(26,17,8,0.6)',
}

const bareInputStyle: React.CSSProperties = {
  background: 'rgba(26,17,8,0.04)',
  border: '1px solid rgba(26,17,8,0.08)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--d5-ink)',
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
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
      setEmailError('Please enter a valid email address.')
      return
    }

    setEmailSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      setEmailMessage('Confirmation email sent — check your inbox.')
      setNewEmail('')
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setEmailSaving(false)
    }
  }

  async function handlePasswordChange() {
    setPwdMessage(null)
    setPwdError(null)

    if (newPwd.length < 6) {
      setPwdError('New password must be at least 6 characters.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Passwords do not match.')
      return
    }

    setPwdSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPwd,
      })
      if (signInError) throw new Error('Current password is incorrect.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPwd })
      if (updateError) throw updateError

      setPwdMessage('Password updated.')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <span style={eyebrowStyle}>Seguridad</span>

      {/* ── Change Email ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 16 }}>
        <span style={subHeaderStyle}>Cambiar correo</span>
        <p style={{ fontSize: 11, color: 'var(--d5-muted)', marginTop: -8 }}>Actual: {userEmail}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="new_email" style={fieldLabelStyle}>Nuevo correo</label>
          <input
            id="new_email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="tu@ejemplo.com"
            style={bareInputStyle}
          />
        </div>

        {emailError && (
          <p style={{ fontSize: 12, color: '#dc2626', padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.06)' }}>{emailError}</p>
        )}
        {emailMessage && (
          <p style={{ fontSize: 12, color: 'var(--d5-terracotta)', padding: '8px 12px', borderRadius: 8, background: 'rgba(196,82,46,0.06)' }}>{emailMessage}</p>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
        <span style={subHeaderStyle}>Cambiar contraseña</span>

        {isOAuthUser ? (
          <p style={{ fontSize: 12, color: 'var(--d5-muted)' }}>
            Los cambios de contraseña no están disponibles para cuentas de Google.
          </p>
        ) : (
          <>
            {/* Current password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="current_password" style={fieldLabelStyle}>Contraseña actual</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="current_password"
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  style={{ ...bareInputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  aria-label={showCurrentPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showCurrentPwd
                    ? <EyeOff size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
                    : <Eye size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="new_password" style={fieldLabelStyle}>Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new_password"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  style={{ ...bareInputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  aria-label={showNewPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNewPwd
                    ? <EyeOff size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
                    : <Eye size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />}
                </button>
              </div>
              {newPwd.length > 0 && (
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: newPwd.length < 6 ? '#ef4444' : newPwd.length < 12 ? '#f59e0b' : '#16a34a',
                  marginTop: 2,
                }}>
                  {newPwd.length < 6 ? 'Muy corta' : newPwd.length < 12 ? 'Aceptable' : 'Segura'}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="confirm_password" style={fieldLabelStyle}>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm_password"
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  style={{ ...bareInputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  aria-label={showConfirmPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPwd
                    ? <EyeOff size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />
                    : <Eye size={14} strokeWidth={1.5} style={{ color: 'var(--d5-muted)' }} />}
                </button>
              </div>
            </div>

            {pwdError && (
              <p style={{ fontSize: 12, color: '#dc2626', padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.06)' }}>{pwdError}</p>
            )}
            {pwdMessage && (
              <p style={{ fontSize: 12, color: 'var(--d5-terracotta)', padding: '8px 12px', borderRadius: 8, background: 'rgba(196,82,46,0.06)' }}>{pwdMessage}</p>
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
