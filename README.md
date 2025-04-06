# ALIAS Research - i18n-validator

> A modern, lightweight, and type-safe toolkit for validating, normalizing, and resolving language and region codes using ISO 639, ISO 3166, and BCP 47.

---

## 🌍 Why?

Most i18n tools leave normalization to you:
- `french` → `fr`?
- `zh-Hant-HK` → is that valid?
- Is `pt-BR` different from `pt`?

`i18n-validator` solves this by providing:
- ✅ BCP 47-aware language + region normalization
- ✅ Tree-shakable modules per language/region
- ✅ Alias matching (`"english"` → `"en"`)
- ✅ Typed metadata (`bcp47`, `region`, `native name`, etc.)
- ✅ Works in CLI tools, web apps, and translation APIs

---

## 🚀 Who is this for?

- Frontend devs using i18n in React, Vue, Svelte, etc.
- Builders of i18n tooling and CLIs
- Plugin and SDK authors needing safe locale handling
- Developers calling translation APIs (LLMs, Google, DeepL)

---

## 📦 Installation

```bash
# npm
npm install i18n-validator

# pnpm
pnpm add i18n-validator

# bun
bun add i18n-validator
```

## 📦 Usage (Examples Coming Soon)
```typescript
import { normalizeLanguage } from 'i18n-validator';

normalizeLanguage('french');  // → { bcp47: 'fr', name: 'French', ... }
normalizeLanguage('zh-hant-hk');  // → { bcp47: 'zh-Hant-HK', region: 'HK', ... }
```

## 🔍 Autocomplete + Type Safety (Coming soon)
```typescript
type SupportedLanguages = 'en' | 'fr' | 'pt-BR' | ...;
```

## 📁 Lightweight + Modular
```typescript
import { normalizeLanguage } from 'i18n-validator/languages/normalize';
import { commonLanguages } from 'i18n-validator/groups/common';
```

## 📖 Standards Supported
- ISO 639-1 / 639-2 / 639-3
- ISO 3166-1 alpha-2
- BCP 47 language tags
- Unicode scripts (Latn, Hant, etc.)

## 🧪 Tested + Typed
- Built with TypeScript
- Tested with Vitest
- Linted with Biome

## 🛠️ Coming Soon
- i18n-validator update to regenerate files
- VS Code/Cursor/Zed Autocomplete
- CLI playground
