# Content & Localization System - Usage Guide

## Overview

The content system provides a centralized way to manage all user-facing text in your application. This allows you to:

- ✅ Support multiple languages and domains without code changes
- ✅ Maintain consistent terminology across the app
- ✅ Easily add new languages or domains
- ✅ Update text without deploying code
- ✅ Use placeholder keys as fallback if translation missing

## Architecture

```
Domain Config (from /api/config)
    ↓ specifies domain + default language
ConfigContext
    ↓
ContentProvider mounts
    ↓
ContentService loads /content/{domain}.{language}.json
    ↓
Content cached in ContentContext
    ↓
useTranslation() hook provides t() function
    ↓
Components use t('key') for all text
```

## Setup

### 1. Content Provider in Layout

The `ContentProvider` is already added to `app/layout.tsx`:

```typescript
<ConfigProvider>
  <ThemeProvider>
    <ContentProvider>
      {children}
    </ContentProvider>
  </ThemeProvider>
</ConfigProvider>
```

### 2. Content Files Structure

```
frontend/public/content/
├── fitness.en.json      # Fitness domain, English
├── fitness.ta.json      # Fitness domain, Tamil
├── fitness.te.json      # Fitness domain, Telugu
├── business.en.json     # Business domain, English
├── business.ta.json     # Business domain, Tamil
└── healthcare.en.json   # Healthcare domain, English
```

## Usage Examples

### 1. Basic Translation

```typescript
'use client';

import { useTranslation } from '@/contexts/ContentContext';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <button>
      {t('send')} {/* Renders "Send" or translated equivalent */}
    </button>
  );
}
```

### 2. With Fallback

```typescript
const { t } = useTranslation();

// If key not found, use fallback text
<p>{t('missingKey', 'Default text here')}</p>
```

### 3. Language Switching

```typescript
const { changeLanguage, t } = useTranslation();

<button onClick={() => changeLanguage('ta')}>
  தமிழ் {/* Tamil */}
</button>

<button onClick={() => changeLanguage('en')}>
  English
</button>
```

### 4. Get All Content

```typescript
import { useContentData } from '@/contexts/ContentContext';

const content = useContentData();

// Access any property directly
<h1>{content.appName}</h1>
<p>{content.tagline}</p>
```

## Hook Reference

### `useTranslation()`

Returns translation function and language changer.

```typescript
const { t, changeLanguage } = useTranslation();

// Use translation
<div>{t('appName')}</div>

// Change language
<button onClick={() => changeLanguage('ta')}>தமிழ்</button>
```

### `useContent()`

Returns full content context with loading state.

```typescript
const { content, loading, error, t, changeLanguage } = useContent();

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

<div>{t('appName')}</div>
```

### `useContentData()`

Returns just the content object.

```typescript
const content = useContentData();

<h1>{content.appName}</h1>
```

## Creating Content Files

### File Naming Convention

```
{domain}.{language}.json

Examples:
- fitness.en.json
- fitness.ta.json
- business.en.json
- healthcare.hi.json
```

### JSON Structure

```json
{
  "appName": "Fitness Tracker",
  "appDescription": "Your personal fitness companion",
  "tagline": "Get expert fitness advice",
  "workoutTips": "Workout Tips",
  "nutrition": "Nutrition"
}
```

### Content Schema

All content files should implement the appropriate interface:

- **Fitness Domain**: `FitnessContent` interface
- **Business Domain**: `BusinessContent` interface
- **Healthcare Domain**: `HealthcareContent` interface
- **Common**: All domains extend `CommonContent`

See `frontend/config/content.schema.ts` for full schema.

## Supported Languages

| Code | Language | Supported Domains |
|------|----------|------------------|
| en   | English  | All              |
| ta   | Tamil    | fitness, business |
| te   | Telugu   | fitness          |
| hi   | Hindi    | fitness          |
| kn   | Kannada  | fitness          |
| ml   | Malayalam| fitness          |
| mr   | Marathi  | fitness          |
| pa   | Punjabi  | fitness          |
| bn   | Bengali  | fitness          |
| gu   | Gujarati | fitness          |
| es   | Spanish  | business         |
| fr   | French   | business         |

To add new language:
1. Create `{domain}.{language}.json` in `frontend/public/content/`
2. Implement all properties from schema
3. Users can select language - fallback to default if missing

## Best Practices

### 1. Use Semantic Keys

❌ Bad:
```typescript
t('text1') // What is text1?
```

✅ Good:
```typescript
t('appName')
t('startWorkout')
t('primaryGoal')
```

### 2. Keep Keys at Top Level

❌ Bad:
```json
{
  "buttons": {
    "save": "Save",
    "submit": "Submit"
  }
}
```

✅ Good:
```json
{
  "save": "Save",
  "submit": "Submit"
}
```

### 3. Provide Fallbacks

✅ Good:
```typescript
<button>{t('buttonSubmit', 'Submit')}</button>
```

### 4. Group Related Keys with Prefix

✅ Good:
```json
{
  "validation_email_required": "Email is required",
  "validation_email_invalid": "Email is invalid",
  "validation_password_required": "Password is required"
}
```

### 5. Use Consistent Terminology

✅ Good:
- All workout-related: "Workout", "Training", "Exercise"
- All goal-related: "Goal", "Target", "Objective"
- Consistent across all languages

## Examples

### Example 1: Header Component

```typescript
'use client';

import { useTranslation } from '@/contexts/ContentContext';

export function Header() {
  const { t, changeLanguage } = useTranslation();

  return (
    <header className="bg-primary text-white p-lg">
      <h1>{t('appName')}</h1>
      <p>{t('tagline')}</p>
      
      <div className="mt-4">
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('ta')}>தமிழ்</button>
      </div>
    </header>
  );
}
```

### Example 2: Chat Input

```typescript
export function ChatInput() {
  const { t } = useTranslation();

  return (
    <div>
      <input
        type="text"
        placeholder={t('placeholder')}
      />
      <button>{t('send')}</button>
    </div>
  );
}
```

### Example 3: Dialog Component

```typescript
export function ConfirmDialog({ onConfirm, onCancel }) {
  const { t } = useTranslation();

  return (
    <dialog>
      <p>{t('areYouSure')}</p>
      <button onClick={onConfirm}>{t('confirm')}</button>
      <button onClick={onCancel}>{t('cancel')}</button>
    </dialog>
  );
}
```

### Example 4: Domain-Specific Content

```typescript
export function DomainSpecificSection() {
  const { t } = useTranslation();
  const domain = useDomain();

  return (
    <section>
      {domain === 'fitness' && (
        <div>
          <h2>{t('workoutTips')}</h2>
          <p>{t('nutrition')}</p>
        </div>
      )}
      
      {domain === 'business' && (
        <div>
          <h2>{t('marketingGuides')}</h2>
          <p>{t('businessStrategy')}</p>
        </div>
      )}
    </section>
  );
}
```

## Adding New Languages

### 1. Create Content File

Create `frontend/public/content/{domain}.{language}.json`

```json
{
  "appName": "Translated App Name",
  "appDescription": "Translated description",
  // ... all other keys
}
```

### 2. Update Supported Languages (Optional)

In `frontend/config/content.schema.ts`:

```typescript
export enum Language {
  EN = 'en',
  TA = 'ta',
  ES = 'es',  // New language
}
```

### 3. Update Domain Config (Optional)

In `backend/config/domains/{domain}.json`:

```json
{
  "businessLogic": {
    "supportedLanguages": ["en", "ta", "es"],
    "defaultLanguage": "en"
  }
}
```

### 4. Done!

Users can now select the new language in the UI.

## Adding New Domains

### 1. Define Domain Content Schema

In `frontend/config/content.schema.ts`:

```typescript
export interface EducationContent extends CommonContent {
  courses: string;
  students: string;
  lessons: string;
  // ... domain-specific keys
}
```

### 2. Create Content Files

- `frontend/public/content/education.en.json`
- `frontend/public/content/education.ta.json`
- etc.

### 3. Create Domain Config

- `backend/config/domains/education.json`

### 4. Update Content Type

Update `DomainContent` union type in `content.schema.ts`:

```typescript
export type DomainContent = FitnessContent | BusinessContent | EducationContent;
```

## Fallback Behavior

If content file not found:
1. Try to load `{domain}.{language}.json`
2. If fails, try `{domain}.{fallbackLanguage}.json` (usually English)
3. If fails, return key as fallback text
4. Log warning in console

## Debugging

### Check Loaded Content

```typescript
import { useContent } from '@/contexts/ContentContext';

const { content } = useContent();
console.log('Loaded content:', content);
```

### Monitor Language Changes

```typescript
const { changeLanguage } = useTranslation();

const handleLanguageChange = async (lang: string) => {
  console.log('Changing to:', lang);
  await changeLanguage(lang);
  console.log('Language changed');
};
```

### Clear Content Cache

```typescript
import { getContentManager } from '@/services/content.service';

getContentManager().clearCache();
// Reload page to see changes
```

## Performance

- **Lazy loading**: Content loaded only when needed
- **Caching**: Content cached after first load
- **No re-renders on translate**: Language change loads content, triggers re-render once
- **File size**: Typical content file is 1-3 KB gzipped

## Troubleshooting

### Text Shows as "key" Instead of Translation

1. Check content file exists: `frontend/public/content/{domain}.{language}.json`
2. Check key spelling matches exactly (case-sensitive)
3. Check file is valid JSON (use JSON validator)
4. Check ContentProvider is in app layout

### Content Not Loading

1. Check browser console for errors
2. Verify content file is in `public/content/` directory
3. Check file naming: `{domain}.{language}.json`
4. Restart dev server

### Language Not Changing

1. Call `changeLanguage()` with correct language code (e.g., 'ta', 'en')
2. Check content file exists for that language
3. Component must be inside `ContentProvider`

### TypeScript Errors with Content Keys

Ensure you're using keys that exist in the schema:

```typescript
// ✅ Correct - key exists in schema
t('appName')

// ❌ Wrong - key doesn't exist
t('unknownKey') // TypeScript error
```

## Migration Guide

If migrating from hardcoded strings to content system:

1. **Identify all hardcoded strings** in components
2. **Create content schema** with all strings
3. **Create content files** for each domain/language
4. **Replace strings with `t()` calls**
5. **Test with different languages**

Example:

```typescript
// Before
<button>Save</button>

// After
const { t } = useTranslation();
<button>{t('save')}</button>
```

## Content Validation

Validate content files are complete:

```typescript
import { FitnessContent } from '@/config/content.schema';

function validateContent(content: any): content is FitnessContent {
  const requiredKeys = [
    'appName', 'appDescription', 'tagline',
    'send', 'cancel', 'submit', // ... etc
  ];
  
  return requiredKeys.every(key => key in content);
}
```
