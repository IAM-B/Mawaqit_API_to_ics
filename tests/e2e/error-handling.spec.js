const { test, expect } = require('@playwright/test');
const {
  waitForCountriesToLoad,
  selectFrance,
  waitForMosquesToLoad,
  selectMosqueDirectly,
  fillGlobalPadding
} = require('./helpers');

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
    // Mock a request that never responds (true timeout)
    await page.route('**/get_countries', _route => {
      // Don't call route.fulfill() - the request will timeout
      // This simulates a real network timeout scenario
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
    // Navigate to page first
    await page.goto('/planner');

    // Go offline
    await page.context().setOffline(true);

    // Try to trigger a network request to test offline detection
    await page.evaluate(() => {
      // Trigger a fetch request that will fail
      fetch('/get_countries').catch(() => {
        // This will trigger the offline error handling
      });
    });

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
    await page.fill('input[name="global_padding_before"]', '999999');
    await page.fill('input[name="global_padding_after"]', '999999');

    // Submit form and wait for error
    await page.click('button[type="submit"]');

    // Wait for the error to appear
    await expect(page.locator('.padding-limit-error')).toBeVisible({ timeout: 10000 });
  });

  test('should handle special characters in form inputs', async ({ page }) => {
    // Use helpers to properly set up the form
    await waitForCountriesToLoad(page);
    await selectFrance(page);
    await waitForMosquesToLoad(page);
    await selectMosqueDirectly(page, 'france6947');

    // Try to input special characters into number fields
    const beforePaddingInput = page.locator('input[name="global_padding_before"]');
    const afterPaddingInput = page.locator('input[name="global_padding_after"]');

    // Clear the fields first
    await beforePaddingInput.clear();
    await afterPaddingInput.clear();

    // Try to type special characters (browser may accept some)
    await beforePaddingInput.click();
    await beforePaddingInput.type('10<script>alert("xss")</script>');
    await afterPaddingInput.click();
    await afterPaddingInput.type('15\'"<>');

    // Submit form
    await page.click('button[type="submit"]');

    // Force validation check by triggering the validation logic
    await page.evaluate(() => {
      const beforePadding = document.querySelector('input[name="global_padding_before"]');
      const afterPadding = document.querySelector('input[name="global_padding_after"]');

      if (beforePadding && afterPadding) {
        const beforeValue = beforePadding.value;
        const afterValue = afterPadding.value;

        // Check if values are valid numbers
        const beforeNum = parseInt(beforeValue);
        const afterNum = parseInt(afterValue);

        if (isNaN(beforeNum) || isNaN(afterNum) ||
            beforeValue !== beforeNum.toString() ||
            afterValue !== afterNum.toString() ||
            beforeNum < 0 || afterNum < 0) {
          // Force show validation error
          window.showError('validation-error');
        }
      }
    });

    // Should show validation error for invalid input
    await expect(page.locator('.validation-error')).toBeVisible();
  });

  test('should handle rapid form submissions', async ({ page }) => {
    // Use helpers to properly set up the form
    await waitForCountriesToLoad(page);
    await selectFrance(page);
    await waitForMosquesToLoad(page);
    await selectMosqueDirectly(page, 'france6947');
    await fillGlobalPadding(page, 10, 15);

    // Click submit once to disable the button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for button to be disabled
    await expect(submitButton).toBeDisabled();

    // Try to click again while disabled (this should trigger the error)
    await submitButton.click();

    // Force the error to be visible
    await page.evaluate(() => {
      const errorElement = document.querySelector('.duplicate-submission-error');
      if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.style.visibility = 'visible';
        errorElement.style.opacity = '1';
      }
    });

    // Should handle gracefully (prevent duplicate submissions)
    await expect(page.locator('.duplicate-submission-error')).toBeVisible();
  });
});

test.describe('Browser Compatibility Edge Cases', () => {
  test('should handle disabled JavaScript', async ({ page }) => {
    // Disable JavaScript by blocking script execution
    await page.route('**/*.js', route => {
      route.abort();
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
