import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/library/',
          '/provider/',
          '/success',
          '/join/',
        ],
      },
    ],
    sitemap: 'https://www.cultrhealth.com/sitemap.xml',
  }
}
