# i18n-validator

> Lightweight, tree-shakeable validation & normalization for language, region, and script codes.

## Features

- **Zero runtime dependencies** - Minimal core, no external dependencies
- **Truly tree-shakeable** - Load only the data you need with the `configure` function
- **Fuzzy matching** - Accept diverse inputs like "english us", "chinese traditional", "german"
- **BCP 47 support** - Parse and compose valid BCP 47 language tags
- **Type safety** - Full TypeScript support with accurate types

## Installation

```bash
npm install i18n-validator
# or
yarn add i18n-validator
# or
pnpm add i18n-validator
```

## Quick Start

```typescript
import { configure, parse, suggest, validate } from 'i18n-validator';

// First, configure which language/region/script data to load
await configure({
  languages: ['en', 'fr', 'es', 'zh'],   // Load only these language codes
  regions: ['US', 'FR', 'ES', 'GB'],     // Load only these region codes
  scripts: ['Latn', 'Hans', 'Hant'],     // Load only these script codes
});

// Now you can use the library functions:

// Parse and normalize input into a BCP 47 tag
const result = parse('english united states');
console.log(result);
// {
//   normalizedTag: 'en-US',
//   valid: true,
//   language: { code: 'en', valid: true, ... },
//   region: { code: 'US', valid: true, ... },
//   script: null,
//   ...
// }

// Validate codes or tags
const isValid = validate('en', 'language'); // true
const isValidTag = validate('en-US', 'bcp47'); // true

// Get suggestions for fuzzy input
const suggestions = suggest('franch', { type: 'language' });
// ['fr', 'es', ...]

// Get BCP 47 tag suggestions
const tagSuggestions = suggestBCP47('english united');
// ['en-US', 'en-GB', ...]
```

## Core Concepts

This library takes a different approach:

1. **Dynamic data loading**: Instead of bundling all i18n data, you explicitly specify which codes to load
2. **Fuzzy matching**: Accepts informal input like "english", "chinese simplified", "french france"
3. **Modular design**: Four core functions provide all functionality while keeping bundle size minimal

## API Reference

### `configure(options)`

Loads the necessary i18n data dynamically. Must be called before using other functions.

```typescript
type ConfigureOptions = {
  languages?: string[];  // ISO 639-1 codes to load
  regions?: string[];    // ISO 3166-1 alpha-2 codes to load
  scripts?: string[];    // ISO 15924 codes to load
};

await configure({
  languages: ['en', 'fr', 'zh'],
  regions: ['US', 'FR', 'CN'],
  scripts: ['Latn', 'Hans', 'Hant'],
});
```

### `parse(input)`

Parses a string into its BCP 47 components and returns validation feedback.

```typescript
const result = parse('english us');
// {
//   normalizedTag: 'en-US',
//   valid: true,
//   language: { code: 'en', valid: true, input: 'english', ... },
//   region: { code: 'US', valid: true, input: 'us', ... },
//   script: null,
//   feedback: { ... }
// }
```

### `validate(input, type)`

Simple boolean validation for different types of i18n codes.

```typescript
validate('en', 'language');       // true/false
validate('US', 'region');         // true/false
validate('Latn', 'script');       // true/false
validateBCP47('en-US-Latn');      // true/false (shorthand for 'bcp47' type)
```

### `suggest(input, options)`

Get suggestions for ambiguous or misspelled input.

```typescript
suggest('english', { type: 'language' });    // ['en', 'fr', ...]
suggest('united', { type: 'region' });       // ['US', 'GB', ...]
suggest('latin', { type: 'script' });        // ['Latn', ...]
suggestBCP47('english united');              // ['en-US', 'en-GB', ...]
```

## Use Cases

- **User input handling**: Convert informal text input like "english" or "german" into standardized codes
- **Autocomplete**: Provide fuzzy suggestions for language/region selection
- **Tag normalization**: Convert between different formats and apply proper casing
- **Lightweight applications**: Keep bundle size small by loading only required data

## Bundle Size Impact

The core library is around 5KB gzipped. Data is loaded on-demand, so your application only includes what you specifically request. This gives you explicit control over the bundle size impact.

## License

MIT
