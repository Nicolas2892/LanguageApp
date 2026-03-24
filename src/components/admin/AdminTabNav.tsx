'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

const TABS = [
  { href: ROUTES.admin,           label: 'Overview'   },
  { href: ROUTES.adminCurriculum, label: 'Curriculum' },
  { href: ROUTES.adminExercises,  label: 'Exercises'  },
  { href: ROUTES.adminPool,       label: 'Pool'       },
]

export function AdminTabNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ href, label }) => {
        const active = href === ROUTES.admin ? pathname === ROUTES.admin : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${
              active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
