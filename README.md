# ALIAS Research - i18n-validator — Language & Region Codes Toolkit

> A blazing-fast, type-safe, zero-dependency, MIT licensed way to validate, normalize, and resolve ISO-639-1, ISO-639-2, ISO-639-3, ISO-3166-1, ISO-3166-2, and BCP 47 codes for internationalization (i18n).

## Why does this exist? Aren't there enough 'i18n' libs out there?

Most i18n libraries expect you, or worse - your users, to know the "right" locale code. But what's valid?

- `french` → `fr`?
- `eng-US` → should it be `en-US`?
- `zh_hant_hk` → what even is that?
- `german` → `de`
- `ger` → `de`
- `arabic` → `ar`

This package gives you **strongly-typed, BCP 47-aware utilities** to validate, normalize, and autocomplete locale codes in any i18n setup — CLI, frontend, or API integration.

You can either install a handful of packages to get this done, spin your own solution, or use this package.

---

## Features

- **BCP 47 parsing** (`zh-Hant-HK` → `{ language, script, region }`)
- **Alias matching** (`"english"` → `"en"`)
- **Script-aware fallback** (`zh_Hant` → `zh-Hant`)
- **ISO 639-1 / 2 / 3** support
- **ISO 3166** country codes
- **Autocomplete-ready** type safety
- **Tree-shakable**, modular, lightweight, and fast
- **Zero dependencies** — runs anywhere

---

## 🧠 Who this is for

- Frontend devs using i18n libraries (React, Vue, Svelte, etc.)
- CLI tool builders; in fact, it was created to solve this exact problem for [`ALIAS-Babel`](https://github.com/ALIAS-Research/alias-babel))
- SDK/plugin authors who want to support `en-US`, `fr-CA`, etc.
- Anyone consuming translation APIs (LLMs, DeepL, Google)

---

## 📦 Installation

```bash
# npm
npm install i18n-validator
```
```bash
# pnpm
pnpm add i18n-validator
```
```bash
# bun
bun add i18n-validator
```
*** Deno Support Coming Soon ***

## 🚀 Usage
### Normalize a language name or ISO code

```typescript
import { normalizeLanguage } from "i18n-validator";

normalizeLanguage("french");
// → { iso639_1: 'fr', bcp47: 'fr', name: 'French', native: 'Français', ... }

normalizeLanguage("zh-hant");
// → { iso639_1: 'zh', script: 'Hant', bcp47: 'zh-Hant', ... }

```

### Normalize a country/region code
```typescript
import { normalizeRegion } from "i18n-validator";

normalizeRegion("de");
// → { alpha2: 'DE', alpha3: 'DEU', name: 'Germany', numeric: '276' }

normalizeRegion("germany");
// → { alpha2: 'DE', ... }
```

### Parse a full BCP 47 tag
```typescript
import { parseBCP47 } from "i18n-validator";

parseBCP47("zh-Hant-HK");
// → { language: 'zh', script: 'Hant', region: 'HK', raw: 'zh-Hant-HK' }

parseBCP47("pt_br");
// → { language: 'pt', region: 'BR', raw: 'pt_br' }
```

### Validate a BCP 47 tag
```typescript
import { validateBCP47 } from "i18n-validator";

validateBCP47("en-US"); // true
validateBCP47("en_us"); // false
validateBCP47("eng-XYZ"); // false
```

## Modular Design
All exports are tree-shakable:
import { normalizeLanguage } from "i18n-validator/languages/normalize";
import { normalizeRegion } from "i18n-validator/regions/normalize";
import { parseBCP47 } from "i18n-validator/bcp47/parser";

## Specs + Standards
- ISO 639-1 / 639-2 / 639-3 (languages)
- ISO 3166-1 alpha-2 / alpha-3 / numeric (regions)
- BCP 47 language tags (incl. script subtags like Latn, Hant)
- Unicode casing rules (zh-hant → zh-Hant)

## Built for Quality
✅ 100% test coverage with Vitest
✅ Linted, formatted, and checked with BiomeJS
✅ Written in modern TypeScript
✅ Zero dependencies

## Roadmap
- VSCode / Zed / Cursor / Windsurf autocomplete plugins
- Self-hosted `update` CLI command; the current APIs for building ISO/BCP lists are terrible (i18n-validator update)
- Real-time i18n playground for web or CLI

## ❤️ Built for [ALIAS-Babel](https://github.com/ALIAS-Research/alias-babel)
This library was created for ALIAS Babel, a CLI that automatically sets up your translations, wraps your code, and generates accurate dictionaries for any frontend framework.
