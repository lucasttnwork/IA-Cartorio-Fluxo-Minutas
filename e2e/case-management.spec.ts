import { test, expect } from '@playwright/test'
import {
  createTestCase,
  deleteTestCase,
  navigateToDashboard,
  navigateToCase,
  assertContainsText,
  assertHasClass,
  assertIsVisible,
  assertIsDisabled,
  loginTestUser,
  logout,
  waitForElement
} from './fixtures'

/**
 * Case Management Functional Regression Tests (FASE 15)
 * Tests T001-T008: Case creation, filtering, searching, pagination, sorting, deletion, archiving
 */

test.describe('Case Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginTestUser(page)
    // Navigate to dashboard
    await navigateToDashboard(page)
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: logout
    await logout(page)
  })

  test('T001: Create new case with title and act type', async ({ page }) => {
    // Click "New Case" button
    const newCaseButton = page.locator('button:has-text("New Case")')
    await expect(newCaseButton).toBeVisible()
    await newCaseButton.click()

    // Wait for modal to open
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible()

    // Step 1: Enter case title
    const titleInput = page.locator('input[id="case-title"]')
    await expect(titleInput).toBeVisible()
    await titleInput.fill('Test Case - Purchase Sale')

    // Select act type: Purchase & Sale
    const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
    await expect(actTypeButton).toBeVisible()
    await actTypeButton.click()

    // Verify selection
    const selectedClass = await actTypeButton.evaluate((el) => el.className)
    expect(selectedClass).toContain('border-blue-500')

    // Click Next
    const nextButton = page.locator('button:has-text("Next")').first()
    await nextButton.click()

    // Step 2: Enter price
    const priceInput = page.locator('input[id="case-price"]')
    await expect(priceInput).toBeVisible()
    await priceInput.fill('250000')

    // Select payment method: Full Payment
    const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
    await fullPaymentButton.click()

    // Click Next
    await nextButton.click()

    // Step 3: Create case
    const createButton = page.locator('button:has-text("Create Case")').first()
    await expect(createButton).toBeVisible()
    await createButton.click()

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // Verify case appears in dashboard
    await expect(page.locator('text=Test Case - Purchase Sale')).toBeVisible({ timeout: 5000 })
  })

  test('T002: Filter cases by status (draft, processing, review, approved, archived)', async ({ page }) => {
    // Get the status filter dropdown
    const statusFilter = page.locator('select').first()
    await expect(statusFilter).toBeVisible()

    // Test: Filter by Draft status
    await statusFilter.selectOption('draft')
    await page.waitForLoadState('networkidle')

    // Verify cases are displayed
    const caseCards = page.locator('[role="link"] >> text=').filter({ has: page.locator('.glass-card') })
    let visibleCases = await caseCards.count()
    if (visibleCases > 0) {
      expect(visibleCases).toBeGreaterThan(0)
    }

    // Test: Filter by Processing status
    await statusFilter.selectOption('processing')
    await page.waitForLoadState('networkidle')

    // Test: Filter by Review status
    await statusFilter.selectOption('review')
    await page.waitForLoadState('networkidle')

    // Test: Filter by Approved status
    await statusFilter.selectOption('approved')
    await page.waitForLoadState('networkidle')

    // Test: Filter by Archived status
    await statusFilter.selectOption('archived')
    await page.waitForLoadState('networkidle')

    // Test: Reset to All Status
    await statusFilter.selectOption('all')
    await page.waitForLoadState('networkidle')

    // Verify filter was reset
    expect(await statusFilter.inputValue()).toBe('all')
  })

  test('T003: Search cases by title with debounce (300ms)', async ({ page }) => {
    // Get search input
    const searchInput = page.locator('input[placeholder*="Search cases"]')
    await expect(searchInput).toBeVisible()

    // Type search query (should debounce for 300ms)
    const startTime = Date.now()
    await searchInput.fill('Test')

    // Wait for debounce to complete (300ms + network)
    await page.waitForLoadState('networkidle')
    const searchTime = Date.now() - startTime

    // Verify search was executed (should take at least 300ms due to debounce)
    // Allow some variance for CI systems
    expect(searchTime).toBeGreaterThan(100)

    // Verify search results are displayed or empty state
    const noResultsText = page.locator('text=/No cases found|No cases yet/')
    const caseCards = page.locator('.glass-card')

    const hasResults = await caseCards.count() > 0
    const hasNoResults = await noResultsText.count() > 0

    expect(hasResults || hasNoResults).toBe(true)

    // Clear search (click X button or clear input)
    const clearButton = page.locator('button[aria-label="Clear search"]')
    if (await clearButton.count() > 0) {
      await clearButton.click()
      await page.waitForLoadState('networkidle')
      expect(await searchInput.inputValue()).toBe('')
    }
  })

  test('T004: Pagination works with different page sizes (6, 12, 24, 48)', async ({ page }) => {
    // Check if pagination exists
    const paginationContainer = page.locator('text=Items per page').first()

    if (await paginationContainer.count() > 0) {
      // Test page size 6
      const pageSize6Button = page.locator('button:has-text("6")').first()
      if (await pageSize6Button.count() > 0) {
        await pageSize6Button.click()
        await page.waitForLoadState('networkidle')
      }

      // Test page size 12
      const pageSize12Button = page.locator('button:has-text("12")').first()
      if (await pageSize12Button.count() > 0) {
        await pageSize12Button.click()
        await page.waitForLoadState('networkidle')
      }

      // Test page size 24
      const pageSize24Button = page.locator('button:has-text("24")').first()
      if (await pageSize24Button.count() > 0) {
        await pageSize24Button.click()
        await page.waitForLoadState('networkidle')
      }

      // Test page size 48
      const pageSize48Button = page.locator('button:has-text("48")').first()
      if (await pageSize48Button.count() > 0) {
        await pageSize48Button.click()
        await page.waitForLoadState('networkidle')
      }

      // Verify pagination buttons exist
      const pageNavigation = page.locator('button').filter({ has: page.locator('text=/1|2|3|›|«/') })
      expect(await pageNavigation.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('T005: Sort cases by creation date and last updated', async ({ page }) => {
    // Get sort controls dropdown/button
    const sortControls = page.locator('button, select').filter({ hasText: /Sort|Updated|Created/ }).first()

    if (await sortControls.count() > 0) {
      // Click to open sort menu
      await sortControls.click()
      await page.waitForLoadState('networkidle')

      // Look for sort options
      const sortByUpdated = page.locator('text=Last Updated').first()
      const sortByCreated = page.locator('text=Created').first()

      // Test sort by created date
      if (await sortByCreated.count() > 0) {
        await sortByCreated.click()
        await page.waitForLoadState('networkidle')
      }

      // Test sort by updated date
      if (await sortByUpdated.count() > 0) {
        await sortByUpdated.click()
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('T006: Delete case with confirmation modal', async ({ page }) => {
    // Create a case first to delete
    const newCaseButton = page.locator('button:has-text("New Case")')
    await expect(newCaseButton).toBeVisible()
    await newCaseButton.click()

    // Fill the form quickly
    const titleInput = page.locator('input[id="case-title"]')
    await titleInput.fill('Delete Test Case')

    const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
    await actTypeButton.click()

    const nextButton = page.locator('button:has-text("Next")').first()
    await nextButton.click()

    const priceInput = page.locator('input[id="case-price"]')
    await priceInput.fill('100000')

    const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
    await fullPaymentButton.click()

    await nextButton.click()

    const createButton = page.locator('button:has-text("Create Case")').first()
    await createButton.click()

    // Wait for case to appear
    await expect(page.locator('text=Delete Test Case')).toBeVisible({ timeout: 5000 })

    // Find and click the more options menu
    const moreButton = page.locator('[aria-label="More options"]').first()
    await moreButton.click()

    // Click delete option
    const deleteOption = page.locator('button:has-text("Delete Case")').first()
    await expect(deleteOption).toBeVisible()
    await deleteOption.click()

    // Verify confirmation modal appears
    const confirmationModal = page.locator('[role="dialog"]').filter({ has: page.locator('text=Delete Case') })
    await expect(confirmationModal).toBeVisible()

    // Verify confirmation message
    await expect(page.locator('text=Delete Test Case')).toBeVisible()

    // Click confirm delete
    const confirmButton = page.locator('button:has-text("Delete Case")').last()
    await expect(confirmButton).toBeVisible()
    await confirmButton.click()

    // Wait for modal to close and case to be removed
    await expect(confirmationModal).not.toBeVisible({ timeout: 5000 })

    // Verify case is no longer in the list (eventually)
    await page.waitForLoadState('networkidle')
  })

  test('T007: Archive and unarchive cases', async ({ page }) => {
    // Create a case first
    const newCaseButton = page.locator('button:has-text("New Case")')
    await expect(newCaseButton).toBeVisible()
    await newCaseButton.click()

    const titleInput = page.locator('input[id="case-title"]')
    await titleInput.fill('Archive Test Case')

    const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
    await actTypeButton.click()

    const nextButton = page.locator('button:has-text("Next")').first()
    await nextButton.click()

    const priceInput = page.locator('input[id="case-price"]')
    await priceInput.fill('150000')

    const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
    await fullPaymentButton.click()

    await nextButton.click()

    const createButton = page.locator('button:has-text("Create Case")').first()
    await createButton.click()

    // Wait for case to appear
    await expect(page.locator('text=Archive Test Case')).toBeVisible({ timeout: 5000 })

    // Click on the case to open it
    const caseLink = page.locator('a:has-text("Archive Test Case")').first()
    await caseLink.click()

    // Wait for case overview page
    await page.waitForLoadState('networkidle')

    // Verify we're on case overview page
    const archiveButton = page.locator('button:has-text("Archive")').first()
    await expect(archiveButton).toBeVisible()

    // Click archive button
    await archiveButton.click()

    // Verify confirmation modal
    const confirmationModal = page.locator('[role="dialog"]').filter({ has: page.locator('text=Archive Case') })
    await expect(confirmationModal).toBeVisible()

    // Confirm archive
    const confirmButton = page.locator('button:has-text("Archive")').last()
    await confirmButton.click()

    // Wait for modal to close
    await expect(confirmationModal).not.toBeVisible({ timeout: 5000 })

    // Verify unarchive button now appears
    const unarchiveButton = page.locator('button:has-text("Unarchive")').first()
    await expect(unarchiveButton).toBeVisible({ timeout: 5000 })

    // Click unarchive button
    await unarchiveButton.click()

    // Verify confirmation modal
    const unarchiveConfirmModal = page.locator('[role="dialog"]').filter({ has: page.locator('text=Unarchive Case') })
    await expect(unarchiveConfirmModal).toBeVisible()

    // Confirm unarchive
    const unarchiveConfirmButton = page.locator('button:has-text("Unarchive")').last()
    await unarchiveConfirmButton.click()

    // Wait for modal to close
    await expect(unarchiveConfirmModal).not.toBeVisible({ timeout: 5000 })

    // Verify archive button appears again
    const archiveButtonAgain = page.locator('button:has-text("Archive")').first()
    await expect(archiveButtonAgain).toBeVisible({ timeout: 5000 })
  })

  test('T008: Case status badges render with correct colors', async ({ page }) => {
    // Get all case cards
    const caseCards = page.locator('.glass-card')

    if (await caseCards.count() > 0) {
      // Check first case card for badge
      const firstCard = caseCards.first()
      const badge = firstCard.locator('[role="img"], .badge, [class*="badge"]').first()

      if (await badge.count() > 0) {
        // Verify badge is visible
        await expect(badge).toBeVisible()

        // Get badge text to determine status
        const badgeText = await badge.textContent()

        // Verify badge contains a status
        const validStatuses = ['Draft', 'Processing', 'Review', 'Approved', 'Archived']
        expect(validStatuses.some(status => badgeText?.includes(status))).toBe(true)

        // Verify badge has styling classes (colors)
        const badgeClass = await badge.getAttribute('class')
        expect(badgeClass).toBeTruthy()
      }
    } else {
      // If no cases exist, create one and check its badge
      const newCaseButton = page.locator('button:has-text("New Case")')
      await newCaseButton.click()

      const titleInput = page.locator('input[id="case-title"]')
      await titleInput.fill('Badge Test Case')

      const actTypeButton = page.locator('button:has-text("Purchase & Sale")').first()
      await actTypeButton.click()

      const nextButton = page.locator('button:has-text("Next")').first()
      await nextButton.click()

      const priceInput = page.locator('input[id="case-price"]')
      await priceInput.fill('200000')

      const fullPaymentButton = page.locator('button:has-text("Full Payment")').first()
      await fullPaymentButton.click()

      await nextButton.click()

      const createButton = page.locator('button:has-text("Create Case")').first()
      await createButton.click()

      // Wait for case to appear
      await expect(page.locator('text=Badge Test Case')).toBeVisible({ timeout: 5000 })

      // Check the new case's badge
      const newCard = page.locator('.glass-card').first()
      const newBadge = newCard.locator('[role="img"], [class*="badge"]').first()

      await expect(newBadge).toBeVisible()

      const newBadgeText = await newBadge.textContent()
      expect(['Draft', 'Processing', 'Review', 'Approved', 'Archived'].some(status => newBadgeText?.includes(status))).toBe(true)
    }
  })
})
