import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Español Avanzado',
    short_name: 'EA',
    description: 'Adaptive Spanish learning for B1 to B2 progression',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#18181b',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Study Now',
        short_name: 'Study',
        description: 'Start your SRS review session',
        url: '/study',
        icons: [{ src: '/icon', sizes: '192x192' }],
      },
      {
        name: 'Quick Sprint',
        short_name: 'Sprint',
        description: '10-minute sprint session',
        url: '/study?mode=sprint',
        icons: [{ src: '/icon', sizes: '192x192' }],
      },
      {
        name: 'View Progress',
        short_name: 'Progress',
        description: 'See your learning progress',
        url: '/progress',
        icons: [{ src: '/icon', sizes: '192x192' }],
      },
    ],
  }
}
