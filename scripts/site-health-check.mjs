#!/usr/bin/env node

/**
 * CULTR Health Site Health Check
 *
 * Methodically verifies critical sections of the site via HTTP requests.
 * Organized by priority tier so revenue-critical pages are checked first.
 *
 * Usage:
 *   node scripts/site-health-check.mjs [base-url]
 *
 * Examples:
 *   node scripts/site-health-check.mjs                              # checks localhost:3000
 *   node scripts/site-health-check.mjs https://staging.cultrhealth.com
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------
const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// ---------------------------------------------------------------------------
// Check definitions
// ---------------------------------------------------------------------------
const tiers = [
  {
    name: 'TIER 1: Revenue-Critical',
    checks: [
      { method: 'GET', path: '/', expect: 200, bodyContains: 'CULTR' },
      { method: 'GET', path: '/pricing', expect: 200, bodyContains: 'Core' },
      { method: 'GET', path: '/join/core', expect: 200 },
      { method: 'GET', path: '/join/catalyst', expect: 200 },
      { method: 'GET', path: '/join/club', expect: 200 },
      { method: 'GET', path: '/quiz', expect: 200 },
      { method: 'POST', path: '/api/checkout', expectNot500: true },
      { method: 'POST', path: '/api/club/signup', expectNot500: true },
    ],
  },
  {
    name: 'TIER 2: Patient Experience',
    checks: [
      { method: 'GET', path: '/intake', expect: 200 },
      { method: 'GET', path: '/login', expect: 200 },
      { method: 'GET', path: '/portal/login', expect: 200 },
      { method: 'GET', path: '/how-it-works', expect: 200 },
      { method: 'GET', path: '/therapies', expect: 200 },
      { method: 'POST', path: '/api/auth/magic-link', expectNot500: true },
      { method: 'GET', path: '/api/intake/questions', expectNot500: true },
    ],
  },
  {
    name: 'TIER 3: Marketing & SEO',
    checks: [
      { method: 'GET', path: '/science', expect: 200 },
      { method: 'GET', path: '/faq', expect: 200 },
      { method: 'GET', path: '/community', expect: 200 },
      { method: 'GET', path: '/creators', expect: 200 },
      { method: 'GET', path: '/legal/privacy', expect: 200 },
      { method: 'GET', path: '/legal/terms', expect: 200 },
    ],
  },
  {
    name: 'TIER 4: Admin & Creator',
    checks: [
      { method: 'GET', path: '/admin', expect: [200, 302, 307] },
      { method: 'GET', path: '/creators/login', expect: 200 },
      { method: 'GET', path: '/creators/apply', expect: 200 },
    ],
  },
];

// ---------------------------------------------------------------------------
// HTTP check runner
// ---------------------------------------------------------------------------
async function runCheck(check) {
  const url = `${BASE_URL}${check.path}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const opts = {
      method: check.method,
      signal: controller.signal,
      redirect: 'manual',
    };

    if (check.method === 'POST') {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify({});
    }

    const res = await fetch(url, opts);
    clearTimeout(timer);

    const elapsed = Date.now() - start;
    const status = res.status;

    // Read body for content checks (limit to 50KB to avoid memory issues)
    let body = '';
    if (check.bodyContains) {
      try {
        body = await res.text();
        body = body.slice(0, 50_000);
      } catch {
        // ignore body read errors
      }
    }

    // Determine pass/fail
    let passed = false;
    let detail = '';

    if (check.expectNot500) {
      passed = status < 500;
      if (!passed) detail = `Server Error ${status}`;
    } else if (Array.isArray(check.expect)) {
      passed = check.expect.includes(status);
      if (!passed) detail = `Expected ${check.expect.join('|')}, got ${status}`;
    } else {
      passed = status === check.expect;
      if (!passed) detail = `Expected ${check.expect}, got ${status}`;
    }

    // Body content check
    if (passed && check.bodyContains && !body.includes(check.bodyContains)) {
      passed = false;
      detail = `Missing "${check.bodyContains}" in response body`;
    }

    return { check, passed, status, elapsed, detail, warn: false };
  } catch (err) {
    const elapsed = Date.now() - start;

    if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      return {
        check,
        passed: false,
        status: null,
        elapsed,
        detail: 'Connection refused — server not running?',
        warn: true,
      };
    }

    if (err.name === 'AbortError') {
      return {
        check,
        passed: false,
        status: null,
        elapsed,
        detail: `Timeout after ${TIMEOUT_MS}ms`,
        warn: false,
      };
    }

    return {
      check,
      passed: false,
      status: null,
      elapsed,
      detail: err.message || 'Unknown error',
      warn: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------
function formatResult(result) {
  const { check, passed, status, elapsed, detail, warn } = result;
  const method = check.method.padEnd(4);
  const path = check.path.padEnd(28);
  const timeStr = `(${elapsed}ms)`;

  if (warn) {
    return `  ${c.yellow('[WARN]')} ${method} ${path}  ---  ${timeStr}  ${c.dim(detail)}`;
  }
  if (passed) {
    return `  ${c.green('[PASS]')} ${method} ${path}  ${status}  ${timeStr}`;
  }
  return `  ${c.red('[FAIL]')} ${method} ${path}  ${status || '---'}  ${timeStr}  ${c.red(detail)}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('');
  console.log(c.bold(`CULTR Health Site Check — ${BASE_URL}`));
  console.log('='.repeat(60));

  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;
  const tier1Failures = [];
  let connectionRefused = false;

  for (const tier of tiers) {
    console.log('');
    console.log(c.cyan(tier.name));

    const results = [];
    for (const check of tier.checks) {
      const result = await runCheck(check);
      results.push(result);

      // Detect connection refused early — no point hammering a dead server
      if (result.detail?.includes('Connection refused')) {
        connectionRefused = true;
      }
    }

    for (const result of results) {
      console.log(formatResult(result));

      if (result.warn) {
        totalWarn++;
      } else if (result.passed) {
        totalPass++;
      } else {
        totalFail++;
      }

      // Track Tier 1 failures
      if (tier.name.includes('TIER 1') && !result.passed && !result.warn) {
        tier1Failures.push(`${result.check.path} (${result.status || 'error'})`);
      }
    }

    // Early exit if server is completely down
    if (connectionRefused && tier.name.includes('TIER 1')) {
      console.log('');
      console.log(c.yellow('Server not reachable — skipping remaining tiers.'));
      break;
    }
  }

  // Summary
  console.log('');
  console.log('='.repeat(60));

  const summaryParts = [`${totalPass + totalFail + totalWarn} checked`];
  summaryParts.push(c.green(`${totalPass} passed`));
  if (totalFail > 0) summaryParts.push(c.red(`${totalFail} failed`));
  if (totalWarn > 0) summaryParts.push(c.yellow(`${totalWarn} warnings`));
  console.log(`SUMMARY: ${summaryParts.join(' | ')}`);

  if (tier1Failures.length > 0) {
    console.log(c.red(`TIER 1 FAILURES: ${tier1Failures.join(', ')}`));
  }

  if (connectionRefused) {
    console.log(c.yellow(`\nHint: Is the server running at ${BASE_URL}?`));
  }

  console.log('');

  // Exit code: 1 if any Tier 1 failure (non-warn), 0 otherwise
  process.exit(tier1Failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(c.red(`Fatal error: ${err.message}`));
  process.exit(1);
});
