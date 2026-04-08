import { test, expect, Page } from '@playwright/test'

const TEAM_EMAIL = 'david@cultrhealth.com'
const RESPONSIVE_CONTAINER_ERROR = 'The width(-1) and height(-1) of chart should be greater than 0'

function trackResponsiveContainerErrors(page: Page) {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes(RESPONSIVE_CONTAINER_ERROR)) {
      errors.push(message.text())
    }
  })

  return errors
}

async function loginMember(page: Page, redirect: string) {
  const response = await page.request.post('/api/auth/magic-link', {
    data: { email: TEAM_EMAIL, redirect },
  })

  expect(response.ok()).toBeTruthy()

  const payload = await response.json()
  expect(payload.success).toBeTruthy()
  expect(payload.stagingAccess).toBeTruthy()
  expect(payload.redirectUrl).toBeDefined()

  const token = new URL(payload.redirectUrl).searchParams.get('token')
  expect(token).toBeTruthy()

  await page.goto(`/api/auth/verify?token=${encodeURIComponent(token ?? '')}&redirect=${encodeURIComponent(redirect)}`)
  await page.waitForURL((url) => new URL(url).pathname === redirect)
  await page.waitForLoadState('networkidle')
}

async function loginCreator(page: Page) {
  const response = await page.request.post('/api/creators/magic-link', {
    data: { email: TEAM_EMAIL },
  })

  expect(response.ok()).toBeTruthy()

  const payload = await response.json()
  expect(payload.success).toBeTruthy()
  expect(payload.redirectUrl).toBeDefined()

  const token = new URL(payload.redirectUrl).searchParams.get('token')
  expect(token).toBeTruthy()

  await page.goto(`/api/creators/verify-login?token=${encodeURIComponent(token ?? '')}`)
  await page.waitForURL((url) => new URL(url).pathname === '/creators/portal/dashboard')
  await page.waitForLoadState('networkidle')
}

test.describe('Safari dashboard rendering', () => {
  test('admin dashboard renders charts without responsive container errors', async ({ page }) => {
    const responsiveContainerErrors = trackResponsiveContainerErrors(page)

    await loginMember(page, '/admin')

    await expect(page.getByRole('heading', { name: 'Revenue Trend' })).toBeVisible()
    await expect(page.locator('.recharts-surface').first()).toBeVisible()
    expect(responsiveContainerErrors).toEqual([])
  })

  test('creator dashboard renders charts without responsive container errors', async ({ page }) => {
    const responsiveContainerErrors = trackResponsiveContainerErrors(page)

    await loginCreator(page)

    await expect(page.getByText('Performance Trends')).toBeVisible()
    await expect(page.locator('.recharts-surface').first()).toBeVisible()
    expect(responsiveContainerErrors).toEqual([])
  })

  test('member dashboard renders without getting stuck on loading', async ({ page }) => {
    const responsiveContainerErrors = trackResponsiveContainerErrors(page)

    await loginMember(page, '/dashboard')

    await expect(page.getByRole('heading', { name: 'Member Dashboard' })).toBeVisible()
    expect(responsiveContainerErrors).toEqual([])
  })
})
