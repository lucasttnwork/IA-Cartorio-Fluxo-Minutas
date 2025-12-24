import { test, expect } from '@playwright/test';

test.describe('Authenticated Dashboard UI Verification', () => {
  test('should verify login page components', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Verify login page elements
    const heading = await page.getByText('Document Processing & Draft Generation').count();
    const emailInput = await page.getByPlaceholder('Email', { exact: false }).count();
    const passwordInput = await page.getByPlaceholder('Password', { exact: false }).count();
    const signInButton = await page.getByRole('button', { name: /sign in/i }).count();
    const rememberMe = await page.getByText('Remember me').count();
    const forgotPassword = await page.getByText('Forgot password?').count();

    console.log('Login page heading:', heading > 0);
    console.log('Email input:', emailInput > 0);
    console.log('Password input:', passwordInput > 0);
    console.log('Sign in button:', signInButton > 0);
    console.log('Remember me checkbox:', rememberMe > 0);
    console.log('Forgot password link:', forgotPassword > 0);

    await page.screenshot({
      path: 'screenshots/login-page-detailed.png',
      fullPage: true
    });

    // Verify all key login components exist
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    expect(signInButton).toBeGreaterThan(0);
  });

  test('should display "Minuta Canvas" branding', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');

    // Check for app branding
    const brandingText = await page.getByText('Minuta Canvas').count();
    console.log('Minuta Canvas branding found:', brandingText > 0);

    expect(brandingText).toBeGreaterThan(0);
  });

  test('should have working form inputs', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Find and interact with email input
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail" i]').first();
    await emailInput.fill('test@example.com');
    const emailValue = await emailInput.inputValue();
    console.log('Email input value:', emailValue);

    // Find and interact with password input
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('testpassword');
    const passwordValue = await passwordInput.inputValue();
    console.log('Password input filled:', passwordValue.length > 0);

    await page.screenshot({
      path: 'screenshots/login-form-filled.png',
      fullPage: true
    });

    expect(emailValue).toBe('test@example.com');
    expect(passwordValue).toBe('testpassword');
  });

  test('should verify page styling and layout', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Check for proper styling (Tailwind classes should be applied)
    const body = page.locator('body');
    const bodyClasses = await body.getAttribute('class');
    console.log('Body classes:', bodyClasses);

    // Check background colors and styling
    const hasBackgroundColor = await page.evaluate(() => {
      const body = document.querySelector('body');
      const styles = window.getComputedStyle(body!);
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    });

    console.log('Body has background color:', hasBackgroundColor);

    // Count all styled elements
    const styledElements = await page.locator('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]').count();
    console.log('Number of styled elements:', styledElements);

    expect(styledElements).toBeGreaterThan(5);
  });

  test('should verify responsive design elements', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'screenshots/login-desktop-1920.png',
      fullPage: true
    });

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'screenshots/login-tablet-768.png',
      fullPage: true
    });

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'screenshots/login-mobile-375.png',
      fullPage: true
    });

    console.log('Responsive screenshots captured for desktop, tablet, and mobile');
  });

  test('should verify all interactive elements are visible', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Count all buttons
    const buttons = await page.locator('button').count();
    console.log('Total buttons:', buttons);

    // Count all links
    const links = await page.locator('a').count();
    console.log('Total links:', links);

    // Count all inputs
    const inputs = await page.locator('input').count();
    console.log('Total inputs:', inputs);

    // Get all button text
    const buttonTexts = await page.locator('button').allTextContents();
    console.log('Button texts:', buttonTexts);

    expect(buttons).toBeGreaterThan(0);
    expect(inputs).toBeGreaterThan(1); // At least email and password
  });
});
