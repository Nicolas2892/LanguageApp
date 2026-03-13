import { renderIcon } from '@/app/icon-shared'

/**
 * 512x512 PWA icon for the web app manifest.
 * Cached for 30 days since the icon rarely changes.
 */
export async function GET() {
  const response = renderIcon(512, 512)
  response.headers.set('Cache-Control', 'public, max-age=2592000, immutable')
  return response
}
