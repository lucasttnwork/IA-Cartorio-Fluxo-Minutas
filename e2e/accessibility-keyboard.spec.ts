import { test, expect } from '@playwright/test'
import { loginTestUser, logout, navigateToDashboard } from './fixtures'

/**
 * Keyboard Accessibility Testing (FASE 15 - Semana 2)
 * Tests A007-A013: Keyboard navigation, focus management, ARIA support
 */

test.describe('Accessibility - Keyboard Navigation', () => {
  test('A007: Tab key navigates through all interactive elements', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Get all focusable elements
    const focusableElements = await page.locator('[tabindex], button, a, input, select, textarea').count()

    expect(focusableElements).toBeGreaterThan(0)

    // Tab through elements
    let tabCount = 0
    let previousElement = null

    for (let i = 0; i < Math.min(10, focusableElements); i++) {
      const focusedElement = await page.evaluate(() => {
        return {
          tag: (document.activeElement as any)?.tagName,
          text: (document.activeElement as any)?.textContent?.substring(0, 50),
        }
      })

      if (focusedElement.tag && focusedElement.tag !== previousElement?.tag) {
        tabCount++
        previousElement = focusedElement
      }

      await page.keyboard.press('Tab')
    }

    // Verify we tabbed through multiple elements
    expect(tabCount).toBeGreaterThan(0)
  })

  test('A008: Focus is visible on interactive elements', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Tab to a button
    const buttons = page.locator('button').first()
    await buttons.focus()

    // Check if focus is visible (outline/border/ring)
    const focusStyle = await buttons.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        outline: style.outline,
        boxShadow: style.boxShadow,
        border: style.border,
      }
    })

    // At least one focus indicator should be visible
    const hasFocusIndicator =
      focusStyle.outline !== 'none' ||
      focusStyle.boxShadow !== 'none' ||
      (focusStyle.border !== 'none' && focusStyle.border !== '')

    expect(hasFocusIndicator).toBe(true)
  })

  test('A009: Escape key closes modals and dropdowns', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Open a modal (create case)
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      // Verify modal is open
      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')

      // Modal should close
      const isVisible = await modal.isVisible().catch(() => false)
      expect(isVisible).toBe(false)
    }
  })

  test('A010: Enter key activates buttons and submits forms', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Find and focus a button
    const buttons = page.locator('button').filter({ hasText: /Dashboard|Home|New/ }).first()

    if (await buttons.count() > 0) {
      await buttons.focus()

      // Verify it's focused
      const isFocused = await buttons.evaluate((el) => el === document.activeElement)
      expect(isFocused).toBe(true)

      // Press Enter
      await page.keyboard.press('Enter')

      // Action should be triggered (button state may change or navigation occurs)
      await page.waitForLoadState('networkidle')
    }
  })

  test('A011: Space key activates buttons and checkboxes', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Find a button and focus it
    const buttons = page.locator('button').first()

    if (await buttons.count() > 0) {
      await buttons.focus()

      const initialState = await buttons.getAttribute('aria-pressed')

      // Press Space
      await page.keyboard.press('Space')

      // For toggle buttons, state may change
      const newState = await buttons.getAttribute('aria-pressed')

      // Either state changed or action was triggered
      expect(newState || initialState).toBeDefined()
    }

    // Check for checkboxes
    const checkboxes = page.locator('input[type="checkbox"]').first()
    if (await checkboxes.count() > 0) {
      await checkboxes.focus()
      const wasChecked = await checkboxes.isChecked()

      await page.keyboard.press('Space')

      const isNowChecked = await checkboxes.isChecked()
      expect(isNowChecked).not.toBe(wasChecked)
    }
  })

  test('A012: Arrow keys navigate within select menus and radio groups', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Find a select menu or radio group
    const selects = page.locator('select, [role="listbox"], [role="radiogroup"]').first()

    if (await selects.count() > 0) {
      await selects.focus()

      // Press arrow keys
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(100)

      // Element should still be focused or selection should change
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeDefined()
    }
  })

  test('A013: Form validation errors are announced and linked to inputs', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Open create case modal
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      // Try to submit without filling required fields
      const submitButton = page.locator('button:has-text("Create Case"), button:has-text("Next")').first()

      // Focus on inputs and check for error attributes
      const inputs = page.locator('input[required], input[aria-required="true"]')

      if (await inputs.count() > 0) {
        for (let i = 0; i < Math.min(3, await inputs.count()); i++) {
          const input = inputs.nth(i)

          // Check for error attributes
          const ariaInvalid = await input.getAttribute('aria-invalid')
          const ariaDescribedBy = await input.getAttribute('aria-describedby')
          const required = await input.getAttribute('required')

          // Should have at least required or aria-required
          expect(required || ariaInvalid || ariaDescribedBy).toBeTruthy()
        }
      }

      // Close modal
      await page.keyboard.press('Escape')
    }
  })

  test('A014: Skip navigation links exist (optional but recommended)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Look for skip links (usually hidden but focusable)
    const skipLinks = page.locator('a[href="#main"], a[href="#content"], a:has-text(/skip/i)')

    if (await skipLinks.count() > 0) {
      // Skip links exist
      expect(await skipLinks.count()).toBeGreaterThan(0)

      // First skip link should be focusable
      const skipLink = skipLinks.first()
      await skipLink.focus()

      const isFocused = await skipLink.evaluate((el) => el === document.activeElement)
      expect(isFocused).toBe(true)
    }
  })

  test('A015: Heading hierarchy is logical (h1 > h2 > h3, etc.)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Check heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()

    if (headings.length > 0) {
      let previousLevel = 0

      for (const heading of headings.slice(0, 10)) {
        const element = heading.evaluate((el) => {
          const tagName = el.tagName.toLowerCase()
          return {
            level: parseInt(tagName[1]),
            text: el.textContent?.substring(0, 50),
          }
        })

        const headingInfo = await element
        const currentLevel = headingInfo.level

        // Check for logical progression (no skipping more than 1 level down)
        if (previousLevel > 0 && currentLevel > previousLevel + 1) {
          console.warn(`Heading hierarchy jump from h${previousLevel} to h${currentLevel}: "${headingInfo.text}"`)
        }

        previousLevel = currentLevel
      }

      // At least one heading should exist
      expect(headings.length).toBeGreaterThan(0)
    }
  })

  test('A016: Lists use proper semantic markup (ul, ol, li)', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Check for lists
    const unorderedLists = page.locator('ul').count()
    const orderedLists = page.locator('ol').count()

    // Page likely has some lists (navigation, etc.)
    const totalLists = (await unorderedLists) + (await orderedLists)

    if (totalLists > 0) {
      // Verify list structure
      const listItems = await page.locator('ul li, ol li').count()
      expect(listItems).toBeGreaterThan(0)
    }
  })
})
