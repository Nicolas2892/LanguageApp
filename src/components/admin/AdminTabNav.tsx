'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin',            label: 'Overview'   },
  { href: '/admin/curriculum', label: 'Curriculum' },
  { href: '/admin/exercises',  label: 'Exercises'  },
]

export function AdminTabNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ href, label }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
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
