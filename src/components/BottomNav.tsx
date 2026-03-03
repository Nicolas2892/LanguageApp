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
const HIDDEN_ROUTES = ['/auth', '/study', '/tutor', '/onboarding', '/write']

export function BottomNav() {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border/50
                 bg-background/90 backdrop-blur-xl lg:hidden select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
              className={`flex-1 flex flex-col items-center justify-center gap-0.5
                          transition-colors touch-manipulation
                          ${active ? 'text-orange-500' : 'text-muted-foreground'}`}
            >
              <span
                className={`rounded-full p-1.5 transition-colors
                  ${active ? 'bg-orange-100' : ''}`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span
                className={`text-[11px] leading-none
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
