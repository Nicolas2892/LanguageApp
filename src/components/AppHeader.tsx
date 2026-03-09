'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserAvatar } from '@/components/UserAvatar'
import { LogoMark } from '@/components/LogoMark'

const HIDDEN_ROUTES = ['/auth', '/study', '/tutor', '/onboarding', '/brand-preview']

interface Props {
  userInitials: string
}

export function AppHeader({ userInitials }: Props) {
  const pathname = usePathname()
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null

  return (
    <header className="sticky top-0 z-50 border-b bg-background lg:hidden">
      <div className="h-14 flex items-center justify-between px-5">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoMark size={32} />
          <span
            className="font-semibold text-sm hidden sm:block tracking-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
          >
            Senda
          </span>
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
      </div>
    </header>
  )
}
