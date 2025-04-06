# i18n-validator

<p align="center">
  <strong>The Valibot of i18n – type-safe, minimal, and blazingly fast.</strong>
  <br />
  <em>Finally, a single source of truth for language codes that just works™</em>
</p>

<p align="center">
  <a href="https://npm.im/i18n-validator"><img src="https://img.shields.io/npm/v/i18n-validator" alt="npm version"></a>
  <a href="https://npm.im/i18n-validator"><img src="https://img.shields.io/npm/dm/i18n-validator" alt="npm downloads"></a>
  <a href="https://bundlephobia.com/package/i18n-validator"><img src="https://img.shields.io/bundlephobia/minzip/i18n-validator" alt="bundle size"></a>
  <a href="https://github.com/your-username/i18n-validator/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/i18n-validator" alt="license"></a>
</p>

## 🌟 Why i18n-validator?

Stop wrestling with language codes. Whether you're building a CLI tool, validating API inputs, or handling i18n in your frontend, you need reliable language code validation that:

- ✅ **Just works** with any input (`"english"`, `"en"`, `"eng"`, `"en-US"`, `"en_us"`)
- 🎯 **Always returns** the correct, normalized BCP 47 code
- 💪 **Type-safe** with full TypeScript support
- 🚀 **Tree-shakable** – only bundle what you use
- 🔍 **Framework agnostic** – works everywhere

```typescript
import { validate } from 'i18n-validator';

// All of these just work:
validate('english');    // ✅ -> { code: 'en', ... }
validate('eng-us');    // ✅ -> { code: 'en-US', ... }
validate('zh_hant_hk'); // ✅ -> { code: 'zh-Hant-HK', ... }
```

## 🚀 Quick Start

```bash
npm i i18n-validator   # npm
pnpm add i18n-validator   # pnpm
bun add i18n-validator    # bun
```

### Basic Usage

```typescript
import { normalize } from 'i18n-validator';

// Simple language normalization
normalize('french');  // -> { code: 'fr', name: 'French', ... }

// With regions
normalize('canadian french');  // -> { code: 'fr-CA', ... }

// Full BCP 47 support
normalize('zh-hant-hk');  // -> { code: 'zh-Hant-HK', ... }
```

## 🎯 Perfect For

- **CLI Tools** – Handle user input gracefully
  ```typescript
  import { createPrompt } from 'i18n-validator/cli';

  const answer = await createPrompt()
    .ask('Source language?')
    .suggest(['en', 'fr', 'es']);
  ```

- **Frontend i18n** – Validate configs & user preferences
  ```typescript
  import { createValidator } from 'i18n-validator';

  const validator = createValidator(['en', 'fr']);
  validator.isValid('en-US'); // true
  ```

- **API Validation** – Ensure correct language codes
  ```typescript
  import { validateLanguage } from 'i18n-validator';

  app.use((req, res, next) => {
    const lang = validateLanguage(req.headers['accept-language']);
    req.language = lang;
    next();
  });
  ```

## 💡 Features

### Smart Validation
- 🎯 Validates against ISO 639-1, 639-2, 639-3
- 🌍 Full ISO 3166-1 region support
- 📝 BCP 47 compliance with script subtags
- 🔍 Fuzzy matching for human inputs

### Developer Experience
- 📦 Tree-shakable exports
- 🔒 Full TypeScript support
- 🚀 Zero dependencies
- ⚡ Blazingly fast

### Advanced Features
- 🎮 CLI integration helpers
- 🔄 Framework adapters
- 🎨 Custom validation rules
- 📊 Analytics & debugging tools

## 📚 Documentation

### Basic Validation
```typescript
import { validate } from 'i18n-validator';

validate('english');     // ✅
validate('eng-us');      // ✅
validate('zh_hant_hk');  // ✅
validate('not-a-lang');  // ❌
```

### Advanced Usage
```typescript
import { createValidator } from 'i18n-validator';

const validator = createValidator({
  languages: ['en', 'fr'],
  regions: ['US', 'CA'],
  fuzzy: true
});

validator.validate('canadian french');
// -> { code: 'fr-CA', confidence: 0.95 }
```

## 🛠 Contributing

We love contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

## 📜 License

MIT © [Your Name]

---

<p align="center">
  Built with ❤️ for the i18n community
</p>
```
