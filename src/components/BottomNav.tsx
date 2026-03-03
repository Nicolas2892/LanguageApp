'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, BarChart2, LayoutList } from 'lucide-react'

const TABS = [
  { href: '/dashboard',  label: 'Home',       Icon: LayoutDashboard },
  { href: '/study',      label: 'Study',      Icon: BookOpen        },
  { href: '/progress',   label: 'Progress',   Icon: BarChart2       },
  { href: '/curriculum', label: 'Curriculum', Icon: LayoutList      },
]
const HIDDEN_ROUTES = ['/auth', '/study', '/tutor', '/onboarding', '/write']

export function BottomNav() {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t
                 bg-background/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-full">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
