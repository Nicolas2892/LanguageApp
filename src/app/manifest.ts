import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Senda',
    short_name: 'Senda',
    description: 'Tu camino al español avanzado',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FDFCF9',
    theme_color: '#C4522E',
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
      {
        src: '/api/pwa-icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Estudiar Ahora',
        short_name: 'Estudiar',
        description: 'Empieza tu repaso diario',
        url: '/study',
        icons: [{ src: '/icon', sizes: '192x192' }],
      },
      {
        name: 'Conjugar Verbos',
        short_name: 'Verbos',
        description: 'Practica la conjugación',
        url: '/verbs/configure',
        icons: [{ src: '/icon', sizes: '192x192' }],
      },
      {
        name: 'Ver Progreso',
        short_name: 'Progreso',
        description: 'Consulta tu avance',
        url: '/progress',
        icons: [{ src: '/icon', sizes: '192x192' }],
      },
    ],
  }
}
