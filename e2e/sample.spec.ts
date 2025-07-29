import { test, expect } from '@playwright/test';

test.describe('AI-Driven Development Sample App E2E Tests', () => {
  test('should display sample page with valid message', async ({ page }) => {
    // Navigate to the sample page
    await page.goto('/');

    // Check page title contains one of our sample messages
    await expect(page).toHaveTitle(/Hello|World|AI|Driven|Development/);

    // Check that the page contains a message
    const messageElement = page.locator('.message');
    await expect(messageElement).toBeVisible();

    // Check that the message is one of the valid sample data
    const messageText = await messageElement.textContent();
    expect(['Hello', 'World', 'AI', 'Driven', 'Development']).toContain(messageText);

    // Check that the "Generate New" button is present and clickable
    const generateButton = page.locator('a:has-text("Generate New")');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toHaveAttribute('href', '/');
  });

  test('should be able to generate new messages', async ({ page }) => {
    await page.goto('/');

    // Click "Generate New" button
    await page.click('a:has-text("Generate New")');

    // Wait for page to reload and check that we have a message
    await page.waitForLoadState('networkidle');
    const messageElement = page.locator('.message');
    await expect(messageElement).toBeVisible();

    // Verify the new message is valid
    const newMessage = await messageElement.textContent();
    expect(['Hello', 'World', 'AI', 'Driven', 'Development']).toContain(newMessage || '');
  });

  test('should return valid JSON from API endpoint', async ({ page }) => {
    // Make a direct request to the API endpoint
    const response = await page.request.get('/api/random');
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/json');
    expect(response.headers()['access-control-allow-origin']).toBe('*');

    const jsonData = await response.json();
    expect(jsonData).toHaveProperty('message');
    expect(['Hello', 'World', 'AI', 'Driven', 'Development']).toContain(jsonData.message);
  });

  test('should return 404 for unknown paths', async ({ page }) => {
    const response = await page.request.get('/unknown-path');
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });

  test('should have proper cache headers', async ({ page }) => {
    const response = await page.request.get('/');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-cache');
    expect(response.headers()['content-type']).toContain('text/html');
  });
});
