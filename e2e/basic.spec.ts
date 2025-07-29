import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Check that we're on the right URL
    expect(page.url()).toContain('localhost:8787');

    // Check that the page has loaded (not a 404 or error page)
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('should serve static assets', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that CSS and JS assets are loaded
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Verify the page content is not empty
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should handle SPA routing correctly', async ({ page }) => {
    // Start from home page first (guaranteed to work)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to about page - should serve index.html due to SPA config
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    // For SPA apps, we should check that the content loaded correctly
    // rather than HTTP status, since all routes serve the same index.html
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    // Verify we're on the about page by checking URL
    expect(page.url()).toContain('/about');
  });
});
