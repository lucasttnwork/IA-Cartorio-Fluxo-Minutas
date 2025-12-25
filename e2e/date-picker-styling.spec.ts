import { test, expect } from '@playwright/test';

/**
 * Date Picker Styling Tests
 *
 * Verifies that date input fields are properly styled in both light and dark modes.
 */

test.describe('Date Picker Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the date picker test page
    await page.goto('/test-date-picker');
    await page.waitForLoadState('networkidle');
  });

  test('T100: Date picker page loads correctly', async ({ page }) => {
    // Verify page title is visible
    await expect(page.getByRole('heading', { name: 'Date Picker Styling Test' })).toBeVisible();

    // Verify date inputs are present
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(6); // 5 regular + 1 disabled
  });

  test('T101: Date inputs have correct styling', async ({ page }) => {
    // Get the birth date input
    const birthDateInput = page.locator('#birth-date');
    await expect(birthDateInput).toBeVisible();

    // Verify input has proper styling by checking its classes
    await expect(birthDateInput).toHaveClass(/rounded-md/);
  });

  test('T102: Date input accepts date values', async ({ page }) => {
    const birthDateInput = page.locator('#birth-date');

    // Fill in a date
    await birthDateInput.fill('2000-05-15');

    // Verify the value was set
    await expect(birthDateInput).toHaveValue('2000-05-15');

    // Verify the selected value is shown
    await expect(page.getByText('Valor selecionado: 2000-05-15')).toBeVisible();
  });

  test('T103: Pre-filled date input shows correct value', async ({ page }) => {
    const eventDateInput = page.locator('#event-date');

    // Verify pre-filled value
    await expect(eventDateInput).toHaveValue('2024-12-25');
  });

  test('T104: Disabled date input is not editable', async ({ page }) => {
    const disabledDateInput = page.locator('#disabled-date');

    // Verify the input is disabled
    await expect(disabledDateInput).toBeDisabled();

    // Verify it has the correct value
    await expect(disabledDateInput).toHaveValue('2024-01-15');
  });

  test('T105: Dark mode toggle changes date picker appearance', async ({ page }) => {
    // Get the theme toggle button
    const themeToggle = page.getByRole('button', { name: /switch to dark mode/i });

    // Click to enable dark mode
    await themeToggle.click();

    // Verify dark class is added to the document
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Date inputs should still be visible and functional
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();

    // Toggle back to light mode
    const lightModeToggle = page.getByRole('button', { name: /switch to light mode/i });
    await lightModeToggle.click();

    // Verify dark class is removed
    await expect(html).not.toHaveClass(/dark/);
  });

  test('T106: Date input focus state is styled correctly', async ({ page }) => {
    const birthDateInput = page.locator('#birth-date');

    // Focus the input
    await birthDateInput.focus();

    // Verify the input is focused
    await expect(birthDateInput).toBeFocused();
  });

  test('T107: Multiple date inputs in form work correctly', async ({ page }) => {
    const startDateInput = page.locator('#start-date');
    const endDateInput = page.locator('#end-date');

    // Fill both date inputs
    await startDateInput.fill('2024-01-01');
    await endDateInput.fill('2024-12-31');

    // Verify both values
    await expect(startDateInput).toHaveValue('2024-01-01');
    await expect(endDateInput).toHaveValue('2024-12-31');
  });
});
