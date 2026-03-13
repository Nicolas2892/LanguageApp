'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { StreakBadge } from '@/components/StreakBadge'

const HIDDEN_ROUTES = ['/auth', '/study', '/tutor', '/onboarding', '/brand-preview']
const TUTOR_ICON_ROUTES = ['/dashboard', '/curriculum', '/verbs']

interface Props {
  userInitials: string
  streak: number
  streakFreezeRemaining?: number
}

export function AppHeader({ userInitials, streak, streakFreezeRemaining = 0 }: Props) {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <header className="sticky top-0 z-50 bg-background lg:hidden">
      <div className="h-14 flex items-center justify-between px-5">
        {/* Logo */}
        <Link href="/dashboard" aria-label="Senda home">
          <SvgSendaPath size={26} strokeWidth={3.5} />
        </Link>

        {/* Right side: tutor + streak + avatar */}
        <div className="flex items-center gap-3">
          {TUTOR_ICON_ROUTES.some((r) => pathname === r || (r !== '/dashboard' && pathname.startsWith(r))) && (
            <Link
              href="/tutor"
              aria-label="Tutor"
              className="rounded-full p-1.5 hover:bg-muted transition-colors min-w-[44px]
                         min-h-[44px] flex items-center justify-center text-[var(--d5-nav-inactive)]"
            >
              <Bot className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          )}
          <StreakBadge streak={streak} size="sm" freezeAvailable={streakFreezeRemaining > 0} />
          <Link
            href="/account"
            aria-label="Account"
            className="rounded-full p-1.5 hover:bg-muted transition-colors min-w-[44px]
                       min-h-[44px] flex items-center justify-center"
          >
            <UserAvatar initials={userInitials} size="md" />
          </Link>
        </div>
      </div>
    </header>
  )
}
