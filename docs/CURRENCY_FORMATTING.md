# Currency Formatting (BRL) - Documentation

## Overview

This project includes comprehensive currency formatting utilities for Brazilian Real (BRL) formatting, located in `src/utils/currencyFormat.ts`.

## Available Functions

### 1. `formatCurrency(value, formatType)`

Formats a number to Brazilian Real (BRL) currency format.

**Parameters:**
- `value`: `number | null | undefined` - The numeric value to format
- `formatType`: `CurrencyFormatType` (optional, default: 'standard') - The format type to use

**Format Types:**
- `'standard'`: Standard format (e.g., "R$ 1.234,56")
- `'compact'`: Compact format (e.g., "R$ 1,2 mil")
- `'noSymbol'`: No symbol format (e.g., "1.234,56")
- `'integer'`: Integer format, no decimals (e.g., "R$ 1.235")

**Examples:**
```typescript
import { formatCurrency } from '@/utils'

formatCurrency(1234.56)              // "R$ 1.234,56"
formatCurrency(1234.56, 'compact')   // "R$ 1,2 mil"
formatCurrency(1234.56, 'noSymbol')  // "1.234,56"
formatCurrency(1234.56, 'integer')   // "R$ 1.235"
```

### 2. `parseCurrency(value)`

Parses a Brazilian currency string to a number.

**Parameters:**
- `value`: `string | null | undefined` - The currency string to parse

**Returns:** `number | null` - The parsed number or null if invalid

**Examples:**
```typescript
import { parseCurrency } from '@/utils'

parseCurrency('R$ 1.234,56')  // 1234.56
parseCurrency('1.234,56')     // 1234.56
parseCurrency('1234,56')      // 1234.56
parseCurrency('invalid')      // null
```

### 3. `formatCurrencyInput(value)`

Formats currency input as the user types (for form inputs).

**Parameters:**
- `value`: `string` - The current input value

**Returns:** `string` - Formatted currency string (without symbol)

**Examples:**
```typescript
import { formatCurrencyInput } from '@/utils'

formatCurrencyInput('1234')      // "12,34"
formatCurrencyInput('123456')    // "1.234,56"
formatCurrencyInput('12345678')  // "123.456,78"
```

**Usage in React:**
```typescript
const [price, setPrice] = useState('')

const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatCurrencyInput(e.target.value)
  setPrice(formatted)
}

// In JSX:
<input
  type="text"
  value={price}
  onChange={handlePriceChange}
  placeholder="0,00"
/>
```

### 4. `isValidCurrency(value)`

Validates if a string represents a valid currency value.

**Parameters:**
- `value`: `string | null | undefined` - The string to validate

**Returns:** `boolean` - true if valid currency format

**Examples:**
```typescript
import { isValidCurrency } from '@/utils'

isValidCurrency('R$ 1.234,56')  // true
isValidCurrency('1.234,56')     // true
isValidCurrency('1234,56')      // true
isValidCurrency('abc')          // false
```

### 5. `formatCurrencyCompact(value, showSymbol)`

Formats a currency value for display in tables or compact spaces.

**Parameters:**
- `value`: `number | null | undefined` - The numeric value to format
- `showSymbol`: `boolean` (optional, default: true) - Whether to show the R$ symbol

**Examples:**
```typescript
import { formatCurrencyCompact } from '@/utils'

formatCurrencyCompact(1234)          // "R$ 1,2 mil"
formatCurrencyCompact(1234567)       // "R$ 1,2 mi"
formatCurrencyCompact(1234567890)    // "R$ 1,2 bi"
formatCurrencyCompact(1234, false)   // "1,2 mil"
```

### 6. `formatCurrencyRange(min, max, formatType)`

Formats a range of currency values.

**Parameters:**
- `min`: `number | null | undefined` - Minimum value
- `max`: `number | null | undefined` - Maximum value
- `formatType`: `CurrencyFormatType` (optional, default: 'standard') - Format type

**Examples:**
```typescript
import { formatCurrencyRange } from '@/utils'

formatCurrencyRange(1000, 5000)              // "R$ 1.000,00 - R$ 5.000,00"
formatCurrencyRange(1000, 5000, 'compact')   // "R$ 1 mil - R$ 5 mil"
```

## Usage Examples

### Example 1: Form Input with Auto-Formatting

```typescript
import { useState } from 'react'
import { formatCurrencyInput, parseCurrency, formatCurrency } from '@/utils'

function PriceForm() {
  const [price, setPrice] = useState('')

  const handleSubmit = () => {
    const numericValue = parseCurrency(price)
    if (numericValue !== null) {
      console.log('Submitting price:', numericValue)
      // Send numericValue to API
    }
  }

  return (
    <div>
      <input
        type="text"
        value={price}
        onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
        placeholder="0,00"
      />
      <p>Preview: {formatCurrency(parseCurrency(price) || 0)}</p>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### Example 2: Displaying Currency Values in Tables

```typescript
import { formatCurrency } from '@/utils'

function PriceTable({ products }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        {products.map(product => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{formatCurrency(product.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Example 3: Using with CreateCaseModal

The `CreateCaseModal` component already uses the currency formatting utilities:

```typescript
// Auto-formats as user types
const handlePriceChange = (e) => {
  const formatted = formatCurrencyInput(e.target.value)
  setFormData({ ...formData, price: formatted })
}

// Validates the price
const parsedPrice = parseCurrency(formData.price)
if (parsedPrice === null || parsedPrice <= 0) {
  setError('Please enter a valid price')
}

// Displays in summary
<span>{formatCurrency(parseCurrency(formData.price) || 0)}</span>
```

## Testing

To test the currency formatting utilities:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the test page:
   ```
   http://localhost:5173/test-currency
   ```

3. The test page includes:
   - Interactive input testing
   - Format examples for all format types
   - Parse examples
   - Compact formatting examples
   - Range formatting examples

## Implementation Details

### Locale

All currency formatting uses the `pt-BR` locale with the `BRL` currency code, ensuring proper:
- Decimal separator: `,` (comma)
- Thousands separator: `.` (dot)
- Currency symbol: `R$`
- Symbol position: Before the amount

### Browser Compatibility

The utilities use the `Intl.NumberFormat` API, which is supported in all modern browsers. For older browsers, consider using a polyfill.

## Migration Guide

If you have existing code that manually formats currency, you can migrate to these utilities:

### Before:
```typescript
const formatted = `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
```

### After:
```typescript
import { formatCurrency } from '@/utils'
const formatted = formatCurrency(value)
```

## Best Practices

1. **Always use `parseCurrency()` before sending to API:** This ensures the numeric value is correctly extracted from the formatted string.

2. **Use `formatCurrencyInput()` for form inputs:** This provides a better user experience by formatting as they type.

3. **Validate with `isValidCurrency()`:** Check if the input is valid before processing.

4. **Choose the right format type:** Use 'compact' for tight spaces, 'standard' for detailed displays, and 'noSymbol' for input fields.

5. **Handle null/undefined gracefully:** All functions handle null/undefined values and return appropriate defaults.
