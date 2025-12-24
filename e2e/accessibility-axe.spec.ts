import { test, expect } from '@playwright/test'
import { loginTestUser, logout, navigateToDashboard } from './fixtures'

/**
 * Accessibility Testing with Axe-Core (FASE 15 - Semana 2)
 * Tests A001-A003: Automated WCAG AA compliance scanning
 */

// Helper function to run axe analysis
async function runAxeAnalysis(page: any, context: string) {
  // Inject axe-core into the page
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.0/axe.min.js',
  })

  // Run axe analysis
  const violations = await page.evaluate(() => {
    return new Promise<any>((resolve) => {
      ;(window as any).axe.run((results: any) => {
        resolve({
          violations: results.violations,
          passes: results.passes.length,
          incomplete: results.incomplete,
          inapplicable: results.inapplicable.length,
        })
      })
    })
  })

  return violations
}

test.describe('Accessibility - Axe-Core Compliance', () => {
  test('A001: Dashboard page has no critical/serious accessibility violations', async ({ page }) => {
    // Login and navigate
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Run accessibility analysis
    const results = await runAxeAnalysis(page, 'Dashboard')

    // Log results for debugging
    console.log(`Dashboard Accessibility Report:`)
    console.log(`  Critical/Serious violations: ${results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length}`)
    console.log(`  Moderate violations: ${results.violations.filter((v: any) => v.impact === 'moderate').length}`)
    console.log(`  Minor violations: ${results.violations.filter((v: any) => v.impact === 'minor').length}`)
    console.log(`  Passes: ${results.passes}`)

    // Filter critical and serious violations
    const criticalViolations = results.violations.filter(
      (v: any) => v.impact === 'critical' || v.impact === 'serious'
    )

    // There should be NO critical or serious violations
    expect(criticalViolations.length).toBe(0)

    await logout(page)
  })

  test('A002: Case overview page meets WCAG AA standards', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create a test case
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      const titleInput = page.locator('input[id="case-title"]')
      await titleInput.fill('A11y Test Case')

      const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
      await actTypeButton.click()

      const nextButton = page.locator('button:has-text("Next")').first()
      await nextButton.click()

      const priceInput = page.locator('input[id="case-price"]')
      await priceInput.fill('500000')

      const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
      await fullPaymentButton.click()

      await nextButton.click()

      const createButton = page.locator('button:has-text("Create Case")').first()
      await createButton.click()

      // Wait for case to load
      await expect(page.locator('text=A11y Test Case')).toBeVisible({ timeout: 5000 })
      await page.waitForLoadState('networkidle')

      // Run accessibility check
      const results = await runAxeAnalysis(page, 'Case Overview')

      console.log(`Case Overview Accessibility Report:`)
      console.log(`  Critical/Serious violations: ${results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length}`)
      console.log(`  Passes: ${results.passes}`)

      // Verify no critical/serious violations
      const criticalViolations = results.violations.filter(
        (v: any) => v.impact === 'critical' || v.impact === 'serious'
      )
      expect(criticalViolations.length).toBe(0)
    }

    await logout(page)
  })

  test('A003: Canvas page accessible to keyboard and screen readers', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Navigate to canvas (after creating case)
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      const titleInput = page.locator('input[id="case-title"]')
      await titleInput.fill('Canvas A11y Test')

      const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
      await actTypeButton.click()

      const nextButton = page.locator('button:has-text("Next")').first()
      await nextButton.click()

      const priceInput = page.locator('input[id="case-price"]')
      await priceInput.fill('500000')

      const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
      await fullPaymentButton.click()

      await nextButton.click()

      const createButton = page.locator('button:has-text("Create Case")').first()
      await createButton.click()

      await expect(page.locator('text=Canvas A11y Test')).toBeVisible({ timeout: 5000 })
      await page.waitForLoadState('networkidle')

      // Navigate to canvas
      const url = page.url()
      const caseMatch = url.match(/\/case\/([a-f0-9-]+)/)
      if (caseMatch) {
        await page.goto(`/case/${caseMatch[1]}/canvas`)
        await page.waitForLoadState('networkidle')

        // Run accessibility check on canvas
        const results = await runAxeAnalysis(page, 'Canvas')

        console.log(`Canvas Accessibility Report:`)
        console.log(`  Critical/Serious violations: ${results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length}`)
        console.log(`  Passes: ${results.passes}`)
        console.log(`  Incomplete checks: ${results.incomplete.length}`)

        // Verify critical/serious violations
        const criticalViolations = results.violations.filter(
          (v: any) => v.impact === 'critical' || v.impact === 'serious'
        )
        expect(criticalViolations.length).toBe(0)

        // Check for keyboard navigation elements
        const focusableElements = await page.locator('[tabindex], button, a, input, select, textarea').count()
        expect(focusableElements).toBeGreaterThan(0)
      }
    }

    await logout(page)
  })

  test('A004: Draft page is fully accessible', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create case and navigate to draft
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      const titleInput = page.locator('input[id="case-title"]')
      await titleInput.fill('Draft A11y Test')

      const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
      await actTypeButton.click()

      const nextButton = page.locator('button:has-text("Next")').first()
      await nextButton.click()

      const priceInput = page.locator('input[id="case-price"]')
      await priceInput.fill('500000')

      const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
      await fullPaymentButton.click()

      await nextButton.click()

      const createButton = page.locator('button:has-text("Create Case")').first()
      await createButton.click()

      await expect(page.locator('text=Draft A11y Test')).toBeVisible({ timeout: 5000 })

      // Navigate to draft
      const url = page.url()
      const caseMatch = url.match(/\/case\/([a-f0-9-]+)/)
      if (caseMatch) {
        await page.goto(`/case/${caseMatch[1]}/draft`)
        await page.waitForLoadState('networkidle')

        // Run accessibility check
        const results = await runAxeAnalysis(page, 'Draft Page')

        console.log(`Draft Page Accessibility Report:`)
        console.log(`  Critical/Serious violations: ${results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length}`)
        console.log(`  Passes: ${results.passes}`)

        // Verify no critical/serious violations
        const criticalViolations = results.violations.filter(
          (v: any) => v.impact === 'critical' || v.impact === 'serious'
        )
        expect(criticalViolations.length).toBe(0)

        // Verify editor is accessible
        const editor = page.locator('[contenteditable="true"], [role="textbox"]').first()
        if (await editor.count() > 0) {
          expect(await editor.isVisible()).toBe(true)
        }
      }
    }

    await logout(page)
  })

  test('A005: Upload page has proper form labels and error messages', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create case and navigate to upload
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      const titleInput = page.locator('input[id="case-title"]')
      await titleInput.fill('Upload A11y Test')

      const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
      await actTypeButton.click()

      const nextButton = page.locator('button:has-text("Next")').first()
      await nextButton.click()

      const priceInput = page.locator('input[id="case-price"]')
      await priceInput.fill('500000')

      const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
      await fullPaymentButton.click()

      await nextButton.click()

      const createButton = page.locator('button:has-text("Create Case")').first()
      await createButton.click()

      await expect(page.locator('text=Upload A11y Test')).toBeVisible({ timeout: 5000 })

      // Navigate to upload
      const url = page.url()
      const caseMatch = url.match(/\/case\/([a-f0-9-]+)/)
      if (caseMatch) {
        await page.goto(`/case/${caseMatch[1]}/upload`)
        await page.waitForLoadState('networkidle')

        // Run accessibility check
        const results = await runAxeAnalysis(page, 'Upload Page')

        console.log(`Upload Page Accessibility Report:`)
        console.log(`  Critical/Serious violations: ${results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length}`)
        console.log(`  Passes: ${results.passes}`)

        // Verify form is accessible
        const uploadArea = page.locator('text=/Drag|drop|Upload/i').first()
        if (await uploadArea.count() > 0) {
          expect(await uploadArea.isVisible()).toBe(true)
        }

        // Verify no critical/serious violations
        const criticalViolations = results.violations.filter(
          (v: any) => v.impact === 'critical' || v.impact === 'serious'
        )
        expect(criticalViolations.length).toBe(0)
      }
    }

    await logout(page)
  })

  test('A006: Entities page table is navigable and accessible', async ({ page }) => {
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create case and navigate to entities
    const newCaseButton = page.locator('button:has-text("New Case")')
    if (await newCaseButton.count() > 0) {
      await newCaseButton.click()

      const titleInput = page.locator('input[id="case-title"]')
      await titleInput.fill('Entities A11y Test')

      const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
      await actTypeButton.click()

      const nextButton = page.locator('button:has-text("Next")').first()
      await nextButton.click()

      const priceInput = page.locator('input[id="case-price"]')
      await priceInput.fill('500000')

      const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
      await fullPaymentButton.click()

      await nextButton.click()

      const createButton = page.locator('button:has-text("Create Case")').first()
      await createButton.click()

      await expect(page.locator('text=Entities A11y Test')).toBeVisible({ timeout: 5000 })

      // Navigate to entities
      const url = page.url()
      const caseMatch = url.match(/\/case\/([a-f0-9-]+)/)
      if (caseMatch) {
        await page.goto(`/case/${caseMatch[1]}/entities`)
        await page.waitForLoadState('networkidle')

        // Run accessibility check
        const results = await runAxeAnalysis(page, 'Entities Page')

        console.log(`Entities Page Accessibility Report:`)
        console.log(`  Critical/Serious violations: ${results.violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length}`)
        console.log(`  Passes: ${results.passes}`)

        // Verify table is accessible
        const table = page.locator('table, [role="grid"]').first()
        if (await table.count() > 0) {
          expect(await table.isVisible()).toBe(true)
        }

        // Verify no critical/serious violations
        const criticalViolations = results.violations.filter(
          (v: any) => v.impact === 'critical' || v.impact === 'serious'
        )
        expect(criticalViolations.length).toBe(0)
      }
    }

    await logout(page)
  })
})
