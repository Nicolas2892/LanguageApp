'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Bot,
  BarChart2, LayoutList,
} from 'lucide-react'
import { UserAvatar } from '@/components/UserAvatar'
import { LogoMark } from '@/components/LogoMark'

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Home',       Icon: LayoutDashboard },
  { href: '/study/configure', label: 'Study',      Icon: BookOpen        },
  { href: '/curriculum',      label: 'Curriculum', Icon: LayoutList      },
  { href: '/progress',        label: 'Progress',   Icon: BarChart2       },
  { href: '/tutor',           label: 'Tutor',      Icon: Bot             },
]

const HIDDEN_ROUTES = ['/auth', '/onboarding', '/brand-preview']

interface Props {
  userInitials: string
}

export function SideNav({ userInitials }: Props) {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 w-[220px] border-r bg-background">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="group flex items-center gap-2.5 px-5 h-14 border-b shrink-0"
      >
        <span className="inline-flex transition-transform duration-200 group-hover:rotate-6">
          <LogoMark size={32} />
        </span>
        <span className="font-bold text-sm">Español Avanzado</span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            (href === '/study/configure' && pathname.startsWith('/study')) ||
            (href !== '/dashboard' && href !== '/study/configure' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
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
              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
        >
          <UserAvatar initials={userInitials} size="sm" />
          Account
        </Link>
      </div>
    </aside>
  )
}
