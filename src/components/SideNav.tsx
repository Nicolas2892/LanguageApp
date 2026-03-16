'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText } from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { SvgSendaPath } from '@/components/SvgSendaPath'
import { StreakBadge } from '@/components/StreakBadge'

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Inicio'     },
  { href: '/study/configure', label: 'Estudio'    },
  { href: '/curriculum',      label: 'Currículo'  },
  { href: '/verbs',           label: 'Verbos'     },
  { href: '/progress',        label: 'Progreso'   },
  { href: '/tutor',           label: 'Tutor'      },
]

const HIDDEN_ROUTES = ['/auth', '/onboarding', '/brand-preview', '/admin']

// D5 inline S-path — terracotta, no background rect

interface Props {
  userInitials: string
  streak: number
  streakFreezeRemaining?: number
  unreadReportCount?: number
}

export function SideNav({ userInitials, streak, streakFreezeRemaining = 0, unreadReportCount = 0 }: Props) {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <aside
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-[220px] border-r bg-background"
      style={{ borderColor: 'var(--d5-nav-border)' }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="tap-highlight flex items-center gap-2.5 px-5 h-14 shrink-0 border-b"
        style={{ borderColor: 'var(--d5-nav-border)' }}
      >
        <SvgSendaPath size={20} />
        <span
          style={{
            fontFamily: 'var(--font-lora), serif',
            fontStyle: 'italic',
            fontSize: '1.25rem',
            lineHeight: 1,
            color: 'var(--d5-heading)',
          }}
        >
          Senda
        </span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label }) => {
          const active =
            pathname === href ||
            (href === '/study/configure' && pathname.startsWith('/study')) ||
            (href !== '/dashboard' && href !== '/study/configure' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="tap-highlight flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: active ? 'var(--d5-nav-active-bg)' : 'transparent',
                color: active ? 'var(--d5-terracotta)' : 'var(--d5-nav-inactive)',
                fontWeight: active ? 600 : 500,
              }}
            >
              {/* Left accent bar */}
              <span
                className="shrink-0"
                style={{
                  width: '0.1875rem',
                  height: '1rem',
                  borderRadius: '0.125rem',
                  background: active ? 'var(--d5-terracotta)' : 'transparent',
                }}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Streak + Account at bottom */}
      <div className="p-3 border-t shrink-0 space-y-2" style={{ borderColor: 'var(--d5-nav-border)' }}>
        {unreadReportCount > 0 && (
          <Link
            href="/offline/reports"
            className="tap-highlight flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
            style={{ color: 'var(--d5-terracotta)' }}
          >
            <span className="relative">
              <FileText className="h-4 w-4" strokeWidth={1.5} />
              <span
                className="absolute -top-0.5 -right-0.5 rounded-full"
                style={{ width: 6, height: 6, background: 'var(--d5-terracotta)' }}
              />
            </span>
            {unreadReportCount} {unreadReportCount === 1 ? 'informe' : 'informes'}
          </Link>
        )}
        <div className="px-3">
          <StreakBadge streak={streak} size="md" freezeAvailable={streakFreezeRemaining > 0} />
        </div>
        <Link
          href="/account"
          className="tap-highlight flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          style={{
            background: pathname.startsWith('/account') ? 'var(--d5-nav-active-bg)' : 'transparent',
            color: pathname.startsWith('/account') ? 'var(--d5-terracotta)' : 'var(--d5-nav-inactive)',
            fontWeight: pathname.startsWith('/account') ? 600 : 500,
          }}
        >
          <span
            className="shrink-0"
            style={{
              width: '0.1875rem',
              height: '1rem',
              borderRadius: '0.125rem',
              background: pathname.startsWith('/account') ? 'var(--d5-terracotta)' : 'transparent',
            }}
          />
          <UserAvatar initials={userInitials} size="sm" />
          Cuenta
        </Link>
      </div>
    </aside>
  )
}
