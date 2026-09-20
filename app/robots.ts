import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${SITE_URL}/sitemap.xml`,
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/login',
        '/register',
        '/profile',
        '/collection',
        '/camera-frame',
        '/forum/new',
        '/forum/my-posts',
        '/forum/saved',
        '/forum/*/edit',
        '/outfit/step-2',
        '/outfit/step-3',
        '/personal-color/result',
      ],
    },
  }
}
