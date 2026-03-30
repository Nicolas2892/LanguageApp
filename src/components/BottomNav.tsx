'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Pencil, Route, Book, BarChart2 } from 'lucide-react'
import { ROUTES } from '@/lib/routes'

const TABS = [
  { href: ROUTES.dashboard,      label: 'Inicio',     Icon: Home      },
  { href: ROUTES.studyConfigure, label: 'Estudio',    Icon: Pencil    },
  { href: ROUTES.curriculum,     label: 'Currículo',  Icon: Route     },
  { href: ROUTES.verbs,          label: 'Léxico',     Icon: Book      },
  { href: ROUTES.progress,       label: 'Progreso',   Icon: BarChart2 },
]
const HIDDEN_ROUTES = ['/auth', ROUTES.onboarding, ROUTES.write, ROUTES.brandPreview, ROUTES.verbsSession, ROUTES.vocabSession, ROUTES.pronunciationSession, ROUTES.admin]

export function BottomNav() {
  const pathname = usePathname()
  if (pathname === '/study') return null
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40
                 bg-background backdrop-blur-xl lg:hidden select-none
                 border-t border-[rgba(184,170,153,0.50)]"
      style={{
        // iOS tab bar: 49pt interactive area + safe-area-inset-bottom additive on top.
        // Do NOT use a fixed h-* class — that collapses content when safe area is non-zero.
        height: 'calc(3.125rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex h-full">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            (href === ROUTES.studyConfigure && pathname.startsWith(ROUTES.study)) ||
            (href !== ROUTES.dashboard && href !== ROUTES.studyConfigure && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`tap-highlight flex-1 flex flex-col items-center justify-center gap-1
                          transition-colors touch-manipulation
                          ${active ? 'text-primary' : 'text-[var(--d5-nav-inactive)]'}`}
            >
              {/* Pill: wider than tall, matching iOS active indicator proportions */}
              <span
                className="rounded-full px-3 py-0.5 transition-colors"
                style={{ background: active ? 'var(--d5-nav-pill)' : 'transparent' }}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span
                className={`text-[0.625rem] leading-none
                  ${active ? 'font-bold' : 'font-medium'}`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
