import { renderIcon } from './icon-shared'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return renderIcon(size.width, size.height)
}
