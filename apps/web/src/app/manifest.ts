import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GDC Macrocoop',
    short_name: 'GDC',
    description: 'Sistema de Gestão de Cooperativas',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#267b4c',
    theme_color: '#267b4c',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
