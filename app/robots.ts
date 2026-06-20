import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://visuologia.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/dashboard', '/my-visualizations', '/sign-in', '/sign-up'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
