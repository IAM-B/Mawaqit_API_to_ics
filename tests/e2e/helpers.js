/**
 * Helper functions for E2E tests
 * Provides common utilities to make tests more robust and readable
 */

/**
 * Wait for countries to load in the select dropdown
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds (default: 15000)
 */
async function waitForCountriesToLoad(page, timeout = 15000) {
  // First wait for the select to be present
  await page.waitForSelector('#country-select', { state: 'visible', timeout: 5000 });
  
  // Then wait for options to load
  await page.waitForFunction(() => {
    const select = document.querySelector('#country-select');
    return select && select.options.length > 1;
  }, { timeout });
}

/**
 * Wait for mosques to load in the select dropdown
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds (default: 15000)
 */
async function waitForMosquesToLoad(page, timeout = 15000) {
  // First wait for the select to be present and enabled
  await page.waitForSelector('#mosque-select', { state: 'visible', timeout: 5000 });
  
  // Then wait for options to load
  await page.waitForFunction(() => {
    const select = document.querySelector('#mosque-select');
    return select && select.options.length > 1;
  }, { timeout });
}

/**
 * Fill global padding configuration
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} before - Padding before prayer in minutes
 * @param {number} after - Padding after prayer in minutes
 */
async function fillGlobalPadding(page, before, after) {
  await page.fill('input[name="global_padding_before"]', before.toString());
  await page.fill('input[name="global_padding_after"]', after.toString());
}

/**
 * Select a country by index
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} index - Index of the country to select (default: 1)
 */
async function selectCountry(page, index = 1) {
  await page.selectOption('#country-select', { index });
}

/**
 * Select a mosque by index
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} index - Index of the mosque to select (default: 1)
 */
async function selectMosque(page, index = 1) {
  await page.selectOption('#mosque-select', { index });
}

/**
 * Wait for page to be fully loaded and ready
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function waitForPageReady(page) {
  await page.waitForLoadState('domcontentloaded');
  // Don't wait for networkidle as it can be unreliable
  // Instead, wait for key elements to be present
  await page.waitForTimeout(1000);
}

/**
 * Check if element is visible and stable
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
async function waitForElementStable(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  // Wait a bit more for any animations to complete
  await page.waitForTimeout(1000);
}

/**
 * Navigate to planner page and wait for it to be ready
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function navigateToPlanner(page) {
  await page.goto('/planner');
  await waitForPageReady(page);
}

/**
 * Navigate to landing page and wait for it to be ready
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function navigateToLanding(page) {
  await page.goto('/');
  await waitForPageReady(page);
}

module.exports = {
  waitForCountriesToLoad,
  waitForMosquesToLoad,
  fillGlobalPadding,
  selectCountry,
  selectMosque,
  waitForPageReady,
  waitForElementStable,
  navigateToPlanner,
  navigateToLanding
}; 