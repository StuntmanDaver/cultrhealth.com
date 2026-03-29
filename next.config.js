const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize production builds
  compiler: {
    // Remove console.log in production but keep error/warn for debugging
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['lucide-react', 'recharts', 'zod'],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Headers for caching
  async headers() {
    return [
      // Security headers — applied to all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Marketing pages: 5min edge cache, 1min stale window
      {
        source: '/(pricing|how-it-works|faq|community|science|legal/:path*|creators|quiz|therapies|tools)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
          },
        ],
      },
      // Homepage: 5min edge cache, 1min stale window
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
          },
        ],
      },
      // Authenticated/dynamic pages: never cache (HIPAA compliance)
      {
        source: '/(dashboard|library|intake|renewal|admin|creators/portal|join)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Join page root: never cache (serves personalized content)
      {
        source: '/join',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Public images — browser revalidates, CDN caches (purged on deploy)
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=604800, must-revalidate',
          },
        ],
      },
      // Fonts — long cache (filenames rarely change, content never does)
      {
        source: '/:all*(woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for removed pages
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/pricing',
        permanent: true, // 301 redirect
      },
      {
        source: '/products/:path*',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/consultations',
        destination: '/library/consultations',
        permanent: true,
      },
      {
        source: '/consultations/:path*',
        destination: '/library/consultations/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
// cache-bust-1772663606
