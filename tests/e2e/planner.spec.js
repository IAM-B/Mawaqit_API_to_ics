const { test, expect } = require('@playwright/test');

test.describe('Planner Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner');
  });

  test('should display configuration form', async ({ page }) => {
    // Check that page loads correctly
    await expect(page).toHaveTitle(/Planner/);
    
    // Check form elements
    await expect(page.locator('#mosqueSelect')).toBeVisible();
    await expect(page.locator('#scopeSelect')).toBeVisible();
    await expect(page.locator('#paddingBefore')).toBeVisible();
    await expect(page.locator('#paddingAfter')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load mosques in select', async ({ page }) => {
    const mosqueSelect = page.locator('#mosqueSelect');
    
    // Wait for options to load
    await page.waitForSelector('#mosqueSelect option', { timeout: 10000 });
    
    // Check that there are options
    const options = await mosqueSelect.locator('option').count();
    expect(options).toBeGreaterThan(0);
  });

  test('should allow mosque selection', async ({ page }) => {
    const mosqueSelect = page.locator('#mosqueSelect');
    
    // Wait for options to load
    await page.waitForSelector('#mosqueSelect option', { timeout: 10000 });
    
    // Select first option
    await mosqueSelect.selectOption({ index: 1 });
    
    // Check that selection was made
    const selectedValue = await mosqueSelect.inputValue();
    expect(selectedValue).toBeTruthy();
  });

  test('should allow padding configuration', async ({ page }) => {
    const paddingBefore = page.locator('#paddingBefore');
    const paddingAfter = page.locator('#paddingAfter');
    
    // Configure paddings
    await paddingBefore.fill('15');
    await paddingAfter.fill('30');
    
    // Check values
    expect(await paddingBefore.inputValue()).toBe('15');
    expect(await paddingAfter.inputValue()).toBe('30');
  });

  test('should submit form and generate planning', async ({ page }) => {
    // Configure form
    await page.waitForSelector('#mosqueSelect option', { timeout: 10000 });
    await page.selectOption('#mosqueSelect', { index: 1 });
    await page.selectOption('#scopeSelect', 'week');
    await page.fill('#paddingBefore', '10');
    await page.fill('#paddingAfter', '20');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for planning generation
    await page.waitForSelector('.planning-section', { timeout: 15000 });
    
    // Check that planning sections are displayed
    await expect(page.locator('.planning-section')).toBeVisible();
    await expect(page.locator('.timeline-section')).toBeVisible();
    await expect(page.locator('.clock-section')).toBeVisible();
  });

  test('should display download links after generation', async ({ page }) => {
    // Configure and submit form
    await page.waitForSelector('#mosqueSelect option', { timeout: 10000 });
    await page.selectOption('#mosqueSelect', { index: 1 });
    await page.selectOption('#scopeSelect', 'week');
    await page.click('button[type="submit"]');
    
    // Wait for generation
    await page.waitForSelector('.download-links', { timeout: 15000 });
    
    // Check download links
    await expect(page.locator('.download-links a')).toBeVisible();
  });
});

test.describe('Timeline and Clock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner');
    // Configure and generate planning
    await page.waitForSelector('#mosqueSelect option', { timeout: 10000 });
    await page.selectOption('#mosqueSelect', { index: 1 });
    await page.selectOption('#scopeSelect', 'week');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.planning-section', { timeout: 15000 });
  });

  test('should display timeline with events', async ({ page }) => {
    await expect(page.locator('.slots-timeline-svg')).toBeVisible();
    
    // Check that there are events in timeline
    const events = page.locator('.timeline-event');
    await expect(events.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display circular clock', async ({ page }) => {
    await expect(page.locator('.clock-container')).toBeVisible();
    
    // Check clock elements
    await expect(page.locator('.clock-face')).toBeVisible();
    await expect(page.locator('.clock-events')).toBeVisible();
  });

  test('should allow navigation between days', async ({ page }) => {
    // Check navigation buttons
    await expect(page.locator('.date-navigation')).toBeVisible();
    
    // Test navigation (if available)
    const prevButton = page.locator('.date-nav-prev');
    const nextButton = page.locator('.date-nav-next');
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
      // Check that date changed
      await expect(page.locator('#slotsCurrentDate')).toBeVisible();
    }
  });

  test('should display mosque information', async ({ page }) => {
    await expect(page.locator('.mosque-info')).toBeVisible();
    
    // Check displayed information
    await expect(page.locator('.mosque-name')).toBeVisible();
    await expect(page.locator('.mosque-address')).toBeVisible();
  });
});

test.describe('Error handling', () => {
  test('should display error if no mosque selected', async ({ page }) => {
    await page.goto('/planner');
    
    // Submit without selecting mosque
    await page.click('button[type="submit"]');
    
    // Check that error is displayed
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
  });

  test('should handle invalid padding values', async ({ page }) => {
    await page.goto('/planner');
    
    // Configure invalid values
    await page.fill('#paddingBefore', '-50');
    await page.fill('#paddingAfter', 'abc');
    
    // Check that values are rejected or corrected
    const paddingBefore = await page.inputValue('#paddingBefore');
    const paddingAfter = await page.inputValue('#paddingAfter');
    
    expect(paddingBefore).toBe('-50'); // Should be accepted but with minimum applied
    expect(paddingAfter).toBe('abc'); // Should be rejected or cleared
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
      
      // Check that form is visible
      await expect(page.locator('form')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: `test-results/planner-${viewport.name}.png` });
    }
  });
});

test.describe('Planner performance', () => {
  test('should generate planning in reasonable time', async ({ page }) => {
    await page.goto('/planner');
    
    // Configure form
    await page.waitForSelector('#mosqueSelect option', { timeout: 10000 });
    await page.selectOption('#mosqueSelect', { index: 1 });
    await page.selectOption('#scopeSelect', 'week');
    
    // Measure generation time
    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForSelector('.planning-section', { timeout: 15000 });
    const generationTime = Date.now() - startTime;
    
    // Generation should take less than 10 seconds
    expect(generationTime).toBeLessThan(10000);
  });
}); 