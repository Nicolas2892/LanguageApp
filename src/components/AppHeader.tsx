'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/UserAvatar'

const HIDDEN_ROUTES = ['/auth', '/study', '/tutor', '/onboarding']

interface Props {
  userInitials: string
}

export function AppHeader({ userInitials }: Props) {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-5
                       border-b bg-background/95 backdrop-blur-sm lg:hidden">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center
                         text-white font-black text-sm select-none">
          ES
        </span>
        <span className="font-bold text-sm hidden sm:block">Español Avanzado</span>
      </Link>

      {/* Profile avatar → /account */}
      <Link
        href="/account"
        aria-label="Account"
        className="rounded-full p-1.5 hover:bg-muted transition-colors min-w-[44px]
                   min-h-[44px] flex items-center justify-center"
      >
        <UserAvatar initials={userInitials} size="md" />
      </Link>
    </header>
  )
}
