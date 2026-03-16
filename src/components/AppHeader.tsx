'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, FileText } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { StreakBadge } from '@/components/StreakBadge'

const HIDDEN_ROUTES = ['/auth', '/study', '/tutor', '/onboarding', '/brand-preview']
const TUTOR_ICON_ROUTES = ['/dashboard', '/curriculum', '/verbs']

interface Props {
  userInitials: string
  streak: number
  streakFreezeRemaining?: number
  unreadReportCount?: number
}

export function AppHeader({ userInitials, streak, streakFreezeRemaining = 0, unreadReportCount = 0 }: Props) {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <header className="sticky top-0 z-50 bg-background lg:hidden">
      <div className="h-14 flex items-center justify-between px-5">
        {/* Logo */}
        <Link href="/dashboard" aria-label="Senda home" className="tap-highlight">
          <SvgSendaPath size={26} strokeWidth={3.5} />
        </Link>

        {/* Right side: tutor + streak + avatar */}
        <div className="flex items-center gap-3">
          {TUTOR_ICON_ROUTES.some((r) => pathname === r || (r !== '/dashboard' && pathname.startsWith(r))) && (
            <Link
              href="/tutor"
              aria-label="Tutor"
              className="tap-highlight rounded-full p-1.5 hover:bg-muted transition-colors min-w-[44px]
                         min-h-[44px] flex items-center justify-center text-[var(--d5-nav-inactive)]"
            >
              <Bot className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          )}
          {unreadReportCount > 0 && (
            <Link
              href="/offline/reports"
              aria-label="Informes offline"
              className="tap-highlight relative rounded-full p-1.5 hover:bg-muted transition-colors min-w-[44px]
                         min-h-[44px] flex items-center justify-center"
            >
              <FileText className="h-5 w-5" strokeWidth={1.5} style={{ color: 'var(--d5-terracotta)' }} />
              <span
                className="absolute top-1.5 right-1.5 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: 'var(--d5-terracotta)',
                }}
              />
            </Link>
          )}
          <StreakBadge streak={streak} size="sm" freezeAvailable={streakFreezeRemaining > 0} />
          <Link
            href="/account"
            aria-label="Account"
            className="tap-highlight rounded-full p-1.5 hover:bg-muted transition-colors min-w-[44px]
                       min-h-[44px] flex items-center justify-center"
          >
            <UserAvatar initials={userInitials} size="md" />
          </Link>
        </div>
      </div>
    </header>
  )
}
