const { test, expect } = require('@playwright/test');
const {
  navigateToPlanner,
  waitForCountriesToLoad,
  waitForMosquesToLoad,
  selectCountry,
  selectCountryByCode,
  fillGlobalPadding,
  waitForElementStable
} = require('./helpers');

test.describe('Planner Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlanner(page, expect);
  });

  test('should display configuration form', async ({ page }) => {
    await expect(page).toHaveTitle(/Planning synchronisé/);
    await waitForElementStable(page, '#country-select');
    await waitForElementStable(page, '#mosque-select');
    await waitForElementStable(page, 'input[name="global_padding_before"]');
    await waitForElementStable(page, 'input[name="global_padding_after"]');
    await waitForElementStable(page, 'button[type="submit"]');
    // Vérifier que les éléments sont bien visibles
    await expect(page.locator('#country-select')).toBeVisible();
    await expect(page.locator('#mosque-select')).toBeVisible();
    await expect(page.locator('input[name="global_padding_before"]')).toBeVisible();
    await expect(page.locator('input[name="global_padding_after"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load countries in select', async ({ page }) => {
    await waitForCountriesToLoad(page);
    const countrySelect = page.locator('#country-select');
    // Vérifier que le select est bien initialisé
    await expect(countrySelect).toBeVisible();
    // Vérifier que TomSelect a bien chargé les pays via JavaScript
    await page.waitForFunction(() => {
      return window.countrySelectInstance &&
        window.countrySelectInstance.options &&
        Object.keys(window.countrySelectInstance.options).length > 1;
    }, { timeout: 10000 });
  });

  test('should load mosques after country selection', async ({ page }) => {
    await waitForCountriesToLoad(page);
    // Utiliser la sélection par code pays (plus fiable)
    await selectCountryByCode(page, 'algerie6641');
    await waitForMosquesToLoad(page);
    const mosqueSelect = page.locator('#mosque-select');
    // Vérifier que le select mosquée est bien activé
    await expect(mosqueSelect).toBeEnabled();
    // Vérifier que TomSelect a bien chargé les mosquées via JavaScript
    await page.waitForFunction(() => {
      return window.mosqueSelectInstance &&
        window.mosqueSelectInstance.options &&
        Object.keys(window.mosqueSelectInstance.options).length > 1;
    }, { timeout: 15000 });
  });

  test('should allow padding configuration', async ({ page }) => {
    await fillGlobalPadding(page, 15, 30, expect);
    const paddingBefore = page.locator('input[name="global_padding_before"]');
    const paddingAfter = page.locator('input[name="global_padding_after"]');
    expect(await paddingBefore.inputValue()).toBe('15');
    expect(await paddingAfter.inputValue()).toBe('30');
    // Vérifier que les champs sont bien remplis et visibles
    await expect(paddingBefore).toBeVisible();
    await expect(paddingAfter).toBeVisible();
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
      await navigateToPlanner(page, expect);
      await waitForElementStable(page, '#plannerForm');
      await waitForElementStable(page, '#configForm');
      // Vérifier que les formulaires sont visibles sur chaque viewport
      await expect(page.locator('#plannerForm')).toBeVisible();
      await expect(page.locator('#configForm')).toBeVisible();
    }
  });
});
