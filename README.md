# i18n-validator

> The definitive, type-safe validator, normalizer, and suggester for **all** i18n codes (Languages, Regions, Scripts). **Tiny core (<5kB gzipped!), load only the data you need, dynamically.**

[![NPM version](https://img.shields.io/npm/v/i18n-validator.svg)](https://npmjs.org/package/i18n-validator)
[![License](https://img.shields.io/npm/l/i18n-validator.svg)](https://github.com/YOUR_USERNAME/i18n-validator/blob/main/LICENSE)

## 🌍 The Problem

Handling internationalization codes (languages, regions, scripts) is surprisingly complex. Developers constantly face challenges:

- **Messy Input:** Users enter "english," "us," "chinese traditional," "espnol," requiring normalization to standard codes (`en`, `US`, `zh-Hant`, `es`).
- **Fragmentation:** Needing multiple libraries (`iso-639-1`, `i18n-iso-countries`, etc.) just to cover basic codes, often lacking script (ISO 15924) support crucial for BCP 47.
- **Bundle Bloat:** Existing libraries often bundle huge datasets, inflating your application size even if you only need a few codes.
- **Runtime Overhead:** Loading and parsing large data files at runtime, even for simple lookups.
- **Poor DX:** Lack of TypeScript support, inconsistent APIs, no built-in fuzzy matching or suggestions.

## ✨ The Solution: `i18n-validator`

`i18n-validator` provides a modern, unified, and highly efficient solution:

### 🪶 **Tiny Core & Truly Tree-Shakeable Data**

- The core library logic is extremely small (< 5kB gzipped!).
- **Zero data is bundled by default.** You load **only** the specific language, region, or script data you need at runtime using `configure()`.
- Uses **per-file dynamic imports** (`en.json`, `US.json`, etc.) ensuring minimal runtime memory and I/O for unparalleled efficiency.

### ✅ **Comprehensive & Accurate**

- Covers ISO 639 (1/2/3 Languages), ISO 3166-1 (Regions), and ISO 15924 (Scripts).
- Correctly parses, validates, and composes standard **BCP 47** tags, including script suppression logic.

### 🧠 **Intelligent & User-Friendly**

- **Data-Driven Fuzzy Matching:** Reliably handles typos, variations, and common names ("english", "usa", "simplified chinese", "germn") using rich alias data, *not* hardcoded lists.
- **Helpful Suggestions:** Provides relevant suggestions for invalid or ambiguous input.

### 🚀 **Optimized Performance**

- Validation and suggestions operate *only* on the small data subset you load via `configure()`.
- Minimal runtime overhead due to per-file data loading.

### 🔒 **Type-Safe**

- Built with strict TypeScript for end-to-end type safety.

### ⚙️ **Excellent DX**

- Simple, predictable API (`configure`, `parse`, `suggest`, `validate`).
- **Predefined Groups:** Easily configure common sets like `common-web` or `eu` languages (`configure({ groups: ['common-web'] })`).
- **Rich Feedback:** `parse` and `validate` return detailed `ValidationFeedback` objects with normalization results, component details (including names), and suggestions.
- Zero runtime dependencies.

## 🚀 Quick Start

### 1. Install

```bash
npm install i18n-validator
# or
pnpm add i18n-validator
# or
yarn add i18n-validator
# or
bun add i18n-validator
```

### 2. Configure & Use

```typescript
import { configure, parse, suggest, validate } from 'i18n-validator';

// **Must configure first!** Load only the data you need.
// Example: Load English, Spanish, common web regions, and Latin/Han scripts
await configure({
  languages: ['en', 'es'],
  groups: ['common-web-regions'], // Example predefined group
  scripts: ['Latn', 'Hans', 'Hant']
});

// --- Parse messy input ---
const result1 = parse('English US');
// result1: { isValid: true, normalized: 'en-US', ..., details: { language: { code: 'en', name: 'English', ...}, region: { code: 'US', name: 'United States', ... } } }

const result2 = parse('chinese traditional');
// result2: { isValid: true, normalized: 'zh-Hant', ... }

const result3 = parse('germn');
// result3: { isValid: false, normalized: null, suggestions: ['de'], helpText: '...', ... }
if (!result3.isValid && result3.suggestions.length > 0) {
  console.log(`Did you mean ${result3.suggestions[0]}?`); // Output: Did you mean de?
}

// --- Validate codes ---
const isValidEn = validate('en'); // true (if 'en' was configured)
const isValidFr = validate('fr'); // false (if 'fr' was not configured)
const isValidTag = validate('en-GB'); // Depends on 'en' and 'GB' being configured

// --- Get suggestions ---
const langSuggestions = suggest('esp', { type: 'language' }); // ['es', ...]
const tagSuggestions = suggest('en-ca', { type: 'any' }); // ['en-CA', ...]

console.log(result1.normalized); // Output: en-US
```

## 📖 API Reference

### `configure(options)`

Loads the necessary i18n data dynamically. Must be called before using other functions.

```typescript
interface ConfigureOptions {
  /**
   * Array of language codes to load
   * When provided, only these languages will be available for validation
   * When not provided, all available languages will be loaded
   */
  languages?: string[];

  /**
   * Array of region codes to load
   * When provided, only these regions will be available for validation
   * When not provided, all available regions will be loaded
   */
  regions?: string[];

  /**
   * Array of script codes to load
   * When provided, only these scripts will be available for validation
   * When not provided, all available scripts will be loaded
   */
  scripts?: string[];

  /**
   * Array of predefined groups to load (e.g., 'common-web', 'eu', 'cjk')
   * These will be merged with any explicitly provided codes
   */
  groups?: string[];
}

// Example
await configure({
  languages: ['en', 'fr', 'zh'],
  regions: ['US', 'FR', 'CN'],
  scripts: ['Latn', 'Hans', 'Hant'],
});

// Or using predefined groups
await configure({
  groups: ['common-web']
});
```

### `parse(input)`

Parses a string into its BCP 47 components and returns validation feedback.

```typescript
const result = parse('english us');
// {
//   isValid: true,
//   normalized: 'en-US',
//   details: {
//     language: { code: 'en', valid: true, name: 'English', ... },
//     region: { code: 'US', valid: true, name: 'United States', ... },
//     script: null
//   },
//   helpText: '...',
//   suggestions: []
// }
```

### `validate(input, type)` and `validateBCP47(input)`

Simple boolean validation for different types of i18n codes.

```typescript
validate('en', 'language');       // true/false
validate('US', 'region');         // true/false
validate('Latn', 'script');       // true/false
validateBCP47('en-US-Latn');      // ValidationFeedback object
```

### `suggest(input, options)` and `suggestBCP47(input)`

Get suggestions for ambiguous or misspelled input.

```typescript
suggest('english', { type: 'language' });    // ['en', 'fr', ...]
suggest('united', { type: 'region' });       // ['US', 'GB', ...]
suggest('latin', { type: 'script' });        // ['Latn', ...]
suggestBCP47('english united');              // ValidationFeedback with suggestions
```

## 📊 Comparison

`i18n-validator` provides a unified, efficient alternative to fragmented solutions:

| Feature                      | `i18n-validator`                                      | `iso-639-1` + `i18n-iso-countries` + `bcp-47` + Fuzzy Lib |
| :--------------------------- | :---------------------------------------------------- | :-------------------------------------------------------- |
| **Core JS Size**             | **~<5kB gzipped**                                     | ~15-25kB+ gzipped (combined logic)                        |
| **Data Bundling**            | **ZERO** (Loaded dynamically per file)                | Often bundles significant data OR requires manual loading |
| **Runtime Data Load**        | **Minimal** (Only required small files)               | Often loads/parses large files unnecessarily              |
| **Scope**                    | Lang (1/2/3), Region (1), Script (15924), BCP 47 | Fragmented, often missing scripts or BCP 47             |
| **Fuzzy Matching**           | Built-in, Data-Driven                                 | Requires separate library + integration                   |
| **Suggestions**              | Built-in                                              | Requires custom implementation                            |
| **TypeScript**               | Strict, Integrated                                    | Varies, often requires separate `@types`                  |
| **Ease of Use**              | Simple API (`configure`, `parse`, ...)               | Requires complex integration ("glue code")                |
| **Predefined Groups**        | ✅ Yes                                                | ❌ No                                                     |
| **Enhanced Feedback**        | ✅ Yes (Details, Names)                               | ❌ No                                                     |

## 🧩 Predefined Groups

The library comes with predefined groups for common scenarios:

- `common-web` - Most commonly used codes for web applications
- `eu` - Official EU languages and member state regions
- `cjk` - Chinese, Japanese, and Korean languages, regions, and scripts

## 📃 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚧 Roadmap

- Locale Display Name Formatting (`formatDisplayName('en-US')` -> "English (United States)")
- Support for ISO 3166-2 (Subdivisions) via optional data groups
- Deeper BCP 47 support (variants, extensions) if requested
- Community-contributed predefined groups

## 👩‍💻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
