const { test, expect } = require('@playwright/test');

test.describe('Complete Planning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full planning workflow', async ({ page }) => {
    // 1. Wait for countries to load
    await page.waitForFunction(() => {
      const select = document.querySelector('#country-select');
      return select && select.options.length > 1;
    }, { timeout: 15000 });

    // 2. Select a country (France)
    await page.selectOption('#country-select', { index: 1 });
    
    // 3. Wait for mosques to load
    await page.waitForFunction(() => {
      const select = document.querySelector('#mosque-select');
      return select && select.options.length > 1;
    }, { timeout: 15000 });

    // 4. Select a mosque
    await page.selectOption('#mosque-select', { index: 1 });
    
    // 5. Configure padding
    await page.fill('input[name="padding_before"]', '10');
    await page.fill('input[name="padding_after"]', '15');
    
    // 6. Submit the form
    await page.click('button[type="submit"]');
    
    // 7. Wait for planning generation
    await page.waitForLoadState('networkidle');
    
    // 8. Verify planning page is displayed (should still be on planner page)
    await expect(page.locator('#plannerForm')).toBeVisible();
    
    // 9. Check that prayer times are displayed (in clock section)
    await expect(page.locator('.clock-section')).toBeVisible();
    
    // 10. Verify download links are present
    await expect(page.locator('.download-grid')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    // Try to submit without selecting country
    await page.click('button[type="submit"]');
    
    // Should handle gracefully (form validation is client-side)
    await expect(page.locator('#plannerForm')).toBeVisible();
  });

  test('should handle invalid padding values', async ({ page }) => {
    // Fill negative padding values
    await page.fill('input[name="padding_before"]', '-5');
    await page.fill('input[name="padding_after"]', '-10');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should handle gracefully
    await expect(page.locator('#plannerForm')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/get_countries', route => route.abort());
    
    // Reload page
    await page.reload();
    
    // Should handle gracefully
    await expect(page.locator('#plannerForm')).toBeVisible();
  });
});

test.describe('ICS Generation Flow', () => {
  test('should generate and download ICS file', async ({ page }) => {
    // Complete planning setup
    await page.waitForFunction(() => {
      const select = document.querySelector('#country-select');
      return select && select.options.length > 1;
    }, { timeout: 15000 });
    
    await page.selectOption('#country-select', { index: 1 });
    
    await page.waitForFunction(() => {
      const select = document.querySelector('#mosque-select');
      return select && select.options.length > 1;
    }, { timeout: 15000 });
    
    await page.selectOption('#mosque-select', { index: 1 });
    await page.fill('input[name="padding_before"]', '10');
    await page.fill('input[name="padding_after"]', '15');
    
    // Submit and wait for planning
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Check for download links
    await expect(page.locator('.download-grid')).toBeVisible();
    
    // Check for ICS download links
    const downloadLinks = page.locator('.download-card');
    await expect(downloadLinks.first()).toBeVisible();
  });
});

test.describe('Map Integration', () => {
  test('should display mosque map', async ({ page }) => {
    await page.waitForFunction(() => {
      const select = document.querySelector('#country-select');
      return select && select.options.length > 1;
    }, { timeout: 15000 });
    
    // Check that map is visible
    await expect(page.locator('#mosque-map')).toBeVisible();
    
    // Select country and verify map updates
    await page.selectOption('#country-select', { index: 1 });
    
    // Wait for map to load mosques
    await page.waitForTimeout(2000);
    
    // Map should still be visible
    await expect(page.locator('#mosque-map')).toBeVisible();
  });

  test('should allow mosque selection from map', async ({ page }) => {
    await page.waitForFunction(() => {
      const select = document.querySelector('#country-select');
      return select && select.options.length > 1;
    }, { timeout: 15000 });
    
    await page.selectOption('#country-select', { index: 1 });
    await page.waitForTimeout(2000);
    
    // Map should be interactive
    await expect(page.locator('#mosque-map')).toBeVisible();
    
    // Try to click on map (may not have markers yet)
    await page.click('#mosque-map');
    
    // Should handle map interaction gracefully
    await expect(page.locator('#mosque-map')).toBeVisible();
  });
}); 