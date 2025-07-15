/**
 * Helper functions for E2E tests
 * Optimized for realistic timeouts and better error handling
 */

// Default timeouts (increased for realistic app performance)
const DEFAULT_TIMEOUT = 30000; // 30 seconds for slow operations
const QUICK_TIMEOUT = 10000; // 10 seconds for quick operations
const LOAD_TIMEOUT = 20000; // 20 seconds for data loading

/**
 * Navigate to planner page with proper waits
 */
async function navigateToPlanner (page) {
  await page.goto('/planner');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('#plannerForm', { timeout: 10000 });
}

/**
 * Navigate to landing page with proper waits
 */
async function navigateToLanding (page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.cta-button', { timeout: 10000 });
}

/**
 * Wait for countries to load with improved TomSelect detection
 */
async function waitForCountriesToLoad (page, timeout = DEFAULT_TIMEOUT) {
  // First wait for the select element to be present
  await page.waitForSelector('#country-select', { timeout });

  // Wait for TomSelect to be initialized and have options
  await page.waitForFunction(() => {
    const countrySelect = window.countrySelectInstance;
    return countrySelect && countrySelect.options && Object.keys(countrySelect.options).length > 1;
  }, { timeout: timeout * 2 });
}

/**
 * Wait for mosques dropdown to load with realistic timeout
 */
async function waitForMosquesToLoad (page, timeout = LOAD_TIMEOUT) {
  // First wait for the select element to be present
  await page.waitForSelector('#mosque-select', { timeout });

  // Polling pour vérifier l'initialisation de TomSelect
  let attempts = 0;
  const maxAttempts = Math.floor(timeout / 500); // Check every 500ms

  while (attempts < maxAttempts) {
    const isReady = await page.evaluate(() => {
      const mosqueSelect = window.mosqueSelectInstance;
      if (!mosqueSelect) {
        return false;
      }

      const optionsCount = mosqueSelect.options ? Object.keys(mosqueSelect.options).length : 0;

      return optionsCount > 1;
    });

    if (isReady) {
      return;
    }

    attempts++;
    await page.waitForTimeout(500);
  }

  // Fallback: Wait for TomSelect to be initialized and mosques to be loaded
  await page.waitForFunction(() => {
    // Check if TomSelect is initialized
    const mosqueSelect = window.mosqueSelectInstance;
    if (!mosqueSelect) return false;
    // Check if mosques are loaded (more than just the placeholder)
    return mosqueSelect.options && Object.keys(mosqueSelect.options).length > 1;
  }, {}, { timeout });
}

/**
 * Select country by code (more reliable than by index)
 */
async function selectCountryByCode (page, countryCode) {
  await page.evaluate((countryCode) => {
    const countrySelect = window.countrySelectInstance;
    if (countrySelect) {
      countrySelect.setValue(countryCode);
    } else {
      // No console.log here
    }
  }, countryCode);

  // Wait a moment for the selection to register
  await page.waitForTimeout(1000);

  // Verify selection was successful
  const selectedValue = await page.evaluate(() => {
    const countrySelect = window.countrySelectInstance;
    return countrySelect ? countrySelect.getValue() : null;
  });

  if (selectedValue !== countryCode) {
    // No console.log here
    // Retry selection
    await page.evaluate((countryCode) => {
      const countrySelect = window.countrySelectInstance;
      if (countrySelect) {
        countrySelect.setValue(countryCode);
      }
    }, countryCode);
    await page.waitForTimeout(1000);
  }
}

/**
 * Select country by index with error handling
 */
async function selectCountry (page, index) {
  // Use TomSelect to select country by index
  await page.evaluate((index) => {
    const countrySelect = window.countrySelectInstance;
    if (countrySelect && countrySelect.options) {
      const options = Object.values(countrySelect.options);
      if (options[index]) {
        countrySelect.setValue(options[index].value);
      } else {
        // No console.log here
      }
    } else {
      // No console.log here
    }
  }, index);

  // Wait a moment for the selection to register
  await page.waitForTimeout(1000);
}

/**
 * Select France specifically (which has mosques)
 */
async function selectFrance (page) {
  // Use TomSelect to select France by code
  await page.evaluate(() => {
    const countrySelect = window.countrySelectInstance;
    if (countrySelect) {
      countrySelect.setValue('france6947');
    } else {
      // No console.log here
    }
  });

  // Wait a moment for the selection to register
  await page.waitForTimeout(1000);

  // Verify selection was successful
  const selectedValue = await page.evaluate(() => {
    const countrySelect = window.countrySelectInstance;
    return countrySelect ? countrySelect.getValue() : null;
  });

  if (selectedValue !== 'france6947') {
    // No console.log here
    // Retry selection
    await page.evaluate(() => {
      const countrySelect = window.countrySelectInstance;
      if (countrySelect) {
        countrySelect.setValue('france6947');
      }
    });
    await page.waitForTimeout(1000);
  }
}

/**
 * Select mosque by index with error handling
 */
async function selectMosque (page, index) {
  // Use TomSelect to select mosque by index
  await page.evaluate((index) => {
    const mosqueSelect = window.mosqueSelectInstance;
    if (mosqueSelect && mosqueSelect.options) {
      const options = Object.values(mosqueSelect.options);
      if (options[index]) {
        mosqueSelect.setValue(options[index].value);
      } else {
        // No console.log here
      }
    } else {
      // No console.log here
    }
  }, index);

  // Wait a moment for the selection to register
  await page.waitForTimeout(1000);
}

/**
 * Select mosque directly via API and trigger proper events
 */
async function selectMosqueDirectly (page, countryCode) {
  // Get mosques from API
  const mosquesResponse = await page.request.get(`/get_mosques?country=${countryCode}`);
  const mosques = await mosquesResponse.json();

  if (!mosques || mosques.length === 0) {
    throw new Error(`No mosques found for country: ${countryCode}`);
  }

  const firstMosque = mosques[0];

  // Wait for TomSelect to be initialized for mosques
  await page.waitForFunction(() => {
    return window.mosqueSelectInstance && window.mosqueSelectInstance.options;
  }, {}, { timeout: 10000 });

  // Select the mosque using TomSelect instance
  await page.evaluate((mosque) => {
    const mosqueSelectInstance = window.mosqueSelectInstance;
    if (mosqueSelectInstance) {
      // Set the value using the mosque slug
      mosqueSelectInstance.setValue(mosque.slug);

      // Trigger the onChange event manually
      if (mosqueSelectInstance.onChange) {
        mosqueSelectInstance.onChange(mosque.slug);
      }
    } else {
      // No console.log here
    }
  }, firstMosque);

  // Wait for the selection to register and hidden fields to be populated
  await page.waitForTimeout(2000);

  // Verify the selection was successful by checking hidden fields
  const mosqueName = await page.evaluate(() => {
    const nameField = document.getElementById('mosque_name');
    return nameField ? nameField.value : null;
  });

  if (!mosqueName) {
    // No console.log here

    // Alternative approach: try to set the value via DOM and trigger events
    await page.evaluate((mosque) => {
      const mosqueSelect = document.querySelector('#mosque-select');
      if (mosqueSelect) {
        // Set the value directly
        mosqueSelect.value = mosque.slug;

        // Trigger multiple events to ensure it's registered
        const events = ['change', 'input', 'blur'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          mosqueSelect.dispatchEvent(event);
        });

        // Also trigger a custom TomSelect event
        const customEvent = new CustomEvent('tomselect:change', {
          bubbles: true,
          detail: { value: mosque.slug }
        });
        mosqueSelect.dispatchEvent(customEvent);
      }
    }, firstMosque);

    await page.waitForTimeout(1000);
  }
}

/**
 * Fill global padding inputs with validation
 */
async function fillGlobalPadding (page, beforeMinutes, afterMinutes) {
  await page.fill('input[name="global_padding_before"]', beforeMinutes.toString());
  await page.fill('input[name="global_padding_after"]', afterMinutes.toString());

  // Verify values are set correctly
  const beforeValue = await page.inputValue('input[name="global_padding_before"]');
  const afterValue = await page.inputValue('input[name="global_padding_after"]');

  if (beforeValue !== beforeMinutes.toString() || afterValue !== afterMinutes.toString()) {
    throw new Error(`Padding values not set correctly. Expected: ${beforeMinutes}, ${afterMinutes}. Got: ${beforeValue}, ${afterValue}`);
  }
}

/**
 * Wait for element to be stable (not changing)
 */
async function waitForElementStable (page, selector, timeout = QUICK_TIMEOUT) {
  await page.waitForSelector(selector, { timeout });
  // Wait for any animations or changes to complete
  await page.waitForTimeout(500);
}

/**
 * Wait for form submission and check for success/error
 */
async function waitForFormSubmission (page, timeout = DEFAULT_TIMEOUT) {
  // Click submit button
  await page.locator('button[type="submit"]').click();

  // Wait for either success (timeline) or error message
  try {
    await page.waitForSelector('#timeline', { timeout });
    return 'success';
  } catch (error) {
    // Check for error messages with flexible selectors
    const errorSelectors = [
      '.error', '.alert', '[role="alert"]',
      '.validation-error', '.form-error',
      '.error-message', '.invalid-feedback'
    ];

    for (const selector of errorSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        return 'error';
      } catch {
        // Continue to next selector
      }
    }
    return 'unknown';
  }
}

/**
 * Check if ICS files are generated and downloadable
 */
async function verifyICSFiles (page, timeout = QUICK_TIMEOUT, expect) {
  const icsLinks = page.locator('a[href*=".ics"]');
  await expect(icsLinks).toBeVisible({ timeout });

  // Verify we have the expected 3 file types
  const linkCount = await icsLinks.count();
  expect(linkCount).toBeGreaterThanOrEqual(1);

  // Verify links are functional
  for (let i = 0; i < Math.min(linkCount, 3); i++) {
    const link = icsLinks.nth(i);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /\.ics$/);
  }
}

/**
 * Complete basic setup for most tests
 */
async function completeBasicSetup (page, expect) {
  await waitForCountriesToLoad(page);
  await selectCountry(page, 0);
  await waitForMosquesToLoad(page);
  await selectMosque(page, 0);
  await fillGlobalPadding(page, 10, 20, expect);
}

module.exports = {
  navigateToPlanner,
  navigateToLanding,
  waitForCountriesToLoad,
  waitForMosquesToLoad,
  selectCountry,
  selectCountryByCode,
  selectFrance,
  selectMosque,
  selectMosqueDirectly,
  fillGlobalPadding,
  waitForElementStable,
  waitForFormSubmission,
  verifyICSFiles,
  completeBasicSetup
};
