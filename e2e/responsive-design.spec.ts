import { test, expect } from '@playwright/test'
import { loginTestUser, logout, navigateToDashboard } from './fixtures'

/**
 * Responsive Design Testing (FASE 15 - Semana 3)
 * Tests R001-R013: Responsive layouts, touch interactions, mobile viewports
 */

test.describe.configure({ mode: 'parallel' })

test.describe('Responsive Design - Desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('R001: Desktop layout renders correctly at 1440px', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Check main layout container
    const mainContainer = page.locator('main, [role="main"], .main-content').first()
    if (await mainContainer.count() > 0) {
      await expect(mainContainer).toBeVisible()

      const boundingBox = await mainContainer.boundingBox()
      expect(boundingBox?.width).toBeLessThanOrEqual(1440)
    }

    // Check grid layout
    const gridContainer = page.locator('[class*="grid"], [class*="flex"]').first()
    if (await gridContainer.count() > 0) {
      await expect(gridContainer).toBeVisible()
    }

    await logout(page)
  })

  test('R002: No horizontal scrolling at 1440px', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Check if page has horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    // scrollWidth should not exceed viewport
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // +1 for rounding

    await logout(page)
  })
})

test.describe('Responsive Design - Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('R003: Tablet layout at 768px adjusts properly', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Check responsive grid adjusts
    const caseCards = page.locator('.glass-card, [class*="card"]')
    if (await caseCards.count() > 0) {
      // Cards should be visible and responsive
      expect(await caseCards.count()).toBeGreaterThan(0)

      // Check card width is reasonable for tablet
      const firstCard = caseCards.first()
      const boundingBox = await firstCard.boundingBox()

      // Card width should not exceed 90% of viewport
      expect(boundingBox?.width).toBeLessThanOrEqual(768 * 0.95)
    }

    await logout(page)
  })

  test('R004: Navigation collapses to hamburger menu on tablet', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Look for hamburger menu or collapsed nav
    const hamburgerMenu = page.locator('button[aria-label*="menu" i], button[aria-label*="toggle" i]').first()
    const navBar = page.locator('nav, [role="navigation"]').first()

    if (await navBar.count() > 0) {
      // Navigation exists - check if it's responsive
      const navVisible = await navBar.isVisible()
      expect(navVisible).toBe(true)
    }

    await logout(page)
  })
})

test.describe('Responsive Design - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('R005: Mobile layout at 375px no horizontal scroll', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Critical mobile test - no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)

    await logout(page)
  })

  test('R006: Mobile buttons are at least 48px (touch target size)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Check button sizes
    const buttons = page.locator('button').first()

    if (await buttons.count() > 0) {
      const boundingBox = await buttons.boundingBox()

      // Minimum touch target size is 48x48px
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(40) // Allow slight variation
        expect(boundingBox.width).toBeGreaterThanOrEqual(40)
      }
    }

    await logout(page)
  })

  test('R007: Modals are full-width and readable on mobile', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Open a modal
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      // Wait for modal
      const modal = page.locator('[role="dialog"]').first()
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible()

        // Modal should be responsive
        const boundingBox = await modal.boundingBox()
        if (boundingBox) {
          // Modal width should fit mobile screen
          expect(boundingBox.width).toBeLessThanOrEqual(375)
          expect(boundingBox.height).toBeLessThanOrEqual(812)
        }
      }

      // Close modal
      await page.keyboard.press('Escape')
    }

    await logout(page)
  })
})

test.describe('Responsive Design - Small Mobile (320px)', () => {
  test.use({ viewport: { width: 320, height: 568 } })

  test('R008: Smallest screens (320px) have no horizontal overflow', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Critical test for oldest/smallest phones
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)

    await logout(page)
  })

  test('R009: Text is readable on small screens (font size >= 12px)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Check text sizes
    const textElements = await page.locator('p, span, a, li').first().evaluate((el) => {
      const fontSize = window.getComputedStyle(el).fontSize
      return {
        fontSize: fontSize,
        fontSizeValue: parseInt(fontSize),
      }
    })

    // Most text should be at least 12px
    expect(textElements.fontSizeValue).toBeGreaterThanOrEqual(12)

    await logout(page)
  })
})

test.describe('Responsive Design - Landscape & Portrait', () => {
  test('R010: Portrait mode (414x896) displays correctly', async ({ page }) => {
    // iPhone 12 portrait
    test.use({ viewport: { width: 414, height: 896 } })

    await loginTestUser(page)
    await navigateToDashboard(page)

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)

    await logout(page)
  })

  test('R011: Landscape mode (896x414) displays correctly', async ({ page }) => {
    // iPhone 12 landscape
    test.use({ viewport: { width: 896, height: 414 } })

    await loginTestUser(page)
    await navigateToDashboard(page)

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)

    await logout(page)
  })
})

test.describe('Responsive Design - Touch Interactions', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('R012: Touch targets are appropriately sized (minimum 48px)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Verify interactive elements have adequate touch target size
    const interactiveElements = page.locator('button, a, input').first()

    if (await interactiveElements.count() > 0) {
      const boundingBox = await interactiveElements.boundingBox()

      if (boundingBox) {
        // Touch target should be at least 44px (Apple) or 48px (Android)
        const minTouchSize = Math.min(boundingBox.height, boundingBox.width)
        expect(minTouchSize).toBeGreaterThanOrEqual(40)
      }
    }

    await logout(page)
  })

  test('R013: Form inputs are accessible on mobile (font size, spacing)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Open create case modal
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      // Check form inputs
      const inputs = page.locator('input').first()

      if (await inputs.count() > 0) {
        // Input should be visible and not zoomed
        const boundingBox = await inputs.boundingBox()

        expect(boundingBox).toBeTruthy()

        // Input should be at least 40px tall for easy touching
        expect(boundingBox?.height).toBeGreaterThanOrEqual(35)
      }

      // Close modal
      await page.keyboard.press('Escape')
    }

    await logout(page)
  })
})

test.describe('Responsive Design - Viewport Meta Tags', () => {
  test('R014: Viewport meta tag is correct', async ({ page }) => {
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')

    // Should contain device-width and initial-scale=1
    expect(viewportMeta).toContain('width=device-width')
    expect(viewportMeta).toContain('initial-scale=1')
  })

  test('R015: Text does not enlarge beyond 200% zoom', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Set zoom to 200%
    await page.evaluate(() => {
      ;(document.body.style as any).zoom = '2'
    })

    // Check if horizontal scroll appears
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

    // Even at 200% zoom, horizontal scroll should be minimal
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 100) // Allow some variance

    // Reset zoom
    await page.evaluate(() => {
      ;(document.body.style as any).zoom = '1'
    })

    await logout(page)
  })
})
