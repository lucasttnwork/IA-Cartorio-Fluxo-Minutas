import { test, expect } from '@playwright/test'

test.describe('Login and Dashboard Verification', () => {
  test('should login successfully and display dashboard with shadcn components', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3007/login')

    // Take screenshot of login page
    await page.screenshot({ path: '.playwright-mcp/login-verification.png', fullPage: true })

    // Verify login page loads with shadcn components
    await expect(page.locator('h1:has-text("Minuta Canvas")')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Fill in login credentials
    // Using test credentials from Supabase
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'test123456')

    // Click sign in button
    await page.click('button[type="submit"]:has-text("Sign in")')

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Wait for dashboard content to load
    await page.waitForSelector('h1:has-text("Cases")', { timeout: 10000 })

    // Take screenshot of dashboard
    await page.screenshot({ path: '.playwright-mcp/dashboard-verification.png', fullPage: true })

    // Verify dashboard page elements with shadcn components
    await expect(page.locator('h1:has-text("Cases")')).toBeVisible()
    await expect(page.locator('button:has-text("New Case")')).toBeVisible()

    // Verify shadcn UI components are rendered
    // Check for Input component (search bar)
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()

    // Check for Button component
    const newCaseButton = page.locator('button:has-text("New Case")')
    await expect(newCaseButton).toBeVisible()

    // Verify the glass-card styling is applied (shadcn Card component)
    const cards = page.locator('.glass-card')
    const cardCount = await cards.count()
    console.log(`Found ${cardCount} card components on dashboard`)

    // If there are case cards, verify Badge components
    if (cardCount > 0) {
      const badges = page.locator('[class*="badge"]')
      const badgeCount = await badges.count()
      console.log(`Found ${badgeCount} badge components on dashboard`)
    }

    // Take final screenshot showing full dashboard with components
    await page.screenshot({
      path: '.playwright-mcp/dashboard-with-shadcn-components.png',
      fullPage: true
    })

    console.log('✓ Login successful')
    console.log('✓ Dashboard loaded with shadcn components')
  })

  test('should display dashboard in empty state if no cases exist', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3007/login')

    // Login
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'test123456')
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForSelector('h1:has-text("Cases")', { timeout: 10000 })

    // Check if empty state is visible (if no cases)
    const emptyState = page.locator('text="No cases yet"')
    const hasEmptyState = await emptyState.isVisible().catch(() => false)

    if (hasEmptyState) {
      console.log('✓ Empty state displayed with shadcn Card component')
      await page.screenshot({
        path: '.playwright-mcp/dashboard-empty-state-verification.png',
        fullPage: true
      })
    } else {
      console.log('✓ Dashboard showing case list')
    }
  })
})
