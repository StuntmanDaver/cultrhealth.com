import { createPool } from '@vercel/postgres'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
})

async function check() {
  const client = await pool.connect()
  try {
    const affiliateCodeRes = await client.query(`
      SELECT * FROM affiliate_codes
      WHERE lower(code) = 'gators'
        AND active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR use_count < max_uses)
    `)
    const affiliateCode = affiliateCodeRes.rows[0]
    console.log('Affiliate Code:', affiliateCode)

    if (affiliateCode) {
      const creatorRes = await client.query(`
        SELECT * FROM creators WHERE id = $1
      `, [affiliateCode.creator_id])
      const creator = creatorRes.rows[0]
      console.log('Creator:', creator)
      if (creator && creator.status === 'active') {
        console.log('Valid! Discount:', Math.floor(Number(affiliateCode.discount_value)))
      } else {
        console.log('Creator not active')
      }
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

check()