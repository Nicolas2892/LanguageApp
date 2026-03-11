'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/UserAvatar'
import { SvgSendaPath } from '@/components/SvgSendaPath'

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Home'       },
  { href: '/study/configure', label: 'Study'      },
  { href: '/curriculum',      label: 'Curriculum' },
  { href: '/verbs',           label: 'Verbs'       },
  { href: '/progress',        label: 'Progress'   },
  { href: '/tutor',           label: 'Tutor'      },
]

const HIDDEN_ROUTES = ['/auth', '/onboarding', '/brand-preview', '/admin']

// D5 inline S-path — terracotta, no background rect

interface Props {
  userInitials: string
}

export function SideNav({ userInitials }: Props) {
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
        className="flex items-center gap-2.5 px-5 h-14 shrink-0 border-b"
        style={{ borderColor: 'var(--d5-nav-border)' }}
      >
        <SvgSendaPath size={20} />
        <span
          style={{
            fontFamily: 'var(--font-lora), serif',
            fontStyle: 'italic',
            fontSize: 20,
            lineHeight: 1,
            color: 'var(--d5-ink)',
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
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
                  width: 3,
                  height: 16,
                  borderRadius: 2,
                  background: active ? 'var(--d5-terracotta)' : 'transparent',
                }}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Account at bottom */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--d5-nav-border)' }}>
        <Link
          href="/account"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          style={{
            background: pathname.startsWith('/account') ? 'var(--d5-nav-active-bg)' : 'transparent',
            color: pathname.startsWith('/account') ? 'var(--d5-terracotta)' : 'var(--d5-nav-inactive)',
            fontWeight: pathname.startsWith('/account') ? 600 : 500,
          }}
        >
          <span
            className="shrink-0"
            style={{
              width: 3,
              height: 16,
              borderRadius: 2,
              background: pathname.startsWith('/account') ? 'var(--d5-terracotta)' : 'transparent',
            }}
          />
          <UserAvatar initials={userInitials} size="sm" />
          Account
        </Link>
      </div>
    </aside>
  )
}
