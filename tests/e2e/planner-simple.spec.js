const { test, expect } = require('@playwright/test');

test.describe('Planner Page - Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner');
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should display configuration form', async ({ page }) => {
    // Check that page loads correctly
    await expect(page).toHaveTitle(/Planner/);
    
    // Check form elements
    await expect(page.locator('#country-select')).toBeVisible();
    await expect(page.locator('#mosque-select')).toBeVisible();
    await expect(page.locator('input[name="padding_before"]')).toBeVisible();
    await expect(page.locator('input[name="padding_after"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load countries in select', async ({ page }) => {
    // Wait for countries to load (more than just the placeholder)
    await page.waitForFunction(() => {
      const select = document.querySelector('#country-select');
      return select && select.options.length > 1;
    }, { timeout: 10000 });
    
    const countrySelect = page.locator('#country-select');
    const options = await countrySelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('should load mosques after country selection', async ({ page }) => {
    // Wait for countries to load
    await page.waitForFunction(() => {
      const select = document.querySelector('#country-select');
      return select && select.options.length > 1;
    }, { timeout: 10000 });
    
    // Select a country
    await page.selectOption('#country-select', { index: 1 });
    
    // Wait for mosques to load
    await page.waitForFunction(() => {
      const select = document.querySelector('#mosque-select');
      return select && select.options.length > 1;
    }, { timeout: 10000 });
    
    const mosqueSelect = page.locator('#mosque-select');
    const options = await mosqueSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('should allow padding configuration', async ({ page }) => {
    const paddingBefore = page.locator('input[name="padding_before"]');
    const paddingAfter = page.locator('input[name="padding_after"]');
    
    // Configure paddings
    await paddingBefore.fill('15');
    await paddingAfter.fill('30');
    
    // Check values
    expect(await paddingBefore.inputValue()).toBe('15');
    expect(await paddingAfter.inputValue()).toBe('30');
  });
});

test.describe('Planner responsive design', () => {
  test('should adapt to different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/planner');
      await page.waitForLoadState('networkidle');
      
      // Check that form is visible
      await expect(page.locator('form')).toBeVisible();
    }
  });
}); 