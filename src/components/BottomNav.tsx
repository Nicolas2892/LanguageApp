'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardCheck, BookMarked, BarChart2 } from 'lucide-react'

/* Brand-preview SVG icons for Study and Tutor (match senda-master-specs) */
function StudyIcon({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z" />
    </svg>
  )
}

function TutorIcon({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8M3 12v6a2 2 0 002 2h14a2 2 0 002-2v-6M3 12h18" />
    </svg>
  )
}

const TABS = [
  { href: '/dashboard',       label: 'Home',       Icon: Home            },
  { href: '/study/configure', label: 'Study',      Icon: StudyIcon       },
  { href: '/curriculum',      label: 'Curriculum', Icon: ClipboardCheck  },
  { href: '/verbs',           label: 'Verbs',      Icon: BookMarked      },
  { href: '/progress',        label: 'Progress',   Icon: BarChart2       },
  { href: '/tutor',           label: 'Tutor',      Icon: TutorIcon       },
]
const HIDDEN_ROUTES = ['/auth', '/onboarding', '/write', '/brand-preview', '/verbs/session', '/admin']

export function BottomNav() {
  const pathname = usePathname()
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
            (href === '/study/configure' && pathname.startsWith('/study')) ||
            (href !== '/dashboard' && href !== '/study/configure' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1
                          transition-colors touch-manipulation
                          ${active ? 'text-primary' : 'text-[#9ca3af]'}`}
            >
              {/* Pill: wider than tall, matching iOS active indicator proportions */}
              <span
                className="rounded-full px-3 py-0.5 transition-colors"
                style={{ background: active ? 'rgba(184,170,153,0.28)' : 'transparent' }}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span
                className={`text-[9px] leading-none
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
