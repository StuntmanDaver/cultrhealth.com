import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionToken, isProviderEmail } from '@/lib/auth'

// SiPhox Health API smoke test — permanent admin health check endpoint
// Runs 6 sequential tests against the live SiPhox API

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration_ms: number
  data?: unknown
  error?: string
}

export async function GET(request: NextRequest) {
  // Auth check — admin only
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('cultr_session')
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifySessionToken(session.value)
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    if (!isProviderEmail(payload.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 })
  }

  const { isSiphoxConfigured } = await import('@/lib/siphox/client')

  if (!isSiphoxConfigured()) {
    return NextResponse.json({
      error: 'SIPHOX_API_KEY not configured',
      tests: [],
    }, { status: 503 })
  }

  const results: TestResult[] = []
  let customerId: string | null = null
  let orderId: string | null = null

  // ============================================================
  // TEST 1: Credit Balance Check (read-only)
  // ============================================================
  {
    const start = Date.now()
    try {
      const { checkCreditBalance } = await import('@/lib/siphox/client')
      const credits = await checkCreditBalance()
      results.push({
        test: '1. Credit Balance',
        status: 'PASS',
        duration_ms: Date.now() - start,
        data: { balance: credits.balance, isLow: credits.isLow },
      })
    } catch (err) {
      results.push({
        test: '1. Credit Balance',
        status: 'FAIL',
        duration_ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ============================================================
  // TEST 2: Biomarker Catalog (read-only)
  // ============================================================
  {
    const start = Date.now()
    try {
      const { getBiomarkers } = await import('@/lib/siphox/client')
      const biomarkers = await getBiomarkers()
      results.push({
        test: '2. Biomarker Catalog',
        status: 'PASS',
        duration_ms: Date.now() - start,
        data: {
          count: biomarkers.length,
          sample: biomarkers.slice(0, 3).map(b => ({ biomarker: b.biomarker, unit: b.unit })),
        },
      })
    } catch (err) {
      results.push({
        test: '2. Biomarker Catalog',
        status: 'FAIL',
        duration_ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ============================================================
  // TEST 3: Customer Lookup (read-only)
  // ============================================================
  {
    const start = Date.now()
    try {
      const { getCustomerByExternalId } = await import('@/lib/siphox/client')
      const customer = await getCustomerByExternalId('smoke-test-nonexistent-xyz')
      results.push({
        test: '3. Customer Lookup',
        status: 'PASS',
        duration_ms: Date.now() - start,
        data: { found: customer !== null, note: customer ? 'Existing customer found' : 'Correctly returned null for nonexistent ID' },
      })
    } catch (err) {
      results.push({
        test: '3. Customer Lookup',
        status: 'FAIL',
        duration_ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ============================================================
  // TEST 4: Customer Creation (write)
  // ============================================================
  {
    const start = Date.now()
    try {
      const { createCustomer, getCustomerByExternalId } = await import('@/lib/siphox/client')
      const externalId = `smoke-test-cultr-${Date.now()}`

      // Check if already exists first
      const existing = await getCustomerByExternalId(externalId)
      if (existing) {
        customerId = existing._id
        results.push({
          test: '4. Customer Creation',
          status: 'PASS',
          duration_ms: Date.now() - start,
          data: { customerId, note: 'Already existed', externalId },
        })
      } else {
        const customer = await createCustomer({
          first_name: 'CULTR',
          last_name: 'SmokeTest',
          email: 'siphox-smoke@cultrhealth.com',
          phone: '+13529990199',
          external_id: externalId,
          address: {
            street1: '123 Test Street',
            city: 'Gainesville',
            state: 'FL',
            zip: '32601',
            country: 'US',
          },
        })
        customerId = customer._id
        results.push({
          test: '4. Customer Creation',
          status: 'PASS',
          duration_ms: Date.now() - start,
          data: { customerId, externalId },
        })
      }
    } catch (err) {
      results.push({
        test: '4. Customer Creation',
        status: 'FAIL',
        duration_ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ============================================================
  // TEST 5: Order Creation (write — uses 1 credit)
  // ============================================================
  // Only run if ?createOrder=true is passed (safety check for credit spend)
  const createOrderParam = request.nextUrl.searchParams.get('createOrder')
  {
    const start = Date.now()
    if (!customerId) {
      results.push({
        test: '5. Order Creation',
        status: 'SKIP',
        duration_ms: 0,
        error: 'Skipped — no customerId from Test 4',
      })
    } else if (createOrderParam !== 'true') {
      results.push({
        test: '5. Order Creation',
        status: 'SKIP',
        duration_ms: 0,
        data: { note: 'Add ?createOrder=true to URL to run this test (uses 1 credit)' },
      })
    } else {
      try {
        const { createOrder } = await import('@/lib/siphox/client')
        const order = await createOrder({
          recipient: {
            first_name: 'CULTR',
            last_name: 'SmokeTest',
            email: 'siphox-smoke@cultrhealth.com',
            phone: '+13529990199',
            external_id: `smoke-test-cultr-${Date.now()}`,
            address: {
              street1: '123 Test Street',
              city: 'Gainesville',
              state: 'FL',
              zip: '32601',
              country: 'US',
            },
          },
          kit_types: [{ kitType: 'standard_panel', quantity: 1 }],
          is_notify_receiver: false,
        })
        orderId = order._id
        results.push({
          test: '5. Order Creation',
          status: 'PASS',
          duration_ms: Date.now() - start,
          data: { orderId, orderStatus: order.status },
        })
      } catch (err) {
        results.push({
          test: '5. Order Creation',
          status: 'FAIL',
          duration_ms: Date.now() - start,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  // ============================================================
  // TEST 6: Report Fetch (read-only)
  // ============================================================
  {
    const start = Date.now()
    if (!customerId) {
      results.push({
        test: '6. Report Fetch',
        status: 'SKIP',
        duration_ms: 0,
        error: 'Skipped — no customerId from Test 4',
      })
    } else {
      try {
        const { getReports } = await import('@/lib/siphox/client')
        const reports = await getReports(customerId)
        results.push({
          test: '6. Report Fetch',
          status: 'PASS',
          duration_ms: Date.now() - start,
          data: { reportCount: reports.length, note: reports.length === 0 ? 'No reports yet (expected for new customer)' : `${reports.length} report(s) found` },
        })
      } catch (err) {
        results.push({
          test: '6. Report Fetch',
          status: 'FAIL',
          duration_ms: Date.now() - start,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length
  const totalMs = results.reduce((sum, r) => sum + r.duration_ms, 0)

  return NextResponse.json({
    summary: {
      passed,
      failed,
      skipped,
      total: results.length,
      duration_ms: totalMs,
      allPassed: failed === 0,
    },
    tests: results,
    cleanup: {
      customerId,
      orderId,
      note: 'Delete test customer/order from SiPhox dashboard if needed',
    },
  })
}
