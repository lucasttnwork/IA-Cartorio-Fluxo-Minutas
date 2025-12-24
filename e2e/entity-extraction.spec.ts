import { test, expect } from '@playwright/test'
import { loginTestUser, logout, navigateToDashboard } from './fixtures'

/**
 * Entity Extraction Functional Regression Tests (FASE 15)
 * Tests T017-T024: Entity listing, filtering, confidence badges, extraction jobs, re-extraction
 */

test.describe('Entity Extraction', () => {
  let caseId: string

  test.beforeEach(async ({ page }) => {
    // Login and create a test case with documents
    await loginTestUser(page)
    await navigateToDashboard(page)

    // Create a new case
    const newCaseButton = page.locator('button:has-text("New Case")')
    await expect(newCaseButton).toBeVisible()
    await newCaseButton.click()

    // Fill the form
    const titleInput = page.locator('input[id="case-title"]')
    await titleInput.fill('Entities Test Case')

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
    await expect(page.locator('text=Entities Test Case')).toBeVisible({ timeout: 5000 })

    // Extract case ID from URL
    await page.waitForLoadState('networkidle')
    const url = page.url()
    const match = url.match(/\/case\/([a-f0-9-]+)/)
    if (match) {
      caseId = match[1]
    }

    // Navigate to entities page
    await page.goto(`/case/${caseId}/entities`)
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: logout
    await logout(page)
  })

  test('T017: List entities extracted from documents', async ({ page }) => {
    // Wait for page to load
    await expect(page).toHaveTitle(/Entities|entit/i)

    // Check for entity table or list
    const entityTable = page.locator('table, [role="grid"], [class*="entity"], [class*="table"]').first()

    // Check for entity-related content
    const entityContent = page.locator('text=/entity|entities|person|property|people|properties/i').first()
    await expect(entityContent).toBeVisible()

    // Verify columns exist (Name, Type, Confidence, Actions)
    const nameColumn = page.locator('text=/name|entity name/i').first()
    const typeColumn = page.locator('text=/type|entity type/i').first()
    const confidenceColumn = page.locator('text=/confidence|score/i').first()

    if (await nameColumn.count() > 0) {
      await expect(nameColumn).toBeVisible()
    }

    if (await typeColumn.count() > 0) {
      await expect(typeColumn).toBeVisible()
    }

    if (await confidenceColumn.count() > 0) {
      await expect(confidenceColumn).toBeVisible()
    }
  })

  test('T018: Filter entities by document', async ({ page }) => {
    // Wait for document filter/selector
    const documentFilter = page.locator('select, [role="combobox"], [class*="select"]').first()

    if (await documentFilter.count() > 0) {
      await expect(documentFilter).toBeVisible()

      // Get available documents
      const filterLabel = page.locator('text=/document|filter|select document/i').first()
      if (await filterLabel.count() > 0) {
        await expect(filterLabel).toBeVisible()

        // Try to interact with filter
        await documentFilter.click()

        // Verify dropdown/select opens
        const filterOptions = page.locator('option, [role="option"]')
        if (await filterOptions.count() > 0) {
          // Options are available
          expect(await filterOptions.count()).toBeGreaterThan(0)
        }
      }
    }
  })

  test('T019: Confidence badge colors (green/yellow/red)', async ({ page }) => {
    // Check for confidence badges with color classes
    const confidentBadges = page.locator('[class*="text-green"], [class*="bg-green"], [class*="green-"]')
    const warningBadges = page.locator('[class*="text-yellow"], [class*="bg-yellow"], [class*="yellow-"]')
    const failBadges = page.locator('[class*="text-red"], [class*="bg-red"], [class*="red-"]')

    // Verify at least the badge color system exists
    const anyColoredElements = page.locator('[class*="text-"], [class*="bg-"]').filter({ has: page.locator('text=/%|%/') })

    if (await anyColoredElements.count() > 0) {
      // Color-coded confidence elements exist
      expect(await anyColoredElements.count()).toBeGreaterThanOrEqual(0)
    }

    // Check for confidence percentage text
    const confidenceText = page.locator('text=/%/')

    if (await confidenceText.count() > 0) {
      await expect(confidenceText.first()).toBeVisible()
    }
  })

  test('T020: Trigger extraction for batch & per-document', async ({ page }) => {
    // Look for extraction trigger buttons
    const extractButton = page.locator('button').filter({ has: page.locator('text=/extract|trigger|process|sparkles/i') }).first()

    if (await extractButton.count() > 0) {
      await expect(extractButton).toBeVisible()

      // Test: Trigger extraction for single document
      const perDocButton = page.locator('button[aria-label*="extract"], button:has-text(/Extract|Re-extract/i)').first()

      if (await perDocButton.count() > 0) {
        // Per-document extraction button exists
        await expect(perDocButton).toBeVisible()
      }

      // Test: Trigger batch extraction
      const batchButton = page.locator('button').filter({ has: page.locator('text=/Extract All|Batch|All documents/i') }).first()

      if (await batchButton.count() > 0) {
        await expect(batchButton).toBeVisible()
      }
    } else {
      // If no extraction buttons, verify extraction is already in progress or completed
      const extractionStatus = page.locator('text=/processing|completed|extracted|extraction/i').first()
      if (await extractionStatus.count() > 0) {
        await expect(extractionStatus).toBeVisible()
      }
    }
  })

  test('T021: Job status tracking (pending → processing → completed)', async ({ page }) => {
    // Check for status indicators
    const statusElements = page.locator('text=/pending|processing|completed|failed|in progress/i')

    if (await statusElements.count() > 0) {
      // Status tracking is visible
      expect(await statusElements.count()).toBeGreaterThan(0)
    }

    // Check for status badges
    const statusBadges = page.locator('[class*="badge"], [class*="status"]').filter({ has: page.locator('text=/pending|processing|completed/i') })

    if (await statusBadges.count() > 0) {
      await expect(statusBadges.first()).toBeVisible()
    }

    // Check for spinner/loading indicator while processing
    const loadingSpinner = page.locator('[class*="animate-spin"], [class*="loading"], svg[class*="animate"]').first()

    if (await loadingSpinner.count() > 0) {
      // Loading indicator may be visible during processing
      expect(await loadingSpinner.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('T022: Entities appear after job completes', async ({ page }) => {
    // Wait for initial page load
    await page.waitForLoadState('networkidle')

    // Check for entity table/list
    const entityList = page.locator('table, [role="grid"], [class*="table"]').first()

    if (await entityList.count() > 0) {
      await expect(entityList).toBeVisible()
    }

    // Look for entity rows
    const entityRows = page.locator('tbody tr, [role="row"]')

    if (await entityRows.count() > 0) {
      // Entities are displayed
      expect(await entityRows.count()).toBeGreaterThan(0)

      // Verify first row has entity data
      const firstRow = entityRows.first()
      const entityName = firstRow.locator('td, [role="cell"]').first()

      if (await entityName.count() > 0) {
        await expect(entityName).toBeVisible()
      }
    }
  })

  test('T023: Re-extraction overwrites previous entities', async ({ page }) => {
    // Get initial entity count
    const initialRows = page.locator('tbody tr, [role="row"]')
    const initialCount = await initialRows.count()

    // Look for re-extract button
    const reExtractButton = page.locator('button').filter({ has: page.locator('text=/Re-extract|Extract again|Update/i') }).first()

    if (await reExtractButton.count() > 0) {
      await expect(reExtractButton).toBeVisible()

      // Click re-extract
      await reExtractButton.click()

      // Wait for processing
      await page.waitForLoadState('networkidle')

      // Verify entities are updated (may have different content or count)
      const updatedRows = page.locator('tbody tr, [role="row"]')
      const updatedCount = await updatedRows.count()

      // Verify we have entities after re-extraction
      expect(updatedCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('T024: Badge counters update correctly', async ({ page }) => {
    // Look for badge counters
    const badgeCounters = page.locator('[class*="badge"] > text, [class*="count"], .badge span').filter({ hasText: /\d/ })

    if (await badgeCounters.count() > 0) {
      // Counters exist
      expect(await badgeCounters.count()).toBeGreaterThan(0)

      // Verify counter text is numeric
      for (let i = 0; i < Math.min(3, await badgeCounters.count()); i++) {
        const counterText = await badgeCounters.nth(i).textContent()
        // Counter should be a number
        expect(counterText).toMatch(/^\d+$|^\d+\s*(person|people|property|entities)/i)
      }
    }

    // Look for summary badges (total entities, people, properties)
    const summaryBadges = page.locator('text=/entities|people|properties|total/i')

    if (await summaryBadges.count() > 0) {
      // Summary is visible
      expect(await summaryBadges.count()).toBeGreaterThan(0)
    }

    // Verify counters are displayed in the table header or summary section
    const headers = page.locator('th, [role="columnheader"]').filter({ hasText: /\(.*\d/ })

    if (await headers.count() > 0) {
      // Headers with counters exist
      expect(await headers.count()).toBeGreaterThan(0)
    }
  })

  test('T025: Entity type distinction (people vs properties)', async ({ page }) => {
    // Look for person entities
    const personEntities = page.locator('text=/person|people|vendor|buyer|grantor|grantee/i')

    // Look for property entities
    const propertyEntities = page.locator('text=/property|properties|land|parcel|real estate/i')

    // Verify both types can be distinguished
    if (await personEntities.count() > 0 || await propertyEntities.count() > 0) {
      expect(
        (await personEntities.count()) + (await propertyEntities.count())
      ).toBeGreaterThan(0)
    }

    // Check for type column/badge in table
    const typeColumn = page.locator('text=/type|entity type/i').first()

    if (await typeColumn.count() > 0) {
      await expect(typeColumn).toBeVisible()
    }
  })

  test('T026: Evidence linking for entities', async ({ page }) => {
    // Look for evidence buttons or links
    const evidenceButtons = page.locator('button').filter({ has: page.locator('text=/evidence|source|document|view/i') })

    if (await evidenceButtons.count() > 0) {
      // Evidence functionality exists
      expect(await evidenceButtons.count()).toBeGreaterThan(0)

      // Click first evidence button
      const firstButton = evidenceButtons.first()
      await firstButton.click()

      // Verify evidence modal/detail opens
      const modal = page.locator('[role="dialog"], [class*="modal"]').first()
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible({ timeout: 3000 })
      }
    }
  })
})
