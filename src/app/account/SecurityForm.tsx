'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  async function handleEmailChange() {
    setEmailSaving(true)
    setEmailMessage(null)
    setEmailError(null)
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
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security</h2>

      {/* Change Email */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Change email</h3>
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
              <Input
                id="current_password"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password">New password</Label>
              <Input
                id="new_password"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm new password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
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
