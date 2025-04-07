import { test, expect } from 'vitest';
import { isValidLanguageCode, parseBCP47 } from '../../src';

test('smoke test - core functionality works', () => {
  expect(isValidLanguageCode('en')).toBe(true);
  expect(isValidLanguageCode('xyz')).toBe(false);
});

test('smoke test - BCP47 parsing works', () => {
  const result = parseBCP47('en-US');
  expect(result).toBeTruthy();
  expect(result?.language).toBe('en');
  expect(result?.region).toBe('US');
}); 