# Screen Reader Accessibility Implementation

## Overview
This document outlines the comprehensive screen reader compatibility features implemented across the Minuta Canvas application.

## Features Implemented

### 1. Skip Navigation Links
**Location**: `src/components/common/SkipNavigation.tsx`

- **Purpose**: Allows keyboard users to bypass repetitive navigation
- **Implementation**:
  - Hidden by default with `.sr-only` class
  - Becomes visible when focused
  - Provides quick access to main content and navigation
- **Links Provided**:
  - "Ir para o conteúdo principal" → #main-content
  - "Ir para a navegação" → #sidebar-navigation

**Verification**: Press Tab on any page - the skip link appears in the top-left corner.

---

### 2. Live Region Announcements
**Location**: `src/components/common/LiveRegion.tsx`

- **Purpose**: Announces dynamic content changes to screen readers
- **Features**:
  - Configurable politeness levels (polite, assertive, off)
  - Auto-clearing messages after a delay
  - Custom hook `useLiveRegion()` for easy integration
- **ARIA Attributes**:
  - `role="status"`
  - `aria-live="polite|assertive"`
  - `aria-atomic="true"`

---

### 3. Route Change Announcements
**Location**: `src/components/common/RouteAnnouncer.tsx`

- **Purpose**: Announces page navigation to screen readers
- **Implementation**:
  - Automatically detects route changes
  - Maps routes to user-friendly Portuguese titles
  - Uses assertive live region for immediate announcement
- **Example Announcements**:
  - "/" → "Navegado para: Painel de Controle"
  - "/case/:id/upload" → "Navegado para: Upload de Documentos"
  - "/case/:id/draft" → "Navegado para: Editor de Minuta"

**Integration**: Added to `src/App.tsx` at the root level.

---

### 4. Enhanced Button Component
**Location**: `src/components/ui/button.tsx`

**Improvements**:
- Added `aria-label` prop support for custom labels
- Loading state announcements:
  - `aria-busy={loading}` - Indicates busy state
  - `aria-live="polite"` - Announces when loading starts
  - Hidden "Carregando..." text for screen readers
  - Loader icon marked with `aria-hidden="true"`

**Example Usage**:
```tsx
<Button loading={isLoading} aria-label="Salvar documento">
  Salvar
</Button>
```

---

### 5. Semantic Landmarks
**Location**: `src/components/layout/DashboardLayout.tsx`

**Improvements**:
- `<aside>` tag for desktop sidebar with `aria-label="Barra lateral"`
- `<nav>` tags with `aria-label="Navegação principal"`
- `<main>` tag with `id="main-content"` and `role="main"`
- `<header>` tag for top navigation
- Mobile sidebar as modal dialog:
  - `role="dialog"`
  - `aria-modal="true"`
  - `aria-label="Menu de navegação"`

**Navigation Enhancements**:
- `aria-current="page"` on active navigation items
- `aria-label` on menu toggle buttons
- `aria-hidden="true"` on decorative icons
- Proper focus management

---

### 6. Status Badge Announcements
**Location**: `src/components/status/DocumentStatusBadge.tsx`

**Improvements**:
- `role="status"` or `role="button"` (when clickable)
- `aria-label` with full status description
- `aria-live="polite"` on status text for updates
- Screen reader-only text when label is hidden
- Icons marked with `aria-hidden="true"`

**Example**:
```tsx
<Badge
  role="status"
  aria-label="Document status: Processing"
>
  <Icon aria-hidden="true" />
  <span aria-live="polite">Processing</span>
</Badge>
```

---

### 7. HTML Document Structure
**Location**: `index.html`

**Improvements**:
- `lang="pt-BR"` attribute on `<html>` tag
- Descriptive `<meta name="description">` tag
- Semantic page structure

---

### 8. Screen Reader Utilities
**Location**: `src/styles/index.css`

**CSS Classes**:
- `.sr-only` - Visually hidden but accessible to screen readers
- Comprehensive focus-visible styles for keyboard navigation
- High contrast mode support
- Reduced motion support

---

## WCAG 2.1 Compliance

### Level A
✅ **1.3.1 Info and Relationships** - Semantic HTML and ARIA landmarks
✅ **2.1.1 Keyboard** - All functionality available via keyboard
✅ **2.4.1 Bypass Blocks** - Skip navigation links implemented
✅ **3.3.2 Labels or Instructions** - Form inputs have proper labels
✅ **4.1.2 Name, Role, Value** - ARIA attributes on custom components

### Level AA
✅ **2.4.6 Headings and Labels** - Descriptive headings and labels
✅ **2.4.7 Focus Visible** - Enhanced focus indicators throughout
✅ **3.2.4 Consistent Identification** - Consistent component labeling

---

## Testing Recommendations

### Manual Testing with Screen Readers

**NVDA (Windows - Free)**:
1. Download from https://www.nvaccess.org/
2. Press `Insert + Down Arrow` to enter browse mode
3. Use `H` to navigate by headings
4. Use `L` to navigate by landmarks
5. Use `B` to navigate by buttons

**JAWS (Windows - Commercial)**:
1. Use `Insert + F6` to list headings
2. Use `Insert + F7` to list links
3. Use `;` (semicolon) to list buttons

**VoiceOver (macOS - Built-in)**:
1. Press `Command + F5` to enable
2. Use `VO + U` to open rotor
3. Use `VO + Right/Left Arrow` to navigate elements

**TalkBack (Android - Built-in)**:
1. Enable in Settings > Accessibility
2. Swipe right/left to navigate
3. Double-tap to activate

### Automated Testing

**axe DevTools**:
```bash
npm install --save-dev @axe-core/playwright
```

**Lighthouse Accessibility**:
- Open Chrome DevTools
- Go to Lighthouse tab
- Run Accessibility audit

---

## Implementation Checklist

### Completed ✅
- [x] Skip navigation links
- [x] Live region announcements
- [x] Route change announcements
- [x] Button loading state announcements
- [x] Semantic HTML landmarks
- [x] Navigation ARIA attributes
- [x] Status badge announcements
- [x] Screen reader-only text utilities
- [x] Focus management improvements
- [x] HTML lang attribute

### Future Enhancements 🔄
- [ ] Form validation error announcements
- [ ] Table headers and captions
- [ ] Image alt text audit
- [ ] Autocomplete ARIA patterns
- [ ] Modal focus trap implementation
- [ ] Comprehensive keyboard shortcuts documentation

---

## Common Patterns

### Announcing Dynamic Changes
```tsx
import { useLiveRegion } from '@/components/common/LiveRegion'

function MyComponent() {
  const { message, announce } = useLiveRegion()

  const handleAction = () => {
    // Perform action
    announce('Ação concluída com sucesso')
  }

  return (
    <>
      <button onClick={handleAction}>Executar</button>
      <LiveRegion message={message} />
    </>
  )
}
```

### Icon Buttons
```tsx
<button aria-label="Fechar modal">
  <XMarkIcon aria-hidden="true" />
</button>
```

### Loading States
```tsx
<Button loading={isLoading}>
  Salvar
  {/* Automatically announces "Carregando..." to screen readers */}
</Button>
```

---

## Resources

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Components](https://inclusive-components.design/)

---

## Support

For questions or issues related to screen reader accessibility, please contact the development team or open an issue in the repository.
