import { sql } from '@vercel/postgres'

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown'
}

export async function getActiveClubOrderCount(email: string): Promise<number> {
  if (!process.env.POSTGRES_URL) return 0

  try {
    const result = await sql`
      SELECT COUNT(*)::integer AS count
      FROM club_orders
      WHERE LOWER(member_email) = LOWER(${email})
        AND status NOT IN ('cancelled', 'rejected', 'dismissed')
    `
    return Number(result.rows[0]?.count ?? 0)
  } catch (error) {
    console.error('[club-discounts] First-purchase eligibility lookup failed (non-fatal):', describeError(error))
    return Number.POSITIVE_INFINITY
  }
}

export async function isFirstPurchaseDiscountEligible(email: string): Promise<boolean> {
  const count = await getActiveClubOrderCount(email)
  return count === 0
}
