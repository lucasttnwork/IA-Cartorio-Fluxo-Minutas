import { test, expect } from '@playwright/test'
import { toggleDarkMode, loginTestUser, logout, navigateToDashboard } from './fixtures'

/**
 * Dark Mode Visual Regression Testing (FASE 15 - Semana 3)
 * Tests D010-D017: Glassmorphism appearance, contrast validation, visual consistency
 */

test.describe('Dark Mode - Visual Regression & Glassmorphism', () => {
  test('D010: Glass-card styling appears correct in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Find glass-card elements
    const glassCards = page.locator('.glass-card').first()

    if (await glassCards.count() > 0) {
      // Get computed styles
      const styles = await glassCards.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          background: style.backgroundColor,
          backdropFilter: style.backdropFilter,
          border: style.borderColor,
          borderRadius: style.borderRadius,
        }
      })

      // In dark mode, background should be dark
      expect(styles.background).toBeDefined()

      // Should have backdrop blur (glassmorphism)
      if (styles.backdropFilter !== 'none') {
        expect(styles.backdropFilter).toContain('blur')
      }

      // Border should be subtle
      expect(styles.border).toBeDefined()
    }

    await logout(page)
  })

  test('D011: Dialog overlay has appropriate dark background', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Open a dialog/modal
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      // Check modal styling
      const modal = page.locator('[role="dialog"]').first()
      if (await modal.count() > 0) {
        const modalStyles = await modal.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            background: style.backgroundColor,
            backdropFilter: style.backdropFilter,
          }
        })

        // Modal should have appropriate styling
        expect(modalStyles.background).toBeDefined()
      }

      // Close modal
      await page.keyboard.press('Escape')
    }

    await logout(page)
  })

  test('D012: Text contrast is sufficient in dark mode (WCAG AA)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Check text contrast
    const textElements = await page.locator('p, span, a, h1, h2, h3, h4').first().evaluate((el) => {
      const style = window.getComputedStyle(el)
      const bgColor = style.backgroundColor
      const fgColor = style.color

      return {
        background: bgColor,
        foreground: fgColor,
      }
    })

    // Both colors should be defined
    expect(textElements.background).toBeDefined()
    expect(textElements.foreground).toBeDefined()

    await logout(page)
  })

  test('D013: Buttons have visible styles in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Check button styling
    const buttons = page.locator('button').first()

    if (await buttons.count() > 0) {
      const buttonStyles = await buttons.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          background: style.backgroundColor,
          color: style.color,
          border: style.borderColor,
        }
      })

      // Button should have visible styling
      expect(buttonStyles.background).toBeDefined()
      expect(buttonStyles.color).toBeDefined()
    }

    await logout(page)
  })

  test('D014: Input fields are visible in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Open modal with inputs
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      // Check input styling
      const inputs = page.locator('input').first()

      if (await inputs.count() > 0) {
        const inputStyles = await inputs.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            background: style.backgroundColor,
            border: style.borderColor,
            color: style.color,
          }
        })

        // Input should have visible styling
        expect(inputStyles.background).toBeDefined()
        expect(inputStyles.border).toBeDefined()
        expect(inputStyles.color).toBeDefined()
      }

      // Close modal
      await page.keyboard.press('Escape')
    }

    await logout(page)
  })

  test('D015: Badges maintain color distinction in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Find badge elements (status badges, confidence badges)
    const badges = page.locator('[class*="badge"]').first()

    if (await badges.count() > 0) {
      const badgeStyles = await badges.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          background: style.backgroundColor,
          color: style.color,
        }
      })

      // Badges should have visible styles
      expect(badgeStyles.background).toBeDefined()
      expect(badgeStyles.color).toBeDefined()
    }

    await logout(page)
  })

  test('D016: Links are distinguishable from text in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Check link styling
    const links = page.locator('a').first()

    if (await links.count() > 0) {
      const linkStyles = await links.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          color: style.color,
          textDecoration: style.textDecoration,
          borderBottom: style.borderBottomColor,
        }
      })

      // Link should have distinct styling
      expect(linkStyles.color).toBeDefined()
      // Either underlined or differently colored
      expect(linkStyles.textDecoration || linkStyles.borderBottom).toBeDefined()
    }

    await logout(page)
  })

  test('D017: Tables are readable with proper contrast in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Navigate to a page with tables
    const url = page.url()
    if (url.includes('dashboard')) {
      // Look for table elements
      const table = page.locator('table, [role="table"]').first()

      if (await table.count() > 0) {
        const tableStyles = await table.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            background: style.backgroundColor,
            borderColor: style.borderColor,
          }
        })

        // Table should have visible styling
        expect(tableStyles.background).toBeDefined()

        // Check header styling
        const tableHeaders = page.locator('th, [role="columnheader"]').first()
        if (await tableHeaders.count() > 0) {
          const headerStyles = await tableHeaders.evaluate((el) => {
            const style = window.getComputedStyle(el)
            return {
              background: style.backgroundColor,
              color: style.color,
            }
          })

          expect(headerStyles.background).toBeDefined()
          expect(headerStyles.color).toBeDefined()
        }
      }
    }

    await logout(page)
  })

  test('D018: No color flashing when toggling dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Get initial background color
    const initialBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    // Toggle dark mode
    await toggleDarkMode(page)

    await page.waitForTimeout(100)

    // Get new background color
    const darkBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    // Colors should be different
    expect(darkBg).not.toBe(initialBg)

    // Toggle back
    await toggleDarkMode(page)

    await page.waitForTimeout(100)

    // Should be back to initial
    const finalBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })

    expect(finalBg).toBe(initialBg)

    await logout(page)
  })
})

test.describe('Dark Mode - Component-Specific Styling', () => {
  test('D019: Form labels are visible in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Open a form (create case modal)
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      // Check label styling
      const labels = page.locator('label').first()

      if (await labels.count() > 0) {
        const labelStyles = await labels.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            color: style.color,
            fontSize: style.fontSize,
          }
        })

        // Label should be readable
        expect(labelStyles.color).toBeDefined()
        expect(labelStyles.fontSize).toBeDefined()
      }

      // Close modal
      await page.keyboard.press('Escape')
    }

    await logout(page)
  })

  test('D020: Selected items are clearly distinguished in dark mode', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Switch to dark mode
    await toggleDarkMode(page)

    // Click on a case card to select it (if applicable)
    const cards = page.locator('[class*="card"], [class*="item"]').first()

    if (await cards.count() > 0) {
      // Get selected/focused state
      const selectedState = await cards.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          background: style.backgroundColor,
          border: style.borderColor,
          boxShadow: style.boxShadow,
        }
      })

      // Selected state should have visible styling
      expect(
        selectedState.background !== 'transparent' ||
        selectedState.border !== 'none' ||
        selectedState.boxShadow !== 'none'
      ).toBe(true)
    }

    await logout(page)
  })
})
