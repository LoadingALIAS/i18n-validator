# Test Utilities for i18n-validator

This directory contains utilities specifically designed for testing the i18n-validator library without affecting the production bundle size.

## Philosophy

The core philosophy is to maintain a strict separation between production code and test-specific code. This ensures:

1. **Minimal Production Bundle Size**: No test-specific code or data should appear in the production bundle.
2. **Realistic Testing**: Tests should accurately reflect the behavior of the production code.
3. **Clean Codebase**: Test-specific logic is isolated and easier to maintain.

## Key Files

- `test-utils.ts` - The main file containing test utilities, mock data management, and test-specific logic.

## Best Practices

### 1. Keep Test-Specific Code Separate

Always place test-specific logic in the `tests/utils` directory, not in the production code:

```typescript
// GOOD: Logic in test-utils.ts
import { prioritizeRegions } from '../utils/test-utils';
const result = prioritizeRegions(rawResults);

// BAD: Special case in production code
if (process.env.NODE_ENV === 'test') {
  // Special case for tests
}
```

### 2. Use Mocking for Special Test Cases

For test-specific behavior, use Vitest mocking instead of modifying production code:

```typescript
vi.mock('../../utils/test-utils', async () => {
  const actual = await vi.importActual('../../utils/test-utils');
  return {
    ...actual,
    isValidLanguageCode: vi.fn((code) => {
      // Special case for tests
      if (code === 'xx') return false;
      return actual.isValidLanguageCode(code);
    })
  };
});
```

### 3. Replicate Production Logic Only When Necessary

Only replicate logic from production code when absolutely necessary for testing. In most cases, prefer to:

1. Mock the production function
2. Import and use the actual production function 
3. If needed, create a test-specific version with a clear suffix (e.g., `testComposeBCP47`)

### 4. Document Test Utilities

Always add JSDoc comments to explain what the test utility does and why it exists.

## Common Patterns

### Test Data Management

The test utilities provide functions to manage test data:

```typescript
// Set up test data
setTestData(mockLanguages, mockRegions, mockScripts);

// Access test data
const languages = getTestLanguages();

// Reset test state
resetTestData();
```

### Test-Specific Logic

For test-specific behaviors like prioritization:

```typescript
// Apply test-specific prioritization
const prioritizedResults = prioritizeScripts(fuzzyResults);
```

### Mocking Core Modules

For comprehensive test coverage without production impact:

```typescript
// Mock a core module for specific test cases
vi.mock('../src/core/parser', async () => {
  const original = await vi.importActual('../src/core/parser');
  return {
    ...original,
    parse: vi.fn((input) => {
      // Test case handling
      if (input === 'special-case') {
        return { isValid: true, /* ... */ };
      }
      return original.parse(input);
    })
  };
});
```

## When to Extend Test Utilities

Add to the test utilities when:

1. You need logic that's only relevant for tests
2. You're replicating special cases across multiple test files
3. You need to manage test-specific state or data

---

Following these patterns will help maintain a high-quality test suite without compromising the production bundle size or performance. 