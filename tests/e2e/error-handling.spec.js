const { test, expect } = require('@playwright/test');

test.describe('Error Handling and Edge Cases', () => {
  test('should handle 404 errors gracefully', async ({ page }) => {
    // Try to access non-existent page
    await page.goto('/non-existent-page');
    
    // Should show 404 error page
    await expect(page.locator('.error-404')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Page non trouvée');
    
    // Should have link back to homepage
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('should handle 500 server errors', async ({ page }) => {
    // Mock server error by intercepting API calls
    await page.route('**/get_countries', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/planner');
    
    // Should show error state
    await expect(page.locator('.error-state')).toBeVisible();
  });

  test('should handle network timeouts', async ({ page }) => {
    // Mock slow network response
    await page.route('**/get_countries', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }, 10000); // 10 second delay
    });
    
    await page.goto('/planner');
    
    // Should show loading state
    await expect(page.locator('.loading-spinner')).toBeVisible();
    
    // Should eventually timeout and show error
    await expect(page.locator('.timeout-error')).toBeVisible({ timeout: 15000 });
  });

  test('should handle empty API responses', async ({ page }) => {
    // Mock empty response
    await page.route('**/get_countries', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/planner');
    
    // Should show empty state message
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-message')).toContainText('Aucun pays disponible');
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    // Mock malformed JSON
    await page.route('**/get_countries', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{ invalid json }'
      });
    });
    
    await page.goto('/planner');
    
    // Should show parsing error
    await expect(page.locator('.json-error')).toBeVisible();
  });

  test('should handle offline mode', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.goto('/planner');
    
    // Should show offline message
    await expect(page.locator('.offline-message')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should recover automatically
    await page.reload();
    await expect(page.locator('#country-select')).toBeVisible();
  });
});

test.describe('Form Validation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
  });

  test('should handle extremely large padding values', async ({ page }) => {
    // Fill very large padding values
    await page.fill('input[name="padding_before"]', '999999');
    await page.fill('input[name="padding_after"]', '999999');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show validation error for unreasonable values
    await expect(page.locator('.padding-limit-error')).toBeVisible();
  });

  test('should handle special characters in form inputs', async ({ page }) => {
    // Wait for countries to load
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
    
    // Test special characters in padding
    await page.fill('input[name="padding_before"]', '10<script>alert("xss")</script>');
    await page.fill('input[name="padding_after"]', '15\'"<>');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should handle gracefully (either sanitize or show error)
    await expect(page.locator('.planning-container, .validation-error')).toBeVisible();
  });

  test('should handle rapid form submissions', async ({ page }) => {
    // Wait for form to be ready
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
    
    // Rapidly click submit multiple times
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await submitButton.click();
    await submitButton.click();
    
    // Should handle gracefully (prevent duplicate submissions)
    await expect(page.locator('.planning-container, .duplicate-submission-error')).toBeVisible();
  });
});

test.describe('Browser Compatibility Edge Cases', () => {
  test('should handle disabled JavaScript', async ({ page }) => {
    // Disable JavaScript
    await page.addInitScript(() => {
      // Disable all JavaScript execution
      Object.defineProperty(window, 'eval', { value: () => {} });
    });
    
    await page.goto('/planner');
    
    // Should show noscript message or fallback
    await expect(page.locator('.noscript-message, .js-required')).toBeVisible();
  });

  test('should handle very small viewport', async ({ page }) => {
    // Set very small viewport
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('/planner');
    
    // Should still be usable
    await expect(page.locator('#plannerForm')).toBeVisible();
    await expect(page.locator('#country-select')).toBeVisible();
  });

  test('should handle very large viewport', async ({ page }) => {
    // Set very large viewport
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/planner');
    
    // Should still look good
    await expect(page.locator('#plannerForm')).toBeVisible();
    
    // Check that layout doesn't break
    const formRect = await page.locator('#plannerForm').boundingBox();
    expect(formRect.width).toBeLessThan(1200); // Should not stretch too wide
  });
}); 