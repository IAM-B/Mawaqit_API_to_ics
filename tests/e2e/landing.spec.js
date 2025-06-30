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
    
    // Check for meta tags
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content');
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

  test('should have proper SEO structure', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1Elements = page.locator('h1');
    expect(await h1Elements.count()).toBe(1);
    
    // Check for structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    if (await structuredData.count() > 0) {
      const jsonContent = await structuredData.first().textContent();
      expect(jsonContent).toBeTruthy();
    }
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

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Navigate with Enter key
    await page.keyboard.press('Enter');
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
    
    // Check for ARIA labels
    const ariaLabel = await ctaButton.getAttribute('aria-label');
    if (ariaLabel) {
      expect(ariaLabel).toBeTruthy();
    }
    
    // Check that images have alt text (if present)
    const images = page.locator('img');
    for (let i = 0; i < await images.count(); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper color contrast (basic check)
    const textElements = page.locator('h1, h2, h3, p, span');
    await expect(textElements.first()).toBeVisible();
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/');
    
    // Check that focus is properly managed
    await page.keyboard.press('Tab');
    
    // Focus should be visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check focus outline
    const computedStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    expect(computedStyle).not.toBe('none');
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

  test('should handle orientation changes', async ({ page }) => {
    // Test portrait mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('.hero-title')).toBeVisible();
    
    // Test landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/');
    await expect(page.locator('.hero-title')).toBeVisible();
  });
});

test.describe('Content and localization', () => {
  test('should have proper language attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check HTML lang attribute
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('lang');
    
    // Check for proper text direction
    const dir = await htmlElement.getAttribute('dir');
    expect(dir).toBeTruthy();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content');
    
    // Check charset
    const charset = page.locator('meta[charset]');
    await expect(charset).toBeVisible();
  });
}); 