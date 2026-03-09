'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Bot, BarChart2, LayoutList, BookMarked } from 'lucide-react'

const TABS = [
  { href: '/dashboard',       label: 'Home',       Icon: LayoutDashboard },
  { href: '/study/configure', label: 'Study',      Icon: BookOpen        },
  { href: '/curriculum',      label: 'Curriculum', Icon: LayoutList      },
  { href: '/verbs',           label: 'Conjugation', Icon: BookMarked      },
  { href: '/progress',        label: 'Progress',   Icon: BarChart2       },
  { href: '/tutor',           label: 'Tutor',      Icon: Bot             },
]
const HIDDEN_ROUTES = ['/auth', '/onboarding', '/write', '/brand-preview', '/verbs/session', '/admin']

export function BottomNav() {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40
                 bg-background backdrop-blur-xl lg:hidden select-none
                 border-t border-border/30"
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
                          ${active ? 'text-green-800 dark:text-green-400' : 'text-muted-foreground'}`}
            >
              {/* Pill: wider than tall, matching iOS active indicator proportions */}
              <span
                className={`rounded-full px-3 py-0.5 transition-colors
                  ${active ? 'bg-green-100 dark:bg-green-950/40' : ''}`}
              >
                <Icon className="h-6 w-6" />
              </span>
              {/* 10px matches iOS 10pt label spec */}
              <span
                className={`text-[10px] leading-none
                  ${active ? 'font-semibold' : 'font-medium'}`}
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
