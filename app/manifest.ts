import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VisualMe',
    short_name: 'VisualMe',
    description: 'AI-Powered Universal Data Visualization',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    // TODO: Add 192x192 and 512x512 PNG icons for full PWA installability
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
