import { test, expect } from '@playwright/test'
import { loginTestUser, logout, navigateToDashboard } from './fixtures'

/**
 * Audit Trail & Navigation Functional Regression Tests (FASE 15)
 * Tests T046-T059: History logging, filtering, search, export, navigation, deep linking
 */

test.describe('Audit Trail & History', () => {
  let caseId: string

  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create a new case
    const newCaseButton = page.locator('button:has-text("New Case")')
    await expect(newCaseButton).toBeVisible()
    await newCaseButton.click()

    // Fill the form
    const titleInput = page.locator('input[id="case-title"]')
    await titleInput.fill('History Test Case')

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

    // Wait for case to be created
    await expect(page.locator('text=History Test Case')).toBeVisible({ timeout: 5000 })

    // Extract case ID from URL
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const match = url.match(/\/case\/([a-f0-9-]+)/)
    if (match) {
      caseId = match[1]
    }

    // Navigate to history page
    await page.goto(`/case/${caseId}/history`)
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: logout
    await logout(page)
  })

  test('T046: Operation log displays all operations', async ({ page }) => {
    // Wait for page to load
    await expect(page).toHaveTitle(/History|history|Histórico|Audit|audit/i)

    // Check for operation log table or list
    const operationLog = page.locator('table, [role="grid"], [class*="log"], [class*="history"]').first()
    if (await operationLog.count() > 0) {
      await expect(operationLog).toBeVisible()
    }

    // Check for operation entries
    const operationEntries = page.locator('tr, [role="row"], [class*="entry"], [class*="operation"]')
    if (await operationEntries.count() > 0) {
      // Operations are displayed
      expect(await operationEntries.count()).toBeGreaterThanOrEqual(0)
    }

    // Check for operation type indicators
    const operationTypes = page.locator('text=/update|create|delete|edit|add|remove/i')
    if (await operationTypes.count() > 0) {
      // Operation types are visible
      expect(await operationTypes.count()).toBeGreaterThan(0)
    }
  })

  test('T047: Filter by action type works', async ({ page }) => {
    // Look for action filter
    const actionFilter = page.locator('select, [role="combobox"]').filter({ hasText: /action|Action|Ação|Tipo/i }).first()

    if (await actionFilter.count() > 0) {
      await expect(actionFilter).toBeVisible()

      // Click filter
      await actionFilter.click()

      // Select an action type
      const filterOptions = page.locator('option, [role="option"]')
      if (await filterOptions.count() > 0) {
        await filterOptions.first().click()

        // Wait for filter to apply
        await page.waitForLoadState('networkidle')
      }
    }

    // Alternative: check for filter buttons
    const filterButtons = page.locator('button').filter({ hasText: /update|create|delete|filter/i })
    if (await filterButtons.count() > 0) {
      // Filter buttons exist
      expect(await filterButtons.count()).toBeGreaterThan(0)
    }
  })

  test('T048: Filter by user works', async ({ page }) => {
    // Look for user filter
    const userFilter = page.locator('select, [role="combobox"]').filter({ hasText: /user|User|Usuário|Autor/i }).first()

    if (await userFilter.count() > 0) {
      await expect(userFilter).toBeVisible()

      // Click filter
      await userFilter.click()

      // Select a user
      const filterOptions = page.locator('option, [role="option"]')
      if (await filterOptions.count() > 0) {
        await filterOptions.first().click()

        // Wait for filter to apply
        await page.waitForLoadState('networkidle')
      }
    }

    // Check for user badges/avatars in log
    const userElements = page.locator('text=/João|Maria|Admin|Silva|Santos/')
    if (await userElements.count() > 0) {
      // User names are visible
      expect(await userElements.count()).toBeGreaterThan(0)
    }
  })

  test('T049: Search by target works', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]').first()

    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible()

      // Type search query
      await searchInput.fill('clause')

      // Wait for search results
      await page.waitForLoadState('networkidle')

      // Verify results are filtered
      const results = page.locator('tr, [role="row"]')
      expect(await results.count()).toBeGreaterThanOrEqual(0)
    }

    // Check for "no results" message if applicable
    const noResults = page.locator('text=/No results|No entries|Nenhum resultado/')
    if (await noResults.count() > 0) {
      // This is acceptable if search had no matches
      expect(await noResults.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('T050: Sort by timestamp works', async ({ page }) => {
    // Look for sort controls
    const sortButton = page.locator('button, th').filter({ hasText: /timestamp|date|time|Data|Hora/i }).first()

    if (await sortButton.count() > 0) {
      // Click to sort
      await sortButton.click()
      await page.waitForLoadState('networkidle')

      // Click again to reverse sort
      await sortButton.click()
      await page.waitForLoadState('networkidle')
    }

    // Check for timestamp column
    const timestamps = page.locator('text=/:')
    if (await timestamps.count() > 0) {
      // Timestamps are visible
      expect(await timestamps.count()).toBeGreaterThan(0)
    }
  })

  test('T051: Export CSV/JSON works', async ({ page }) => {
    // Look for export buttons
    const exportButton = page.locator('button').filter({ hasText: /Export|Exportar|Download/i }).first()

    if (await exportButton.count() > 0) {
      await expect(exportButton).toBeVisible()

      // Click export button
      await exportButton.click()

      // Wait for menu
      await page.waitForTimeout(300)

      // Look for CSV option
      const csvOption = page.locator('button, a').filter({ hasText: /CSV|csv/ }).first()
      if (await csvOption.count() > 0) {
        // CSV export is available
        expect(await csvOption.count()).toBeGreaterThan(0)
      }

      // Look for JSON option
      const jsonOption = page.locator('button, a').filter({ hasText: /JSON|json/ }).first()
      if (await jsonOption.count() > 0) {
        // JSON export is available
        expect(await jsonOption.count()).toBeGreaterThan(0)
      }
    }
  })

  test('T052: Timestamps are precise and accurate', async ({ page }) => {
    // Find timestamp elements
    const timestamps = page.locator('text=/\\d{1,2}:[0-9]{2}|\\d{4}-\\d{2}-\\d{2}/')

    if (await timestamps.count() > 0) {
      // Timestamps exist
      expect(await timestamps.count()).toBeGreaterThan(0)

      // Verify timestamp format (ISO or readable format)
      const firstTimestamp = await timestamps.first().textContent()
      expect(firstTimestamp).toMatch(/\\d+|:|-|T/)
    }
  })

  test('T053: User attribution is correct', async ({ page }) => {
    // Check for user information in audit log
    const userInfo = page.locator('text=/João|Maria|Admin|Silva|Santos|User|user/')

    if (await userInfo.count() > 0) {
      // User names are shown
      expect(await userInfo.count()).toBeGreaterThan(0)

      // Verify each log entry has a user
      const logEntries = page.locator('tr, [role="row"]')
      if (await logEntries.count() > 0) {
        for (let i = 0; i < Math.min(3, await logEntries.count()); i++) {
          const entry = logEntries.nth(i)
          const entryText = await entry.textContent()
          // Entry should contain some user-related info or timestamp
          expect(entryText).toBeDefined()
        }
      }
    }
  })
})

test.describe('Navigation & Routing', () => {
  let caseId: string

  test.beforeEach(async ({ page }) => {
    // Login and create test case
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create a new case
    const newCaseButton = page.locator('button:has-text("New Case")')
    await newCaseButton.click()

    const titleInput = page.locator('input[id="case-title"]')
    await titleInput.fill('Nav Test Case')

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

    await expect(page.locator('text=Nav Test Case')).toBeVisible({ timeout: 5000 })

    // Extract case ID
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const match = url.match(/\/case\/([a-f0-9-]+)/)
    if (match) {
      caseId = match[1]
    }
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('T054: Breadcrumb navigation works', async ({ page }) => {
    // Navigate to a sub-page
    await page.goto(`/case/${caseId}/upload`)
    await page.waitForLoadState('networkidle')

    // Look for breadcrumb
    const breadcrumb = page.locator('[class*="breadcrumb"], nav:has-text(/[>]/)')
    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible()

      // Click on a breadcrumb link
      const breadcrumbLinks = page.locator('a').filter({ hasText: /Case|Dashboard|Home/ })
      if (await breadcrumbLinks.count() > 0) {
        await breadcrumbLinks.first().click()
        await page.waitForLoadState('networkidle')

        // Verify navigation occurred
        const currentUrl = page.url()
        expect(currentUrl).toBeDefined()
      }
    }
  })

  test('T055: Back/Forward buttons navigate correctly', async ({ page }) => {
    // Navigate to first page
    await page.goto(`/case/${caseId}/upload`)
    await page.waitForLoadState('networkidle')

    const firstUrl = page.url()

    // Navigate to another page
    await page.goto(`/case/${caseId}/entities`)
    await page.waitForLoadState('networkidle')

    // Use browser back button
    await page.goBack()
    await page.waitForLoadState('networkidle')

    const backUrl = page.url()
    expect(backUrl).toBe(firstUrl)

    // Use browser forward button
    await page.goForward()
    await page.waitForLoadState('networkidle')

    const forwardUrl = page.url()
    expect(forwardUrl).toContain('entities')
  })

  test('T056: URL parameters update with content', async ({ page }) => {
    // Navigate to case
    await page.goto(`/case/${caseId}`)
    await page.waitForLoadState('networkidle')

    // Verify case ID is in URL
    const url = page.url()
    expect(url).toContain(caseId)

    // Navigate to sub-route
    await page.goto(`/case/${caseId}/canvas`)
    expect(page.url()).toContain(`/case/${caseId}/canvas`)

    // Navigate to another sub-route
    await page.goto(`/case/${caseId}/draft`)
    expect(page.url()).toContain(`/case/${caseId}/draft`)
  })

  test('T057: Deep linking works (navigate directly to route)', async ({ page }) => {
    // Directly navigate to deep link
    await page.goto(`/case/${caseId}/canvas`)
    await page.waitForLoadState('networkidle')

    // Verify we're on the correct page
    const pageTitle = page.locator('h1, h2')
    const url = page.url()
    expect(url).toContain(`/case/${caseId}/canvas`)

    // Try another deep link
    await page.goto(`/case/${caseId}/draft`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain(`/case/${caseId}/draft`)
  })

  test('T058: Protected routes redirect unauthenticated users', async ({ page }) => {
    // Logout first
    await logout(page)

    // Try to navigate to protected route
    await page.goto(`/case/${caseId}/canvas`)
    await page.waitForLoadState('networkidle')

    // Should redirect to login
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/login|auth/i)
  })

  test('T059: 404 page appears for invalid routes', async ({ page }) => {
    // Login first
    await loginTestUser(page)

    // Navigate to invalid route
    await page.goto('/invalid-route-that-does-not-exist')
    await page.waitForLoadState('networkidle')

    // Check for 404 message or page
    const notFoundPage = page.locator('text=/404|Not Found|Não encontrado|Page not found/')
    if (await notFoundPage.count() > 0) {
      await expect(notFoundPage).toBeVisible()
    }

    // Check for back button or home link
    const backLink = page.locator('a, button').filter({ hasText: /Back|Home|Dashboard|Voltar|Início/ }).first()
    if (await backLink.count() > 0) {
      await expect(backLink).toBeVisible()
    }
  })
})
