import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSessionCodeFromUrl, buildSessionLink, clearSessionCodeFromUrl } from './useSessionLink';

describe('useSessionLink', () => {
  let originalLocation;
  let originalHistory;

  beforeEach(() => {
    originalLocation = window.location;
    originalHistory = window.history;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSessionCodeFromUrl', () => {
    function setUrl(url) {
      Object.defineProperty(window, 'location', {
        value: new URL(url),
        writable: true,
        configurable: true
      });
    }

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true
      });
    });

    it('returns uppercase code for valid 6-char alphanumeric join param', () => {
      setUrl('https://example.com/?join=abc123');
      expect(getSessionCodeFromUrl()).toBe('ABC123');
    });

    it('returns code when already uppercase', () => {
      setUrl('https://example.com/?join=XYZ789');
      expect(getSessionCodeFromUrl()).toBe('XYZ789');
    });

    it('returns code for mixed-case input', () => {
      setUrl('https://example.com/?join=AbCdEf');
      expect(getSessionCodeFromUrl()).toBe('ABCDEF');
    });

    it('returns null when no join param exists', () => {
      setUrl('https://example.com/');
      expect(getSessionCodeFromUrl()).toBeNull();
    });

    it('returns null for empty join param', () => {
      setUrl('https://example.com/?join=');
      expect(getSessionCodeFromUrl()).toBeNull();
    });

    it('returns null for code shorter than 6 characters', () => {
      setUrl('https://example.com/?join=ABC12');
      expect(getSessionCodeFromUrl()).toBeNull();
    });

    it('returns null for code longer than 6 characters', () => {
      setUrl('https://example.com/?join=ABC1234');
      expect(getSessionCodeFromUrl()).toBeNull();
    });

    it('returns null for code with special characters', () => {
      setUrl('https://example.com/?join=ABC12!');
      expect(getSessionCodeFromUrl()).toBeNull();
    });

    it('returns null for code with spaces', () => {
      setUrl('https://example.com/?join=ABC%2012');
      expect(getSessionCodeFromUrl()).toBeNull();
    });

    it('handles other query params alongside join', () => {
      setUrl('https://example.com/?foo=bar&join=ABC123&baz=qux');
      expect(getSessionCodeFromUrl()).toBe('ABC123');
    });

    it('returns code for all-numeric codes', () => {
      setUrl('https://example.com/?join=123456');
      expect(getSessionCodeFromUrl()).toBe('123456');
    });

    it('returns code for all-alpha codes', () => {
      setUrl('https://example.com/?join=abcdef');
      expect(getSessionCodeFromUrl()).toBe('ABCDEF');
    });
  });

  describe('buildSessionLink', () => {
    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true
      });
    });

    it('builds a full URL with the join param', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com', pathname: '/' },
        writable: true,
        configurable: true
      });

      const link = buildSessionLink('ABC123');
      expect(link).toBe('https://example.com/?join=ABC123');
    });

    it('preserves pathname in the URL', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'https://example.com', pathname: '/app/' },
        writable: true,
        configurable: true
      });

      const link = buildSessionLink('XYZ789');
      expect(link).toBe('https://example.com/app/?join=XYZ789');
    });

    it('uses current origin', () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000', pathname: '/' },
        writable: true,
        configurable: true
      });

      const link = buildSessionLink('TEST01');
      expect(link).toBe('http://localhost:3000/?join=TEST01');
    });
  });

  describe('clearSessionCodeFromUrl', () => {
    let replaceStateSpy;

    beforeEach(() => {
      replaceStateSpy = vi.fn();
      Object.defineProperty(window, 'history', {
        value: { ...originalHistory, replaceState: replaceStateSpy, state: null },
        writable: true,
        configurable: true
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'history', {
        value: originalHistory,
        writable: true,
        configurable: true
      });
    });

    it('removes the join param from the URL', () => {
      Object.defineProperty(window, 'location', {
        value: new URL('https://example.com/?join=ABC123'),
        writable: true,
        configurable: true
      });

      clearSessionCodeFromUrl();

      expect(replaceStateSpy).toHaveBeenCalledOnce();
      const newUrl = replaceStateSpy.mock.calls[0][2];
      expect(newUrl).not.toContain('join=');
    });

    it('preserves other query params', () => {
      Object.defineProperty(window, 'location', {
        value: new URL('https://example.com/?foo=bar&join=ABC123&baz=qux'),
        writable: true,
        configurable: true
      });

      clearSessionCodeFromUrl();

      const newUrl = replaceStateSpy.mock.calls[0][2];
      expect(newUrl).toContain('foo=bar');
      expect(newUrl).toContain('baz=qux');
      expect(newUrl).not.toContain('join=');
    });

    it('does not call replaceState when no join param exists', () => {
      Object.defineProperty(window, 'location', {
        value: new URL('https://example.com/?foo=bar'),
        writable: true,
        configurable: true
      });

      clearSessionCodeFromUrl();

      expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('does not call replaceState for plain URL', () => {
      Object.defineProperty(window, 'location', {
        value: new URL('https://example.com/'),
        writable: true,
        configurable: true
      });

      clearSessionCodeFromUrl();

      expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('passes current history state to replaceState', () => {
      Object.defineProperty(window, 'location', {
        value: new URL('https://example.com/?join=ABC123'),
        writable: true,
        configurable: true
      });
      window.history.state = { key: 'test' };

      clearSessionCodeFromUrl();

      expect(replaceStateSpy.mock.calls[0][0]).toEqual({ key: 'test' });
    });
  });
});
