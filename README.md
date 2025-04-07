# i18n-validator

> A modern, type-safe validator for language codes, regions, and scripts - with full BCP 47 support.

## Features

- 🌍 **Complete Coverage**: Supports ISO-639 (1/2/3), ISO-3166 (1/2), and ISO-15924 scripts
- 🎯 **Type Safe**: Full TypeScript support with literal union types
- 📦 **Tree-Shakable**: Import only what you need
- ⚡ **Fast**: Built-in caching and optimized for performance
- 🔍 **Smart Matching**: Fuzzy search and suggestions for near matches
- 📝 **BCP 47 Compliant**: Full support for language-script-region tags

## Installation

```bash
npm install i18n-validator
```

## Usage Guide

### Quick Start

```typescript
import { defaultValidator } from 'i18n-validator';

// Simple validation
const result = defaultValidator.validate('en-US');
// { isValid: true, normalized: 'en-US' }

// Fuzzy matching
const fuzzy = defaultValidator.validate('english_usa');
// { 
//   isValid: false, 
//   normalized: 'en-US',
//   suggestions: ['en-US', 'en-GB'],
//   helpText: 'Did you mean: en-US?' 
// }

// Script detection
const chinese = defaultValidator.validate('zh-hk');
// { isValid: true, normalized: 'zh-Hant-HK' }
```

### Custom Validator

Create a validator tailored to your needs:

```typescript
import { createValidator } from 'i18n-validator';

// Builder pattern
const validator = createValidator()
  .withLanguages(['en', 'es', 'fr'])
  .withRegions(['US', 'GB', 'ES'])
  .withOptions({
    mode: 'fuzzy',
    suggestions: true,
    cache: {
      strategy: 'lru',
      maxSize: 1000,
      ttl: 3600000 // 1 hour
    }
  });

// Or configuration object
const validator2 = createValidator({
  languages: ['en', 'es', 'fr'],
  regions: ['US', 'GB', 'ES'],
  options: {
    mode: 'strict',
    type: 'bcp47'
  }
});
```

### Dynamic Data Loading

Load only the data you need, when you need it:

```typescript
import { loadLanguages, loadGroup, preloadGroup } from 'i18n-validator';

// Load specific languages
const languages = await loadLanguages(['en', 'es', 'fr']);

// Load pre-defined groups
const european = await loadGroup('european');
const asian = await loadGroup('asian');

// Preload group with data
const cyrillicData = await preloadGroup('cyrillic');
```

### Web Applications

Perfect for language selectors and i18n configuration:

```typescript
import { createValidator } from 'i18n-validator';
import { loadGroup } from 'i18n-validator';

// React language selector example
async function LanguageSelector({ onChange }) {
  const europeanLangs = await loadGroup('european');
  const validator = createValidator()
    .withLanguages(europeanLangs)
    .withOptions({ mode: 'fuzzy' });

  return (
    <select onChange={(e) => {
      const result = validator.validate(e.target.value);
      if (result.isValid) onChange(result.normalized);
    }}>
      {europeanLangs.map(lang => (
        <option key={lang} value={lang}>{lang}</option>
      ))}
    </select>
  );
}
```

### Backend Validation

Robust API and database validation:

```typescript
import { createValidator } from 'i18n-validator';

// Create a validator for your API
const validator = createValidator()
  .withOptions({
    mode: 'strict',
    type: 'bcp47',
    suggestions: true
  });

// Express middleware example
function validateLocale(req, res, next) {
  const result = validator.validate(req.headers['accept-language']);
  
  if (!result.isValid) {
    return res.status(400).json({
      error: 'Invalid locale',
      suggestions: result.suggestions
    });
  }
  
  req.locale = result.normalized;
  next();
}
```

### Error Handling

Comprehensive error handling with specific error types:

```typescript
import { createValidator, I18nValidationError } from 'i18n-validator';

try {
  const validator = createValidator()
    .withLanguages(['en', 'fr'])
    .withOptions({ mode: 'strict' });
    
  const result = validator.validate('invalid');
} catch (error) {
  if (error instanceof I18nValidationError) {
    console.error('Validation error:', error.message);
    // Access additional error data
    console.log('Code:', error.code);
  }
}
```

### Bundle Size Optimization

The library is fully tree-shakeable. Here's how to keep your bundle size minimal:

1. **Use the Default Validator for Simple Cases**:

   ```typescript
   // ✅ Good - minimal import
   import { defaultValidator } from 'i18n-validator';
   ```

2. **Create Custom Validators for Specific Needs**:

   ```typescript
   // ✅ Good - only what you need
   import { createValidator } from 'i18n-validator';
   const validator = createValidator()
     .withLanguages(['en', 'es']);
   ```

3. **Dynamic Imports for Large Groups**:

   ```typescript
   // ✅ Best - load on demand
   const { europeanLanguages } = await import('i18n-validator/groups/common');
   ```

## Updating Language Data

Keep your language data up-to-date with official sources:

```bash
npm run update
```

This will fetch the latest data from:

- IANA Language Subtag Registry
- ISO 639-1/2/3 Language Codes
- ISO 3166-1/2 Region Codes
- ISO 15924 Script Codes

## License

MIT
