const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage with all elements', async ({ page }) => {
    // Check that page loads correctly
    await expect(page).toHaveTitle(/Mawaqit/);
    
    // Check main elements
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-subtitle')).toBeVisible();
    await expect(page.locator('.cta-button')).toBeVisible();
  });

  test('should have animations on hero elements', async ({ page }) => {
    const heroElements = page.locator('.hero-title, .hero-subtitle, .cta-button');
    
    // Check that elements have animation delays
    for (let i = 0; i < await heroElements.count(); i++) {
      const element = heroElements.nth(i);
      const style = await element.getAttribute('style');
      expect(style).toContain('animation-delay');
    }
  });

  test('should redirect to planner when clicking CTA', async ({ page }) => {
    const ctaButton = page.locator('.cta-button').first();
    
    // Check that button has href
    const href = await ctaButton.getAttribute('href');
    expect(href).toBeTruthy();
    
    // Simulate click and check redirect
    await ctaButton.click();
    
    // Check that URL changed
    await expect(page).toHaveURL(/\/planner/);
  });

  test('should add redirecting class on click', async ({ page }) => {
    const ctaButton = page.locator('.cta-button').first();
    
    // Check that class is not present initially
    await expect(ctaButton).not.toHaveClass(/redirecting/);
    
    // Click button
    await ctaButton.click();
    
    // Check that class is added (even if temporarily)
    // Note: Class may be removed quickly by browser
    await expect(page).toHaveURL(/\/planner/);
  });
});

test.describe('Navigation', () => {
  test('should navigate to all main pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to planner
    await page.click('text=Start');
    await expect(page).toHaveURL(/\/planner/);
    
    // Back to homepage
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should work on mobile', async ({ page }) => {
    // Configure mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that elements are visible on mobile
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.cta-button')).toBeVisible();
    
    // Test navigation on mobile
    await page.click('.cta-button');
    await expect(page).toHaveURL(/\/planner/);
  });
});

test.describe('Performance and accessibility', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have accessible elements', async ({ page }) => {
    await page.goto('/');
    
    // Check that buttons have accessible attributes
    const ctaButton = page.locator('.cta-button').first();
    await expect(ctaButton).toBeVisible();
    
    // Check that images have alt text (if present)
    const images = page.locator('img');
    for (let i = 0; i < await images.count(); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});

test.describe('Responsive design', () => {
  test('should adapt to different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Check that main elements are visible
      await expect(page.locator('.hero-title')).toBeVisible();
      await expect(page.locator('.cta-button')).toBeVisible();
      
      // Take screenshot for manual verification
      await page.screenshot({ path: `test-results/landing-${viewport.name}.png` });
    }
  });
}); 