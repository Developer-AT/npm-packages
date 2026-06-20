# @developer-at/locale

A lightweight locale management package for Node.js applications that provides easy translation functionality by loading locale files from a directory.

## Installation

```bash
npm install @developer-at/locale
```

## Features

- Load locale files from a directory
- Support for multiple languages
- Simple translation API
- TypeScript support

## Supported Languages

The package supports the following language codes:
- `en` - English
- `mn` - Mongolian
- `ru` - Russian
- `hi` - Hindi
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `ja` - Japanese
- `ko` - Korean
- `pt` - Portuguese
- `zh` - Chinese
- `ar` - Arabic
- `he` - Hebrew

## Usage

### Basic Setup

1. Create a directory with your locale JSON files:

```
locales/
  ├── en.json
  ├── fr.json
  ├── es.json
  └── ...
```

2. Example locale file (`en.json`):

```json
{
  "welcome": "Welcome",
  "greeting": "Hello, {name}!",
  "errors": {
    "notFound": "Resource not found",
    "unauthorized": "Unauthorized access"
  }
}
```

3. Initialize and use in your code:

```typescript
import { locales } from '@developer-at/locale';
import { join } from 'path';

// Initialize locales from directory
locales.initaliseLocale(join(__dirname, 'locales'));

// Translate a key
const welcomeMessage = locales.translate('welcome', 'en');
console.log(welcomeMessage); // "Welcome"

// Use default language (English)
const greeting = locales.translate('greeting', 'en');
console.log(greeting); // "Hello, {name}!"

// Translate with different language
const welcomeFr = locales.translate('welcome', 'fr');
console.log(welcomeFr); // "Bienvenue" (if fr.json exists)

// Nested keys
const errorMsg = locales.translate('errors.notFound', 'en');
console.log(errorMsg); // "Resource not found"
```

### API Reference

#### `initaliseLocale(dir: string)`

Initializes and loads all locale JSON files from the specified directory.

**Parameters:**
- `dir` (string): Path to the directory containing locale JSON files

**Example:**
```typescript
locales.initaliseLocale('./locales');
```

#### `translate(key: string, lang: Lang = 'en')`

Translates a key to the specified language.

**Parameters:**
- `key` (string): Translation key to look up (supports dot notation for nested keys)
- `lang` (Lang): Language code (default: 'en')

**Returns:**
- `string | undefined`: Translated string or undefined if key/language not found

**Example:**
```typescript
// Simple key
const msg = locales.translate('welcome', 'en');

// Nested key
const error = locales.translate('errors.notFound', 'en');

// Default language
const defaultMsg = locales.translate('welcome');
```

## TypeScript Support

The package includes TypeScript definitions. Import the `Lang` type for type-safe language codes:

```typescript
import { locales, Lang } from '@developer-at/locale';

const lang: Lang = 'fr';
const message = locales.translate('welcome', lang);
```

## Notes

- Locale files must be in JSON format
- File names should match the language code (e.g., `en.json`, `fr.json`)
- The package automatically loads all `.json` files from the specified directory
- If a translation key or language is not found, `undefined` is returned
- Nested keys are supported using dot notation (e.g., `errors.notFound`)

## License

ISC
