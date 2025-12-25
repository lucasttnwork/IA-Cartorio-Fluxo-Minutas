# Typography Hierarchy Guide

This document provides guidelines for using the typography system in the application.

## Overview

The application uses a comprehensive typography hierarchy built with Tailwind CSS and custom utility classes. The system ensures consistency, accessibility, and a professional appearance across all components.

## Typography Scale

### Display Text
Large, bold text for hero sections and major page headings.

- **Display Large**: `text-display-lg` - 56px, Bold, Tight tracking
- **Display Medium**: `text-display-md` - 48px, Bold, Tight tracking
- **Display Small**: `text-display-sm` - 40px, Bold, Tight tracking

**Usage**: Landing pages, hero sections, major announcements

```tsx
<h1 className="text-display-lg">Welcome to MinutaCanvas</h1>
```

### Headings
Semantic headings for content hierarchy.

- **H1**: `text-h1` - 36px, Bold - Main page titles
- **H2**: `text-h2` - 30px, Semibold - Section headers
- **H3**: `text-h3` - 24px, Semibold - Subsection headers
- **H4**: `text-h4` - 20px, Semibold - Card titles, modal headers
- **H5**: `text-h5` - 18px, Semibold - Small section headers
- **H6**: `text-h6` - 16px, Semibold - Inline headers, labels

**Usage**: Content structure, sections, cards

```tsx
<h2 className="text-h2">Active Cases</h2>
<h3 className="text-h3">Case Details</h3>
<h4 className="text-h4">Documents</h4>
```

### Body Text
Standard text for content and UI elements.

- **Body Large**: `text-body-lg` - 18px - Introductory paragraphs, callouts
- **Body**: `text-body` - 16px - Primary body text, form labels
- **Body Small**: `text-body-sm` - 14px - Secondary content, helper text

**Usage**: Paragraphs, form fields, descriptions

```tsx
<p className="text-body">This is the main content text.</p>
<p className="text-body-sm">Additional details or helper text.</p>
```

### Supporting Text
Supplementary text styles.

- **Caption**: `text-caption` - 12px - Image captions, footnotes
- **Overline**: `text-overline` - 12px, Uppercase, Wide tracking - Labels, categories

**Usage**: Metadata, tags, labels

```tsx
<span className="text-caption">Last updated: 2 hours ago</span>
<span className="text-overline">Category</span>
```

## Semantic Variants

### Text Emphasis
- **Emphasis**: `text-emphasis` - Semibold, high contrast
- **Subtle**: `text-subtle` - Muted color for less important text
- **Muted**: `text-muted` - Even more subtle, for metadata

```tsx
<span className="text-emphasis">Important information</span>
<span className="text-subtle">Secondary information</span>
<span className="text-muted">Timestamp or metadata</span>
```

### Links
- **Link**: `text-link` - Blue, underlined on hover

```tsx
<a href="#" className="text-link">View details</a>
```

### Status Messages
- **Error**: `text-error` - Red, medium weight
- **Success**: `text-success` - Green, medium weight
- **Warning**: `text-warning` - Amber, medium weight
- **Info**: `text-info` - Blue, medium weight

```tsx
<p className="text-error">This field is required</p>
<p className="text-success">Document uploaded successfully</p>
<p className="text-warning">This action cannot be undone</p>
<p className="text-info">New feature available</p>
```

## Direct Tailwind Usage

You can also use the fontSize scale directly with Tailwind:

```tsx
<h1 className="text-h1 text-gray-900 dark:text-white font-bold">
  Custom Styled Heading
</h1>

<p className="text-body text-gray-700 dark:text-gray-300">
  Custom styled body text
</p>
```

## Accessibility Guidelines

### Minimum Sizes
- **Body text**: Never go below 14px (text-body-sm) for main content
- **Supplementary text**: 12px minimum (text-caption)
- **Interactive elements**: Minimum 16px for buttons and links

### Contrast Requirements
All text styles follow WCAG AA standards:
- Normal text (< 18px): 4.5:1 contrast ratio minimum
- Large text (≥ 18px): 3:1 contrast ratio minimum
- The utility classes automatically handle dark mode contrast

### Line Height
Each typography class includes optimal line height:
- **Display text**: 1.1 - 1.2 (tight)
- **Headings**: 1.25 - 1.45 (comfortable)
- **Body text**: 1.5 - 1.75 (relaxed for readability)

## Best Practices

### 1. Use Semantic Classes
Prefer semantic classes over direct sizing:
```tsx
// Good
<h2 className="text-h2">Section Title</h2>

// Avoid
<h2 className="text-3xl font-semibold text-gray-900">Section Title</h2>
```

### 2. Maintain Hierarchy
Ensure proper visual hierarchy:
```tsx
<div>
  <h1 className="text-h1">Page Title</h1>
  <h2 className="text-h2">Section</h2>
  <h3 className="text-h3">Subsection</h3>
  <p className="text-body">Body content</p>
</div>
```

### 3. Don't Skip Levels
Follow HTML semantics:
```tsx
// Good
<h1>Main</h1>
<h2>Section</h2>
<h3>Subsection</h3>

// Avoid
<h1>Main</h1>
<h3>Section (skipped h2)</h3>
```

### 4. Combine with Other Utilities
Typography classes work well with spacing and color utilities:
```tsx
<h2 className="text-h2 mb-4">Title with spacing</h2>
<p className="text-body mb-6">Paragraph with spacing</p>
```

### 5. Responsive Typography
Use responsive prefixes when needed:
```tsx
<h1 className="text-h2 md:text-h1">
  Smaller on mobile, larger on desktop
</h1>
```

## Common Patterns

### Card Header
```tsx
<div className="glass-card p-6">
  <h3 className="text-h3 mb-2">Card Title</h3>
  <p className="text-body-sm text-muted">Card description</p>
</div>
```

### Form Field
```tsx
<div>
  <label className="text-body-sm text-emphasis mb-1">
    Field Label
  </label>
  <input type="text" />
  <p className="text-caption text-muted mt-1">Helper text</p>
</div>
```

### Status Badge
```tsx
<div className="inline-flex items-center gap-2">
  <span className="text-overline">Status</span>
  <span className="text-body-sm text-success">Active</span>
</div>
```

### Modal Header
```tsx
<div className="border-b pb-4">
  <h2 className="text-h2">Modal Title</h2>
  <p className="text-body-sm text-subtle mt-1">
    Modal description or subtitle
  </p>
</div>
```

## Dark Mode

All typography utilities automatically adapt to dark mode:

```tsx
// Automatically handles dark mode
<h1 className="text-h1">Dark mode ready</h1>
<p className="text-body">Adjusts colors in dark theme</p>
```

Dark mode color mappings:
- Gray-900 → White
- Gray-700 → Gray-300
- Gray-600 → Gray-400
- Gray-500 → Gray-400

## Print Styles

Typography is optimized for print:
- Headings use point sizes (pt) in print
- Colors convert to grayscale
- Line heights adjust for readability
- Page breaks avoid splitting headings

## Migration Guide

When updating existing components:

```tsx
// Before
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">

// After
<h1 className="text-h1">

// Before
<p className="text-sm text-gray-600 dark:text-gray-400">

// After
<p className="text-body-sm">

// Before
<span className="text-xs uppercase tracking-wide text-gray-500">

// After
<span className="text-overline">
```

## Examples in Context

### Dashboard Page
```tsx
<div className="space-y-6">
  <h1 className="text-display-md">Dashboard</h1>

  <div className="glass-card p-6">
    <h2 className="text-h2 mb-4">Recent Activity</h2>

    {activities.map(activity => (
      <div key={activity.id} className="mb-3">
        <h3 className="text-h4">{activity.title}</h3>
        <p className="text-body-sm text-subtle">{activity.description}</p>
        <span className="text-caption text-muted">{activity.timestamp}</span>
      </div>
    ))}
  </div>
</div>
```

### Form Component
```tsx
<form className="space-y-4">
  <h2 className="text-h2 mb-6">Create New Case</h2>

  <div>
    <label className="text-body font-medium mb-2">Case Name</label>
    <input type="text" className="input" />
    <p className="text-caption text-muted mt-1">
      Enter a descriptive name for the case
    </p>
  </div>

  <div>
    <p className="text-error">This field is required</p>
  </div>
</form>
```

## Testing Checklist

- [ ] Text is readable in both light and dark modes
- [ ] Font sizes meet minimum accessibility requirements
- [ ] Visual hierarchy is clear and consistent
- [ ] Line heights provide comfortable reading
- [ ] Text colors meet WCAG AA contrast ratios
- [ ] Typography scales appropriately on mobile devices
- [ ] Print output is readable and well-formatted
