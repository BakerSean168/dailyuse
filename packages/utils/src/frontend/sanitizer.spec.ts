import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sanitizeHtml } from './sanitizer';

describe('sanitizeHtml', () => {
  it('should return an empty string if input is empty', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
  });

  it('should return an empty string if DOMParser is unavailable', () => {
    const originalDOMParser = globalThis.DOMParser;
    delete (globalThis as any).DOMParser;
    expect(sanitizeHtml('<p>Hello</p>')).toBe('');
    globalThis.DOMParser = originalDOMParser;
  });

  describe('with DOMParser', () => {
    it('should keep allowed tags and attributes', () => {
      const input = '<p class="text-bold">Hello <strong>world</strong></p>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<p class="text-bold">Hello <strong>world</strong></p>');
    });

    it('should remove disallowed tags but keep their text content', () => {
      const input = '<div>Hello <unknown>tag</unknown><span>there</span></div>';
      const output = sanitizeHtml(input);
      expect(output).toContain('Hello tag');
      expect(output).toContain('there');
      expect(output).not.toContain('<unknown>');
    });

    it('should discard dangerous tags and their content', () => {
      const input = '<div>Hello <script>alert("xss")</script><span>there</span></div>';
      const output = sanitizeHtml(input);
      expect(output).toContain('Hello');
      expect(output).toContain('there');
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert("xss")');
    });

    it('should remove disallowed attributes', () => {
      const input = '<p onclick="alert(1)" class="safe">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<p class="safe">Text</p>');
      expect(output).not.toContain('onclick');
    });

    it('should block dangerous protocols in href and src', () => {
      const input = '<a href="javascript:alert(1)">Click me</a><img src="data:image/png;base64,..." />';
      const output = sanitizeHtml(input);
      expect(output).toBe('<a>Click me</a><img src="data:image/png;base64,...">');
      // wait, data:image/png is allowed in my v2.
      // let's re-verify protocol regex: /^(https?|mailto|tel|#|data:image\/)/i
      expect(output).toContain('src="data:image/png');
    });

    it('should block dangerous data protocols', () => {
        const input = '<a href="data:text/html,<html>...">Link</a>';
        const output = sanitizeHtml(input);
        expect(output).toBe('<a>Link</a>');
        expect(output).not.toContain('href');
    });

    it('should allow safe protocols in href and src', () => {
      const input = '<a href="https://example.com">Link</a><img src="/path/to/img.png" />';
      const output = sanitizeHtml(input);
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('src="/path/to/img.png"');
    });

    it('should handle complex nested structures', () => {
      const input = `
        <div class="container">
          <h1>Title</h1>
          <ul>
            <li>Item 1</li>
            <li><a href="/test">Item 2</a></li>
          </ul>
          <table>
            <thead><tr><th>Header</th></tr></thead>
            <tbody><tr><td>Cell</td></tr></tbody>
          </table>
        </div>
      `.trim();
      const output = sanitizeHtml(input);
      expect(output).toContain('<div class="container">');
      expect(output).toContain('<h1>Title</h1>');
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>Item 1</li>');
      expect(output).toContain('<a href="/test">Item 2</a>');
      expect(output).toContain('<table>');
      expect(output).toContain('<thead>');
      expect(output).toContain('<th>Header</th>');
    });
  });
});
