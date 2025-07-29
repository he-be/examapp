import { describe, test, expect } from 'vitest';
import { getRandomItem, sampleData } from '../index';

// Cloudflare Workers環境をモック
const mockRequest = (url: string, method = 'GET') => new Request(url, { method });

describe('AI-Driven Development Sample App', () => {
  describe('getRandomItem function', () => {
    test('should return a valid item from sampleData', () => {
      const result = getRandomItem();
      expect(sampleData).toContain(result);
    });

    test('should return one of the five possible items', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(getRandomItem());
      }
      expect(results.size).toBeGreaterThan(0);
      expect(results.size).toBeLessThanOrEqual(sampleData.length);
    });
  });

  describe('Worker fetch handler', () => {
    test('should handle root path request', async () => {
      // Dynamic import for worker
      const worker = await import('../index');
      const request = mockRequest('https://example.com/');
      
      const response = await worker.default.fetch(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/html');
      
      const html = await response.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>');
      expect(html).toContain('class="message"');
      expect(html).toContain('Generate New');
    });

    test('should handle API endpoint', async () => {
      const worker = await import('../index');
      const request = mockRequest('https://example.com/api/random');
      
      const response = await worker.default.fetch(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      
      const json = await response.json() as { message: string };
      expect(sampleData).toContain(json.message);
    });

    test('should return 404 for unknown paths', async () => {
      const worker = await import('../index');
      const request = mockRequest('https://example.com/unknown');
      
      const response = await worker.default.fetch(request);
      
      expect(response.status).toBe(404);
      expect(await response.text()).toBe('Not Found');
    });

    test('should include proper cache headers for HTML', async () => {
      const worker = await import('../index');
      const request = mockRequest('https://example.com/');
      
      const response = await worker.default.fetch(request);
      
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });
  });
});
