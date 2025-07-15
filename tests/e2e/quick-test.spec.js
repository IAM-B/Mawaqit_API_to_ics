const { test, expect } = require('@playwright/test');

test.describe('Quick Test - Basic Functionality', () => {
  test('should load planner page', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('domcontentloaded');

    // Check page title
    await expect(page).toHaveTitle(/Planning synchronisé/);

    // Check that form elements are present
    await expect(page.locator('#country-select')).toBeVisible();
    await expect(page.locator('#mosque-select')).toBeVisible();
    await expect(page.locator('input[name="global_padding_before"]')).toBeVisible();
    await expect(page.locator('input[name="global_padding_after"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should configure padding', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('domcontentloaded');

    // Configure paddings
    await page.fill('input[name="global_padding_before"]', '15');
    await page.fill('input[name="global_padding_after"]', '30');

    // Check values
    expect(await page.inputValue('input[name="global_padding_before"]')).toBe('15');
    expect(await page.inputValue('input[name="global_padding_after"]')).toBe('30');
  });

  test('should have working form submission', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('domcontentloaded');

    // Check that submit button is present and clickable
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('should display responsive design elements', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/planner');
    await page.waitForLoadState('domcontentloaded');

    // Check that forms are visible on desktop
    await expect(page.locator('#plannerForm')).toBeVisible();
    await expect(page.locator('#configForm')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/planner');
    await page.waitForLoadState('domcontentloaded');

    // Check that forms are visible on mobile
    await expect(page.locator('#plannerForm')).toBeVisible();
    await expect(page.locator('#configForm')).toBeVisible();
  });
});
