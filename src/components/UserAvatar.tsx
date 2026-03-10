interface Props {
  initials: string
  /** sm = 24px (SideNav icon row), md = 32px (AppHeader), lg = 48px (account page header) */
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-12 w-12 text-lg',
}

export function UserAvatar({ initials, size = 'md' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center font-bold select-none shrink-0 bg-foreground/[0.08] text-foreground/50`}
    >
      {initials || '?'}
    </span>
  )
}
