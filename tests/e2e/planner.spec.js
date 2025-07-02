const { test, expect } = require('@playwright/test');
const { 
  navigateToPlanner, 
  waitForCountriesToLoad, 
  waitForMosquesToLoad, 
  fillGlobalPadding,
  selectCountry,
  selectMosque,
  waitForElementStable
} = require('./helpers');

test.describe('Planner Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlanner(page);
  });

  test('should display configuration form', async ({ page }) => {
    // Check that page loads correctly
    await expect(page).toHaveTitle(/Planning synchronisé/);
    
    // Check form elements with stable waiting
    await waitForElementStable(page, '#country-select');
    await waitForElementStable(page, '#mosque-select');
    await waitForElementStable(page, 'input[name="global_padding_before"]');
    await waitForElementStable(page, 'input[name="global_padding_after"]');
    await waitForElementStable(page, 'button[type="submit"]');
  });

  test('should load countries in select', async ({ page }) => {
    // Wait for countries to load using helper
    await waitForCountriesToLoad(page);
    
    const countrySelect = page.locator('#country-select');
    const options = await countrySelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('should load mosques after country selection', async ({ page }) => {
    // Wait for countries to load
    await waitForCountriesToLoad(page);
    
    // Select a country
    await selectCountry(page, 1);
    
    // Wait for mosques to load
    await waitForMosquesToLoad(page);
    
    const mosqueSelect = page.locator('#mosque-select');
    const options = await mosqueSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
  });

  test('should allow padding configuration', async ({ page }) => {
    // Configure paddings using helper
    await fillGlobalPadding(page, 15, 30);
    
    // Check values
    const paddingBefore = page.locator('input[name="global_padding_before"]');
    const paddingAfter = page.locator('input[name="global_padding_after"]');
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
      await navigateToPlanner(page);
      
      // Check that forms are visible
      await waitForElementStable(page, '#plannerForm');
      await waitForElementStable(page, '#configForm');
    }
  });
});
