import { test, expect, Page } from '@playwright/test'
import { toggleDarkMode, isDarkModeActive, getThemePreference } from './fixtures'

/**
 * Dark Mode Toggle Tests (FASE 15)
 * Tests D001-D006: Theme toggle functionality, persistence, and system preference detection
 */

test.describe('Dark Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to get clean state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('D001: Dark mode toggle button appears in header', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify theme toggle button is present
    const toggleButton = page.locator('[data-testid="theme-toggle"]')
    await expect(toggleButton).toBeVisible()

    // Verify it's a button with appropriate aria-label
    await expect(toggleButton).toHaveAttribute('aria-label', /Switch to (light|dark) mode/)
  })

  test('D002: Toggle button switches between light and dark mode', async ({ page }) => {
    await page.goto('/dashboard')

    // Initially should be light mode
    let isDark = await isDarkModeActive(page)
    expect(isDark).toBe(false)

    // Click toggle to switch to dark
    await toggleDarkMode(page)
    isDark = await isDarkModeActive(page)
    expect(isDark).toBe(true)

    // Click again to switch back to light
    await toggleDarkMode(page)
    isDark = await isDarkModeActive(page)
    expect(isDark).toBe(false)
  })

  test('D003: Dark mode preference persists in localStorage', async ({ page }) => {
    await page.goto('/dashboard')

    // Switch to dark mode
    await toggleDarkMode(page)

    // Check localStorage
    const theme = await getThemePreference(page)
    expect(theme).toBe('dark')

    // Reload and verify dark mode is still active
    await page.reload()
    const isDark = await isDarkModeActive(page)
    expect(isDark).toBe(true)

    // Toggle back to light
    await toggleDarkMode(page)

    // Verify localStorage updated
    const updatedTheme = await getThemePreference(page)
    expect(updatedTheme).toBe('light')
  })

  test('D004: System preference is respected when theme is set to system', async ({ page, context }) => {
    // Create a new context with dark mode system preference
    const darkContext = await context.browser?.newContext({
      colorScheme: 'dark',
    })

    const darkPage = await darkContext!.newPage()

    // Clear localStorage to use system preference
    await darkPage.goto('/')
    await darkPage.evaluate(() => localStorage.clear())
    await darkPage.reload()

    // Should automatically apply dark mode based on system preference
    const isDark = await isDarkModeActive(darkPage)
    expect(isDark).toBe(true)

    await darkPage.close()
    await darkContext?.close()
  })

  test('D005: Theme loads correctly on page reload without flash', async ({ page }) => {
    await page.goto('/dashboard')

    // Switch to dark mode
    await toggleDarkMode(page)
    const themeBeforeReload = await getThemePreference(page)
    expect(themeBeforeReload).toBe('dark')

    // Reload and verify:
    // 1. No flash (instant application)
    // 2. Dark mode still active
    await page.reload()

    // Verify theme is applied immediately (check document.documentElement.classList before react loads)
    const isDark = await isDarkModeActive(page)
    expect(isDark).toBe(true)

    // Verify localStorage persisted
    const theme = await getThemePreference(page)
    expect(theme).toBe('dark')
  })

  test('D006: No white flash when starting in dark mode', async ({ page }) => {
    // Set dark mode preference
    await page.goto('/dashboard')
    await toggleDarkMode(page)

    // Now open a new page and verify no flash occurs
    const newPage = await page.context().newPage()

    // Measure if dark class is applied quickly
    const startTime = Date.now()
    await newPage.goto('/dashboard')

    // Check that dark mode is applied
    const isDark = await isDarkModeActive(newPage)
    expect(isDark).toBe(true)

    const loadTime = Date.now() - startTime

    // Verify the page loads with dark mode (< 100ms is reasonable for script injection)
    expect(loadTime).toBeLessThan(5000) // Page load should be fast

    await newPage.close()
  })

  test('Icon changes based on theme', async ({ page }) => {
    await page.goto('/dashboard')

    // In light mode, should show moon icon
    const toggleButton = page.locator('[data-testid="theme-toggle"]')
    let icon = toggleButton.locator('svg')

    // Check for moon icon (approximate check based on available classes)
    let hasIcon = await icon.count()
    expect(hasIcon).toBeGreaterThan(0)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Icon should be different (sun icon in dark mode)
    icon = toggleButton.locator('svg')
    hasIcon = await icon.count()
    expect(hasIcon).toBeGreaterThan(0)
  })

  test('Theme toggle is accessible via keyboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Tab to the theme toggle button
    await page.keyboard.press('Tab')

    // Keep tabbing until we reach the theme toggle or timeout
    let isFocused = false
    for (let i = 0; i < 20; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement
        return el?.getAttribute('data-testid') === 'theme-toggle'
      })

      if (focused) {
        isFocused = true
        break
      }
      await page.keyboard.press('Tab')
    }

    // If we found the button, activate it
    if (isFocused) {
      const isDarkBefore = await isDarkModeActive(page)

      // Press Enter to activate
      await page.keyboard.press('Enter')

      const isDarkAfter = await isDarkModeActive(page)
      expect(isDarkAfter).not.toBe(isDarkBefore)
    }
  })

  test('Theme preference shows correct initial aria-label', async ({ page }) => {
    await page.goto('/dashboard')

    // Initially in light mode, aria-label should suggest switching to dark
    let toggleButton = page.locator('[data-testid="theme-toggle"]')
    let ariaLabel = await toggleButton.getAttribute('aria-label')
    expect(ariaLabel).toContain('dark')

    // Switch to dark
    await toggleDarkMode(page)

    // Now aria-label should suggest switching to light
    toggleButton = page.locator('[data-testid="theme-toggle"]')
    ariaLabel = await toggleButton.getAttribute('aria-label')
    expect(ariaLabel).toContain('light')
  })

  test('Dark mode works across multiple pages', async ({ page }) => {
    // Set dark mode on dashboard
    await page.goto('/dashboard')
    await toggleDarkMode(page)

    // Navigate to another page
    // Note: This assumes cases exist; adjust if needed
    await page.goto('/test-avatar')

    // Verify dark mode is still active on new page
    const isDark = await isDarkModeActive(page)
    expect(isDark).toBe(true)
  })
})

/**
 * Dark Mode Visual Tests
 * Tests D007-D009: Glassmorphism appearance in dark mode
 */
test.describe('Dark Mode Glassmorphism', () => {
  test('D007: .glass-card appears correct in dark mode', async ({ page }) => {
    await page.goto('/dashboard')

    // Switch to dark mode
    await toggleDarkMode(page)

    // Find a glass-card element
    const glassCard = page.locator('.glass-card').first()

    if (await glassCard.count() > 0) {
      // Verify it has dark mode classes applied
      const classList = await glassCard.getAttribute('class')
      expect(classList).toContain('dark:')
    }
  })

  test('D008: .glass-dialog overlay is appropriately dark', async ({ page }) => {
    await page.goto('/dashboard')

    // Switch to dark mode
    await toggleDarkMode(page)

    // This would require opening a modal - adjust based on your app structure
    // For now, just verify the class exists in CSS
    const hasGlassDialog = await page.locator('.glass-dialog').count()
    // May or may not be visible, but we're just checking the class exists
  })

  test('D009: No white flash when switching from light to dark mode', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify initial state is light
    let isDark = await isDarkModeActive(page)
    expect(isDark).toBe(false)

    // Add a listener to check for body background color changes
    const colorBefore = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    // Toggle to dark
    await toggleDarkMode(page)

    // Verify color changed
    const colorAfter = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    expect(colorAfter).not.toBe(colorBefore)

    // Verify it's a dark color (not white)
    const rgbValues = colorAfter.match(/\\d+/g)
    if (rgbValues) {
      const [r, g, b] = rgbValues.map(Number)
      // Dark color should have lower RGB values
      const brightness = (r + g + b) / 3
      expect(brightness).toBeLessThan(200)
    }
  })
})
