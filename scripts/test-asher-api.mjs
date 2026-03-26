/**
 * Quick diagnostic: tests the Asher Med API key & connectivity
 * Usage: ASHER_MED_API_KEY=your_key node scripts/test-asher-api.mjs
 *
 * Or set the key in .env.local first, then:
 *   node -r dotenv/config scripts/test-asher-api.mjs dotenv_config_path=.env.local
 */

const API_KEY = process.env.ASHER_MED_API_KEY
const API_URL = process.env.ASHER_MED_API_URL || 'https://prod-api.asherweightloss.com'

if (!API_KEY) {
  console.error('❌ ASHER_MED_API_KEY is not set.')
  console.error('   Run: ASHER_MED_API_KEY=your_key node scripts/test-asher-api.mjs')
  process.exit(1)
}

console.log(`🔍 Testing Asher Med API`)
console.log(`   URL: ${API_URL}`)
console.log(`   Key: ${API_KEY.slice(0, 6)}${'*'.repeat(Math.max(0, API_KEY.length - 6))}`)
console.log()

async function test(label, endpoint) {
  const url = `${API_URL}${endpoint}`
  try {
    const res = await fetch(url, {
      headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    })
    const body = await res.text()
    let parsed
    try { parsed = JSON.parse(body) } catch { parsed = body }

    const status = res.ok ? '✅' : '❌'
    console.log(`${status} ${label}`)
    console.log(`   Status: ${res.status} ${res.statusText}`)
    if (!res.ok) {
      console.log(`   Response: ${typeof parsed === 'object' ? JSON.stringify(parsed) : parsed}`)
    } else {
      // Show shape of response without dumping PHI
      if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed)
        console.log(`   Response keys: [${keys.join(', ')}]`)
        if (parsed.total !== undefined) console.log(`   Total records: ${parsed.total}`)
        if (Array.isArray(parsed.patients)) console.log(`   Patients returned: ${parsed.patients.length}`)
        if (Array.isArray(parsed.orders)) console.log(`   Orders returned: ${parsed.orders.length}`)
        if (Array.isArray(parsed.data)) console.log(`   Data items: ${parsed.data.length}`)
      }
    }
  } catch (err) {
    console.log(`❌ ${label}`)
    console.log(`   Network error: ${err.message}`)
  }
  console.log()
}

await test('GET /patients (limit 1)', '/api/v1/external/partner/patients?limit=1')
await test('GET /orders (limit 1)',   '/api/v1/external/partner/orders?limit=1')
