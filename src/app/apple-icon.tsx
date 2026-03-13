import { renderIcon } from './icon-shared'

// Apple touch icon — iOS applies its own border-radius mask, so render as full square
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return renderIcon(size.width, size.height, { rounded: false })
}
