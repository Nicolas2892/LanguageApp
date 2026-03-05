'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, MessageSquare, BarChart2, LayoutList } from 'lucide-react'

const TABS = [
  { href: '/dashboard',  label: 'Home',       Icon: LayoutDashboard },
  { href: '/study',      label: 'Study',      Icon: BookOpen        },
  { href: '/tutor',      label: 'Tutor',      Icon: MessageSquare   },
  { href: '/progress',   label: 'Progress',   Icon: BarChart2       },
  { href: '/curriculum', label: 'Curriculum', Icon: LayoutList      },
]
const HIDDEN_ROUTES = ['/auth', '/onboarding', '/write']

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
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1
                          transition-colors touch-manipulation
                          ${active ? 'text-orange-500 dark:text-orange-400' : 'text-muted-foreground'}`}
            >
              {/* Pill: wider than tall, matching iOS active indicator proportions */}
              <span
                className={`rounded-full px-3 py-0.5 transition-colors
                  ${active ? 'bg-orange-100 dark:bg-orange-950/40' : ''}`}
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
