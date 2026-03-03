'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
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
    <div className="space-y-6">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <ShieldCheck className="h-3.5 w-3.5" />
        Security
      </h2>

      {/* Change Email */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Change email</h3>
        <p className="text-xs text-muted-foreground -mt-2">Current: {userEmail}</p>
        <div className="space-y-1.5">
          <Label htmlFor="new_email">New email address</Label>
          <Input
            id="new_email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        {emailError && (
          <p className="text-sm text-red-600 border border-red-200 rounded-lg p-3">{emailError}</p>
        )}
        {emailMessage && (
          <p className="text-sm text-green-700 border border-green-200 rounded-lg p-3">{emailMessage}</p>
        )}
        <Button
          onClick={handleEmailChange}
          disabled={emailSaving || !newEmail}
          className="w-full rounded-full active:scale-95 transition-transform"
        >
          {emailSaving ? 'Sending…' : 'Update email'}
        </Button>
      </div>

      <hr className="border-border" />

      {/* Change Password */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Change password</h3>
        {isOAuthUser ? (
          <p className="text-sm text-muted-foreground">
            Password changes are not available for Google sign-in accounts.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="current_password">Current password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showCurrentPwd ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password">New password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                >
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPwd.length > 0 && (
                <p className={`text-xs font-medium ${
                  newPwd.length < 6 ? 'text-red-500' :
                  newPwd.length < 12 ? 'text-amber-500' :
                  'text-green-600'
                }`}>
                  {newPwd.length < 6 ? 'Too short' : newPwd.length < 12 ? 'OK' : 'Strong'}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {pwdError && (
              <p className="text-sm text-red-600 border border-red-200 rounded-lg p-3">{pwdError}</p>
            )}
            {pwdMessage && (
              <p className="text-sm text-green-700 border border-green-200 rounded-lg p-3">{pwdMessage}</p>
            )}
            <Button
              onClick={handlePasswordChange}
              disabled={pwdSaving}
              className="w-full rounded-full active:scale-95 transition-transform"
            >
              {pwdSaving ? 'Updating…' : 'Update password'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
