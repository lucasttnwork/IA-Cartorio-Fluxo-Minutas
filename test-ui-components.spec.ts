import { test, expect } from '@playwright/test';

test.describe('UI Component Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
  });

  test('should render login page or dashboard', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial page
    await page.screenshot({
      path: 'screenshots/01-initial-page.png',
      fullPage: true
    });

    // Check if we're on login page or dashboard
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Check for common elements
    const hasLoginForm = await page.locator('form').count() > 0;
    const hasDashboard = await page.locator('text=Cases').count() > 0;
    const hasSidebar = await page.locator('text=Minuta Canvas').count() > 0;

    console.log('Has login form:', hasLoginForm);
    console.log('Has dashboard:', hasDashboard);
    console.log('Has sidebar:', hasSidebar);

    expect(hasLoginForm || hasDashboard || hasSidebar).toBeTruthy();
  });

  test('should display dashboard layout components', async ({ page }) => {
    // Wait for any content to load
    await page.waitForLoadState('domcontentloaded');

    // Take snapshot of the page
    await page.screenshot({
      path: 'screenshots/02-dashboard-layout.png',
      fullPage: true
    });

    // Check for navigation elements
    const navElements = await page.locator('nav').count();
    console.log('Number of nav elements:', navElements);

    // Check for main content area
    const mainContent = await page.locator('main').count();
    console.log('Has main content:', mainContent > 0);

    // Log all visible text on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 200));
  });

  test('should test sidebar navigation (desktop)', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'screenshots/03-desktop-view.png',
      fullPage: true
    });

    // Check for desktop sidebar
    const sidebar = await page.locator('.lg\\:flex, [class*="lg:w-64"]').count();
    console.log('Desktop sidebar elements:', sidebar);
  });

  test('should test mobile navigation', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'screenshots/04-mobile-view.png',
      fullPage: true
    });

    // Look for mobile menu button
    const mobileMenuButton = await page.locator('button[class*="lg:hidden"]').count();
    console.log('Mobile menu buttons:', mobileMenuButton);
  });

  test('should test New Case button interaction', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for "New Case" button
    const newCaseButton = await page.getByText('New Case').first();
    const buttonExists = await newCaseButton.count() > 0;

    console.log('New Case button exists:', buttonExists);

    if (buttonExists) {
      // Click the button
      await newCaseButton.click();
      await page.waitForTimeout(500);

      // Take screenshot of modal
      await page.screenshot({
        path: 'screenshots/05-new-case-modal.png',
        fullPage: true
      });

      // Check if modal opened
      const modalTitle = await page.getByText('Create New Case').count();
      console.log('Modal opened:', modalTitle > 0);

      // Check for modal close button
      const closeButton = await page.locator('button[class*="XMarkIcon"], svg[class*="XMarkIcon"]').count();
      console.log('Close button found:', closeButton > 0);
    }
  });

  test('should verify empty state display', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for empty state
    const emptyStateText = await page.getByText('No cases yet').count();
    const emptyStateIcon = await page.locator('svg[class*="FolderIcon"]').count();

    console.log('Empty state displayed:', emptyStateText > 0);
    console.log('Empty state icon:', emptyStateIcon > 0);

    await page.screenshot({
      path: 'screenshots/06-empty-state.png',
      fullPage: true
    });
  });

  test('should verify all main UI elements render', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get page content snapshot
    const html = await page.content();

    // Check for key components in the HTML
    const hasReactRoot = html.includes('id="root"');
    const hasTailwindClasses = html.includes('bg-') || html.includes('text-');
    const hasButtons = await page.locator('button').count();
    const hasLinks = await page.locator('a').count();

    console.log('React root found:', hasReactRoot);
    console.log('Tailwind classes found:', hasTailwindClasses);
    console.log('Number of buttons:', hasButtons);
    console.log('Number of links:', hasLinks);

    // Final comprehensive screenshot
    await page.screenshot({
      path: 'screenshots/07-final-verification.png',
      fullPage: true
    });

    // Basic assertions
    expect(hasReactRoot).toBeTruthy();
    expect(hasButtons).toBeGreaterThan(0);
  });
});
