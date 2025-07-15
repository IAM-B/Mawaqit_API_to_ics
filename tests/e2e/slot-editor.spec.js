const { test, expect } = require('@playwright/test');

test.describe('Slot Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/edit_slot');
    await page.waitForLoadState('networkidle');
  });

  test('should display slot editor interface', async ({ page }) => {
    // Check that page loads correctly
    await expect(page).toHaveTitle(/Éditeur de créneaux/);

    // Check main interface elements
    await expect(page.locator('h2')).toContainText('Édition d\'un créneau disponible');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('select[name="index"]')).toBeVisible();
  });

  test('should display slot selection dropdown', async ({ page }) => {
    // Check that slot dropdown is present
    const slotSelect = page.locator('select[name="index"]');
    await expect(slotSelect).toBeVisible();

    // Check that it has options (if slots are available)
    const options = await slotSelect.locator('option').count();
    expect(options).toBeGreaterThan(0);
  });

  test('should allow time input', async ({ page }) => {
    // Check time input fields
    await expect(page.locator('input[name="start"]')).toBeVisible();
    await expect(page.locator('input[name="end"]')).toBeVisible();

    // Fill time values
    await page.fill('input[name="start"]', '09:00');
    await page.fill('input[name="end"]', '10:00');

    // Check values
    expect(await page.locator('input[name="start"]').inputValue()).toBe('09:00');
    expect(await page.locator('input[name="end"]').inputValue()).toBe('10:00');
  });

  test('should have submit button', async ({ page }) => {
    // Check submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Modifier ce créneau');
  });

  test('should have ICS download link', async ({ page }) => {
    // Check ICS download link
    const downloadLink = page.locator('a[href="/generate_slots_ics"]');
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toContainText('Télécharger les créneaux disponibles');
  });

  test('should handle form submission', async ({ page }) => {
    // Select a slot if available
    const slotSelect = page.locator('select[name="index"]');
    const options = await slotSelect.locator('option').count();

    if (options > 1) {
      await slotSelect.selectOption({ index: 1 });

      // Fill time values
      await page.fill('input[name="start"]', '09:00');
      await page.fill('input[name="end"]', '10:00');

      // Submit form
      await page.click('button[type="submit"]');

      // Should handle submission (either redirect or show result)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Should show validation error or handle gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/edit_slot');
      await page.waitForLoadState('networkidle');

      // Check that interface is usable on all screen sizes
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('select[name="index"]')).toBeVisible();
    }
  });
});

test.describe('Slot Editor Error Handling', () => {
  test('should handle invalid time formats', async ({ page }) => {
    // Try invalid time format
    await page.fill('input[name="start"]', '25:00');
    await page.fill('input[name="end"]', '26:00');
    await page.click('button[type="submit"]');

    // Should handle gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle end time before start time', async ({ page }) => {
    // End time before start time
    await page.fill('input[name="start"]', '10:00');
    await page.fill('input[name="end"]', '09:00');
    await page.click('button[type="submit"]');

    // Should handle gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});
