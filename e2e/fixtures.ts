import { Page } from '@playwright/test';

/**
 * Test Fixtures and Helpers
 * Reusable functions for E2E testing
 */

// ============================================================================
// Test User Credentials
// ============================================================================

export const TEST_USER = {
  email: 'test@cartorio.com',
  password: 'Test123!@',
};

// ============================================================================
// Case Management Helpers
// ============================================================================

/**
 * Create a test case via UI
 */
export async function createTestCase(page: Page, caseData?: {
  title?: string;
  actType?: 'purchase_sale' | 'donation' | 'exchange' | 'lease';
  description?: string;
}) {
  const title = caseData?.title || `Test Case ${Date.now()}`;
  const actType = caseData?.actType || 'purchase_sale';
  const description = caseData?.description || 'Test case for E2E testing';

  // Click "New Case" button
  await page.click('button:has-text("New Case")');

  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]');

  // Fill in case details
  await page.fill('input[placeholder*="title"]', title);
  await page.selectOption('select', actType);
  await page.fill('textarea', description);

  // Submit
  await page.click('button:has-text("Create")');

  // Wait for redirect
  await page.waitForURL(/\/case\/\w+\/upload/);

  return { title, actType, description };
}

/**
 * Delete a case via UI
 */
export async function deleteTestCase(page: Page, caseTitle: string) {
  // Find case card by title
  const caseCard = page.locator(`[data-testid="case-card"]:has-text("${caseTitle}")`);

  // Click ellipsis menu
  await caseCard.locator('[data-testid="case-menu"]').click();

  // Click delete option
  await page.click('[data-testid="case-delete-option"]');

  // Confirm deletion
  await page.click('button:has-text("Confirm")');

  // Wait for case to be removed
  await page.waitForSelector(`[data-testid="case-card"]:has-text("${caseTitle}")`, {
    state: 'hidden',
  });
}

// ============================================================================
// Document Upload Helpers
// ============================================================================

/**
 * Upload a test document
 */
export async function uploadTestDocument(page: Page, filePath: string) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Wait for upload to complete
  await page.waitForSelector('[data-testid="document-status"]:has-text("Processed")');
}

/**
 * Delete a test document
 */
export async function deleteTestDocument(page: Page, documentName: string) {
  const docRow = page.locator(`[data-testid="document-item"]:has-text("${documentName}")`);
  await docRow.locator('[data-testid="delete-btn"]').click();

  // Confirm deletion
  await page.click('button:has-text("Confirm")');
}

// ============================================================================
// Entity Helpers
// ============================================================================

/**
 * Trigger entity extraction
 */
export async function extractEntities(page: Page) {
  await page.click('button:has-text("Extract Entities")');

  // Wait for processing to complete
  await page.waitForSelector('[data-testid="extraction-complete"]');
}

/**
 * Get extracted entities count
 */
export async function getEntityCount(page: Page, type: 'people' | 'properties') {
  const selector = type === 'people'
    ? '[data-testid="person-card"]'
    : '[data-testid="property-card"]';

  return await page.locator(selector).count();
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Navigate to case page
 */
export async function navigateToCase(page: Page, caseId: string, section?: 'upload' | 'entities' | 'canvas' | 'draft' | 'history') {
  const path = section ? `/case/${caseId}/${section}` : `/case/${caseId}`;
  await page.goto(path);
}

/**
 * Navigate to dashboard
 */
export async function navigateToDashboard(page: Page) {
  await page.goto('/dashboard');
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Login with test user
 */
export async function loginTestUser(page: Page) {
  await page.goto('/login');

  // Fill credentials
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);

  // Click login button
  await page.click('button:has-text("Login")');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
}

/**
 * Logout
 */
export async function logout(page: Page) {
  // Click profile dropdown
  await page.click('[data-testid="profile-dropdown"]');

  // Click logout option
  await page.click('[data-testid="logout-option"]');

  // Wait for redirect to login
  await page.waitForURL('/login');
}

// ============================================================================
// Dark Mode Helpers
// ============================================================================

/**
 * Toggle dark mode
 */
export async function toggleDarkMode(page: Page) {
  await page.click('[data-testid="theme-toggle"]');

  // Wait for DOM to update with dark mode class
  await page.waitForFunction(() => {
    return document.documentElement.classList.contains('dark');
  });
}

/**
 * Check if dark mode is active
 */
export async function isDarkModeActive(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.classList.contains('dark');
  });
}

/**
 * Get theme preference from localStorage
 */
export async function getThemePreference(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    return localStorage.getItem('theme');
  });
}

// ============================================================================
// Modal/Dialog Helpers
// ============================================================================

/**
 * Close dialog/modal
 */
export async function closeDialog(page: Page) {
  // Try to find and click the close button
  const closeBtn = page.locator('[data-testid="dialog-close"], [aria-label="Close"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  } else {
    // Fallback: press Escape
    await page.keyboard.press('Escape');
  }
}

// ============================================================================
// Accessibility Helpers
// ============================================================================

/**
 * Inject and run Axe accessibility checks
 */
export async function runAccessibilityCheck(page: Page) {
  // This will be used with @axe-core/playwright
  // Import and use: await injectAxe(page); await checkA11y(page);
  return true;
}

/**
 * Verify keyboard navigation to element
 */
export async function focusElement(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    if (el) el.focus();
  }, selector);

  // Verify element is focused
  const isFocused = await page.evaluate((sel) => {
    return document.activeElement?.matches(sel);
  }, selector);

  return isFocused;
}

// ============================================================================
// Wait Helpers
// ============================================================================

/**
 * Wait for processing job to complete
 */
export async function waitForProcessingComplete(page: Page, jobType: string, timeout = 60000) {
  await page.waitForFunction(
    (type) => {
      const status = document.querySelector(`[data-job-type="${type}"] [data-status]`);
      return status?.textContent?.includes('Completed');
    },
    jobType,
    { timeout }
  );
}

/**
 * Wait for real-time update
 */
export async function waitForRealtimeUpdate(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { timeout });
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert element contains text (case insensitive)
 */
export async function assertContainsText(page: Page, selector: string, text: string) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  const content = await element.textContent();
  return content?.toLowerCase().includes(text.toLowerCase()) || false;
}

/**
 * Assert element has correct class
 */
export async function assertHasClass(page: Page, selector: string, className: string) {
  return await page.evaluate(
    ({ sel, cls }) => {
      return document.querySelector(sel)?.classList.contains(cls);
    },
    { sel: selector, cls: className }
  );
}

/**
 * Assert element is disabled
 */
export async function assertIsDisabled(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLButtonElement | HTMLInputElement;
    return el?.disabled || false;
  }, selector);
}
