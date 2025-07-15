const { test, expect } = require('@playwright/test');
const {
  navigateToPlanner,
  waitForCountriesToLoad,
  waitForMosquesToLoad,
  fillGlobalPadding,
  selectFrance,
  selectMosqueDirectly,
  waitForFormSubmission,
  waitForElementStable
} = require('./helpers');

test.describe('Planner Page - Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlanner(page);
  });

  test('should display configuration form', async ({ page }) => {
    await expect(page).toHaveTitle(/Planning synchronisé/);
    await waitForElementStable(page, '#country-select');
    await waitForElementStable(page, '#mosque-select');
    await waitForElementStable(page, 'input[name="global_padding_before"]');
    await waitForElementStable(page, 'input[name="global_padding_after"]');
    await waitForElementStable(page, 'button[type="submit"]');
  });

  test('should load countries in select', async ({ page }) => {
    // Wait for countries to load using helper
    await waitForCountriesToLoad(page);

    // Wait a bit more for TomSelect to populate the options
    await page.waitForTimeout(2000);

    // Check that TomSelect has more than just the placeholder option
    const optionsCount = await page.evaluate(() => {
      const countrySelect = window.countrySelectInstance;
      return countrySelect && countrySelect.options ? Object.keys(countrySelect.options).length : 0;
    });
    expect(optionsCount).toBeGreaterThan(1);
  });

  test('should load mosques after country selection', async ({ page }) => {
    // Select France (which has mosques)
    await selectFrance(page);

    // Wait for mosques to load
    await waitForMosquesToLoad(page);

    // Check that TomSelect has more than just the placeholder option
    const optionsCount = await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      return mosqueSelect && mosqueSelect.options ? Object.keys(mosqueSelect.options).length : 0;
    });
    expect(optionsCount).toBeGreaterThan(1);
  });

  test('should allow padding configuration', async ({ page }) => {
    await fillGlobalPadding(page, 15, 30);
    const paddingBefore = page.locator('input[name="global_padding_before"]');
    const paddingAfter = page.locator('input[name="global_padding_after"]');
    expect(await paddingBefore.inputValue()).toBe('15');
    expect(await paddingAfter.inputValue()).toBe('30');
  });

  test('should generate timeline after mosque selection', async ({ page }) => {
    // Complete setup with France
    await selectFrance(page);
    await waitForMosquesToLoad(page);

    // Select first mosque
    await selectMosqueDirectly(page, 'france6947');

    // Fill padding
    await fillGlobalPadding(page, 10, 15);

    // Submit form and wait for timeline
    const result = await waitForFormSubmission(page);
    expect(result).toBe('success');
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
      await navigateToPlanner(page);
      await waitForElementStable(page, 'form');
    }
  });
});
