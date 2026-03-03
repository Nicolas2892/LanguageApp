'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, MessageSquare,
  BarChart2, LayoutList, UserCircle,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Home',       Icon: LayoutDashboard },
  { href: '/study',      label: 'Study',      Icon: BookOpen        },
  { href: '/tutor',      label: 'Tutor',      Icon: MessageSquare   },
  { href: '/progress',   label: 'Progress',   Icon: BarChart2       },
  { href: '/curriculum', label: 'Curriculum', Icon: LayoutList      },
]

const HIDDEN_ROUTES = ['/auth', '/onboarding', '/write']

export function SideNav() {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-[220px] border-r bg-background">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-5 h-14 border-b shrink-0"
      >
        <span className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center
                         text-white font-black text-sm select-none">
          ES
        </span>
        <span className="font-bold text-sm">Español Avanzado</span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Account at bottom */}
      <div className="p-3 border-t shrink-0">
        <Link
          href="/account"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${pathname.startsWith('/account')
              ? 'bg-orange-50 text-orange-600'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
        >
          <UserCircle className="h-5 w-5 shrink-0" />
          Account
        </Link>
      </div>
    </aside>
  )
}
