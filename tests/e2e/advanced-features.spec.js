const { test, expect } = require('@playwright/test');
const {
  navigateToPlanner,
  waitForCountriesToLoad,
  selectCountry,
  fillGlobalPadding
} = require('./helpers');

test.describe('Advanced Features - Important but Non-Critical', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPlanner(page, expect);
  });

  test('should toggle slot segmentation mode', async ({ page }) => {
    // Complete basic setup with Algeria (has mosques)
    await waitForCountriesToLoad(page, 15000);
    await selectCountry(page, 'algerie6641');
    await page.waitForTimeout(2000); // Laisse plus de temps au chargement des mosquées

    // Attendre que TomSelect soit initialisé pour les mosquées
    await page.waitForFunction(() => {
      return window.mosqueSelectInstance && window.mosqueSelectInstance.options;
    }, { timeout: 10000 });

    // Sélectionner la première mosquée via TomSelect
    await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      if (mosqueSelect && mosqueSelect.options) {
        const options = Object.values(mosqueSelect.options);
        if (options.length > 0) {
          mosqueSelect.setValue(options[0].value);
        }
      }
    });

    await page.waitForTimeout(1000);
    await fillGlobalPadding(page, 10, 20, expect);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for timeline to appear
    await expect(page.locator('#timeline')).toBeVisible({ timeout: 10000 });

    // Look for segmentation toggle button
    const toggleButton = page.locator('button:has-text("Mode découpé"), button:has-text("Segmented Mode")');

    if (await toggleButton.isVisible()) {
      // Test toggle functionality
      await toggleButton.click();

      // Verify visual change (segmented slots should appear)
      await expect(page.locator('.segmented-slot, .slot-segment')).toBeVisible();

      // Toggle back
      await toggleButton.click();
    }
  });

  test('should display circular clock with configuration', async ({ page }) => {
    // Complete basic setup with Algeria
    await waitForCountriesToLoad(page, 15000);
    await selectCountry(page, 'algerie6641');
    await page.waitForTimeout(2000);

    // Attendre que TomSelect soit initialisé pour les mosquées
    await page.waitForFunction(() => {
      return window.mosqueSelectInstance && window.mosqueSelectInstance.options;
    }, { timeout: 10000 });

    // Sélectionner la première mosquée via TomSelect
    await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      if (mosqueSelect && mosqueSelect.options) {
        const options = Object.values(mosqueSelect.options);
        if (options.length > 0) {
          mosqueSelect.setValue(options[0].value);
        }
      }
    });

    await page.waitForTimeout(1000);
    await fillGlobalPadding(page, 10, 20, expect);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for timeline to appear
    await expect(page.locator('#timeline')).toBeVisible({ timeout: 10000 });

    // Look for clock component
    const clockElement = page.locator('#clock, .clock-container, .circular-clock');

    if (await clockElement.isVisible()) {
      // Verify clock is interactive
      await expect(clockElement).toBeVisible();

      // Test clock configuration if available
      const clockConfig = page.locator('#clockConfig, .clock-config');
      if (await clockConfig.isVisible()) {
        await expect(clockConfig).toBeVisible();
      }
    }
  });

  test('should handle responsive design on different screen sizes', async ({ page }) => {
    await navigateToPlanner(page, expect);

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('#plannerForm')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#plannerForm')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#plannerForm')).toBeVisible();

    // Verify form elements remain accessible
    await expect(page.locator('#country-select')).toBeVisible();
    await expect(page.locator('#mosque-select')).toBeVisible();
  });

  test('should provide navigation between landing and planner pages', async ({ page }) => {
    // Test navigation from landing to planner
    await page.goto('/');
    await expect(page.locator('button[data-action="start-planning"]').first()).toBeVisible();

    // Clic JS direct pour éviter l'instabilité
    await page.evaluate(() => {
      document.querySelectorAll('button[data-action="start-planning"]')[0].click();
    });

    // Should navigate to planner
    await expect(page).toHaveURL(/\/planner/);
    await expect(page.locator('#plannerForm')).toBeVisible();

    // Test back navigation (if available)
    const backButton = page.locator('a[href="/"], button:has-text("Retour"), .back-button');
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should display prayer times in timeline correctly', async ({ page }) => {
    // Complete setup and generation with Algeria
    await waitForCountriesToLoad(page, 15000);
    await selectCountry(page, 'algerie6641');
    await page.waitForTimeout(2000);

    // Attendre que TomSelect soit initialisé pour les mosquées
    await page.waitForFunction(() => {
      return window.mosqueSelectInstance && window.mosqueSelectInstance.options;
    }, { timeout: 10000 });

    // Sélectionner la première mosquée via TomSelect
    await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      if (mosqueSelect && mosqueSelect.options) {
        const options = Object.values(mosqueSelect.options);
        if (options.length > 0) {
          mosqueSelect.setValue(options[0].value);
        }
      }
    });

    await page.waitForTimeout(1000);
    await fillGlobalPadding(page, 10, 20, expect);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for timeline
    await expect(page.locator('#timeline')).toBeVisible({ timeout: 10000 });

    // Verify prayer times are displayed
    const prayerSlots = page.locator('.prayer-slot, .prayer-time');
    await expect(prayerSlots).toHaveCount(5); // Fajr, Dhuhr, Asr, Maghrib, Isha

    // Verify time format is correct (HH:MM)
    for (let i = 0; i < 5; i++) {
      const slot = prayerSlots.nth(i);
      const timeText = await slot.textContent();
      expect(timeText).toMatch(/\d{1,2}:\d{2}/);
    }
  });
});

test.describe('Performance and UX - Non-Critical', () => {
  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await navigateToPlanner(page, expect);
    await expect(page.locator('#plannerForm')).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should provide user feedback during form submission', async ({ page }) => {
    // Complete setup with Algeria
    await waitForCountriesToLoad(page, 15000);
    await selectCountry(page, 'algerie6641');
    await page.waitForTimeout(2000);

    // Attendre que TomSelect soit initialisé pour les mosquées
    await page.waitForFunction(() => {
      return window.mosqueSelectInstance && window.mosqueSelectInstance.options;
    }, { timeout: 10000 });

    // Sélectionner la première mosquée via TomSelect
    await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      if (mosqueSelect && mosqueSelect.options) {
        const options = Object.values(mosqueSelect.options);
        if (options.length > 0) {
          mosqueSelect.setValue(options[0].value);
        }
      }
    });

    await page.waitForTimeout(1000);
    await fillGlobalPadding(page, 10, 20, expect);

    // Submit form and check for loading state
    await page.locator('button[type="submit"]').click();

    // Check for loading indicator or disabled state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled({ timeout: 5000 });

    // Wait for completion
    await expect(page.locator('#timeline')).toBeVisible({ timeout: 10000 });
  });
});
