/**
 * CULTR Health — Cloudflare Bot Protection Worker
 *
 * Intercepts all requests to cultrhealth.com before they reach Cloudflare Pages.
 * Three layers of defense:
 *   1. Honeypot paths — instant 404 for scanner-only paths (/.env, /wp-admin, etc.)
 *   2. UA blocklist — known vulnerability scanners and aggressive scrapers get 403
 *   3. KV rate limiting — all non-search-engine traffic capped at 120 req/min per IP
 *
 * Legitimate search engines (Googlebot, Bingbot, etc.) and Cloudflare Turnstile
 * verification pass through without rate limiting.
 */

// `@cloudflare/workers-types` isn't installed in this repo — minimal local stubs
// so the root tsc check passes. Real types are provided by the CF runtime.
declare global {
  interface KVNamespace {
    get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number; expiration?: number; metadata?: unknown }): Promise<void>
    delete(key: string): Promise<void>
  }
  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void
    passThroughOnException(): void
  }
}
export {}

// ─── Vulnerability Scanners & Bad Bots ───────────────────────────────────────
// These are tools that actively probe for weaknesses or scrape at volume.
// Malicious scanners ignore robots.txt — this is the actual enforcement layer.
const BAD_BOT_UA_PATTERNS: RegExp[] = [
  // Security / Vulnerability Scanners
  /nuclei/i,
  /nikto/i,
  /sqlmap/i,
  /acunetix/i,
  /nessus/i,
  /openvas/i,
  /qualys/i,
  /nexpose/i,
  /masscan/i,
  /zgrab/i,
  /shodan\.io/i,
  /censys/i,
  /internet-measurement/i,
  /burpsuite/i,
  /owasp\s?zap/i,
  /w3af/i,
  /nmap\s?scripting/i,
  /metasploit/i,
  /havij/i,
  /pangolin/i,

  // Aggressive SEO scrapers (hitting APIs, /members, /intake at volume)
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /blexbot/i,
  /serpstatbot/i,
  /seoscanners\.net/i,
  /siteexplorer/i,
  /rogerbot/i,

  // Headless browsers / scrapers
  /phantomjs/i,
  /headlesschrome/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i, // CI/internal usage goes through staging, not production

  // Generic mass-scanners with no legitimate use against a telehealth platform
  /masscan/i,
  /zgrab/i,
  /libwww-perl/i,
  /lwp-trivial/i,

  // Known scraper frameworks that have no business hitting /api/ or /intake/
  /scrapy/i,
  /httpx\/\d/i, // httpx (the Go HTTP scanner, not httpx Python)
]

// ─── Honeypot Paths ───────────────────────────────────────────────────────────
// No legitimate user or search engine ever visits these paths on a Next.js site.
// Any request to them is a scanner — return 404 (don't reveal it's a trap).
const HONEYPOT_PATHS: string[] = [
  '/.env',
  '/.env.local',
  '/.env.production',
  '/.env.staging',
  '/.git',
  '/.aws',
  '/.ssh',
  '/wp-admin',
  '/wp-login.php',
  '/wp-content',
  '/wp-includes',
  '/xmlrpc.php',
  '/phpmyadmin',
  '/pma',
  '/mysql',
  '/admin.php',
  '/setup.php',
  '/install.php',
  '/config.php',
  '/configuration.php',
  '/web.config',
  '/cgi-bin',
  '/shell.php',
  '/c99.php',
  '/r57.php',
  '/server-status',
  '/server-info',
  '/.htaccess',
  '/.htpasswd',
  '/vendor/phpunit',
  '/composer.json',
  '/package.json.bak',
  '/backup',
  '/db_backup',
  '/dump.sql',
  '/database.sql',
  '/.DS_Store',
  '/Thumbs.db',
]

// ─── Legitimate Crawlers (skip rate limiting) ─────────────────────────────────
// These are verified search engines with known IP ranges. They respect robots.txt
// and have legitimate reasons to crawl marketing pages.
const TRUSTED_CRAWLER_UA = /googlebot|bingbot|duckduckbot|yandexbot|baiduspider|applebot|slurp|twitterbot|linkedinbot|discordbot/i

// ─── Rate Limiting Config ─────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 120       // max requests per window
const RATE_LIMIT_WINDOW_SEC = 60 // 1-minute rolling window

interface Env {
  RATE_LIMIT_KV: KVNamespace
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    'unknown'
  )
}

function isHoneypotPath(pathname: string): boolean {
  const lower = pathname.toLowerCase()
  return HONEYPOT_PATHS.some(p => lower === p || lower.startsWith(p + '/') || lower.startsWith(p + '?'))
}

function isBadBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 4) return true // empty UAs are scrapers
  return BAD_BOT_UA_PATTERNS.some(p => p.test(userAgent))
}

function shouldSkipRateLimit(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/blog/') ||
    pathname.startsWith('/media-kit/') ||
    pathname.startsWith('/pdfs/') ||
    pathname.startsWith('/docs/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp4|pdf|png|svg|txt|webm|webp|woff2?)$/i.test(pathname)
  )
}

async function checkRateLimit(ip: string, kv: KVNamespace): Promise<{ limited: boolean; count: number }> {
  const windowBucket = Math.floor(Date.now() / 1000 / RATE_LIMIT_WINDOW_SEC)
  const key = `rl:${ip}:${windowBucket}`

  try {
    const raw = await kv.get(key)
    const count = raw ? parseInt(raw, 10) : 0

    if (count >= RATE_LIMIT_MAX) {
      return { limited: true, count }
    }

    // Increment — TTL is 2× window to cover bucket edges
    await kv.put(key, String(count + 1), {
      expirationTtl: RATE_LIMIT_WINDOW_SEC * 2,
    })

    return { limited: false, count: count + 1 }
  } catch (error) {
    console.error('[bot-protection] KV rate limit unavailable; allowing request:', error)
    return { limited: false, count: 0 }
  }
}

// ─── Security Response Headers ────────────────────────────────────────────────
// Applied to all pass-through responses to harden the origin's headers.
function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  // Remove headers that reveal server tech
  headers.delete('X-Powered-By')
  headers.delete('Server')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname
    const userAgent = request.headers.get('User-Agent') || ''
    const ip = getClientIP(request)

    // ── Layer 1: Honeypot paths ──────────────────────────────────────────────
    // Return 404 — reveals nothing, confuses scanners
    if (isHoneypotPath(pathname)) {
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // ── Layer 2: Bad bot UA check ────────────────────────────────────────────
    if (isBadBot(userAgent)) {
      return new Response('Forbidden', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // ── Layer 3: Rate limiting (skip trusted crawlers) ───────────────────────
    if (!TRUSTED_CRAWLER_UA.test(userAgent) && !shouldSkipRateLimit(pathname)) {
      const { limited } = await checkRateLimit(ip, env.RATE_LIMIT_KV)
      if (limited) {
        return new Response('Too Many Requests', {
          status: 429,
          headers: {
            'Content-Type': 'text/plain',
            'Retry-After': String(RATE_LIMIT_WINDOW_SEC),
          },
        })
      }
    }

    // ── Pass through to Cloudflare Pages origin ──────────────────────────────
    const response = await fetch(request)
    return addSecurityHeaders(response)
  },
}
