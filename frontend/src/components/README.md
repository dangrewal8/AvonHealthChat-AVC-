# Components Documentation

## SearchBar Component

The SearchBar component is a fully-featured search input for natural language queries in the Avon Health RAG system.

### Features

✅ **Auto-focus on mount** - Input automatically receives focus when component loads
✅ **Enter to submit** - Press Enter key to submit the search query
✅ **Clear button** - Click X icon to clear input and refocus
✅ **Character count** - Real-time counter with 500 character limit
✅ **Loading state** - Disabled input with animated spinner during search
✅ **Responsive design** - Optimized for mobile, tablet, and desktop
✅ **Keyboard shortcuts** - Enter key hint displayed on larger screens
✅ **Near-limit warning** - Character count turns orange when approaching limit
✅ **Accessibility** - ARIA labels and keyboard navigation support

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onSearch` | `(query: string) => void` | Yes | - | Callback function called when search is submitted |
| `isLoading` | `boolean` | No | `false` | Indicates loading state, disables input and shows spinner |
| `placeholder` | `string` | No | `"Ask about patient records..."` | Placeholder text for input field |
| `autoFocus` | `boolean` | No | `true` | Auto-focus input on component mount |

### Usage

#### Basic Usage

```tsx
import { SearchBar } from './components/SearchBar';

function MyComponent() {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  return (
    <SearchBar
      onSearch={handleSearch}
      isLoading={false}
    />
  );
}
```

#### With Loading State

```tsx
import { useState } from 'react';
import { SearchBar } from './components/SearchBar';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const result = await searchAPI(query);
      console.log('Results:', result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SearchBar
      onSearch={handleSearch}
      isLoading={isLoading}
      placeholder="Search patient records..."
    />
  );
}
```

#### Custom Configuration

```tsx
<SearchBar
  onSearch={handleSearch}
  isLoading={isSearching}
  placeholder="Enter your medical question..."
  autoFocus={false}
/>
```

### Behavior

#### Submit Triggers

1. **Enter Key** - Press Enter to submit (when input has text)
2. **Search Button** - Click the search icon button
3. **Auto-disabled** - Both methods are disabled during loading or when input is empty

#### Clear Function

- Click the X button to clear the input
- Input automatically refocuses after clearing
- Clear button only appears when there is text and not loading

#### Character Limit

- Maximum 500 characters
- Counter displays current/max characters
- Counter turns orange when over 90% of limit (450+ characters)
- Input enforces maxLength attribute

#### Loading State

- Input field disabled with gray background
- Search button shows animated spinner
- Clear button hidden during loading
- Form submission prevented

### Styling

The component uses Tailwind CSS utility classes with the following design:

- **Colors**: Primary blue (`primary`), gray tones
- **Transitions**: Smooth color and state transitions
- **Focus States**: Blue ring on focus for accessibility
- **Hover States**: Subtle background changes on buttons
- **Responsive**: Mobile-first design with hidden elements on small screens

### Accessibility

- `aria-label` attributes on icon buttons
- Keyboard navigation support
- Focus management (auto-focus, clear refocus)
- Disabled states properly communicated
- Semantic HTML (form, input, button)

### Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Tech Stack

- React 18+
- TypeScript
- Tailwind CSS
- lucide-react icons

---

## Loading Components

The LoadingState module provides three components for different loading scenarios.

### LoadingSkeleton Component

Full skeleton screen that matches the ResultsDisplay layout structure. Best for displaying while waiting for query results.

#### Features

✅ **Realistic Preview** - Matches ResultsDisplay structure exactly (Answer, Details, Sources)
✅ **Smooth Animation** - Uses Tailwind's animate-pulse for smooth loading effect
✅ **No Layout Shift** - Prevents layout shift when actual content loads (CLS = 0)
✅ **Responsive Design** - Works on all screen sizes with max-width constraint
✅ **Three Skeleton Cards** - Shows preview of 3 source citations
✅ **GPU Accelerated** - Pure CSS animations for best performance

#### Usage

```tsx
import { LoadingSkeleton } from './components/LoadingState';

function App() {
  const query = useRAGQuery();

  return (
    <>
      {query.isPending && <LoadingSkeleton />}
      {query.data && <ResultsDisplay result={query.data} />}
    </>
  );
}
```

#### When to Use

✅ Use when:
- Waiting for query results that will display in ResultsDisplay
- Loading time > 300ms (for better perceived performance)
- You want to show the expected layout structure

❌ Don't use when:
- Loading small inline elements
- Quick operations < 300ms

---

### LoadingSpinner Component

Simple centered spinner for inline loading states. Lightweight and minimal.

#### Features

✅ **Pure CSS** - No icon dependencies, just border animation
✅ **Lightweight** - ~50 bytes minified
✅ **Smooth Rotation** - Uses Tailwind's animate-spin
✅ **Brand Consistent** - Blue border matches primary color

#### Usage

```tsx
import { LoadingSpinner } from './components/LoadingState';

function QuickSearch() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-white p-4 rounded">
      {loading ? <LoadingSpinner /> : <SearchResults />}
    </div>
  );
}
```

#### When to Use

✅ Use when:
- Loading smaller sections
- Inline operations
- Button loading states
- Partial page updates

❌ Don't use when:
- Loading full page results (use LoadingSkeleton instead)

---

### LoadingState Component (Legacy)

Original loading component with icon and custom message. Kept for backward compatibility.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | `string` | No | `"Loading..."` | Message to display below spinner |

#### Features

✅ **Custom Message** - Supports custom loading text
✅ **Icon Animation** - Uses lucide-react Loader2 icon
✅ **Centered Layout** - Icon and text stacked vertically

#### Usage

```tsx
import { LoadingState } from './components/LoadingState';

function UploadForm() {
  const [uploading, setUploading] = useState(false);

  return (
    <>
      {uploading && <LoadingState message="Uploading patient records..." />}
      <form>...</form>
    </>
  );
}
```

#### When to Use

✅ Use when:
- You need a custom message
- Backward compatibility required
- Modal dialogs
- Form submissions with status messages

---

### Loading Components Comparison

| Component | Size | Use Case | Props | Animation |
|-----------|------|----------|-------|-----------|
| **LoadingSkeleton** | ~300 bytes | Full page loading, query results | None | animate-pulse |
| **LoadingSpinner** | ~50 bytes | Inline loading, quick operations | None | animate-spin |
| **LoadingState** | ~100 bytes | Custom messages, legacy support | message? | animate-spin |

---

## ProvenanceCard Component

Display citation/provenance information for query results.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `provenance` | `FormattedProvenance` | Yes | Provenance data object |
| `index` | `number` | Yes | Citation number (1-based) |

### Usage

```tsx
<ProvenanceCard
  provenance={provenanceItem}
  index={1}
/>
```

---

## ResultsDisplay Component

Comprehensive display of query results including answer, details, extractions, and sources.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `result` | `UIResponse` | Yes | Complete query response object |

### Usage

```tsx
<ResultsDisplay result={queryResult} />
```

### Features

- Short answer with confidence indicator
- Detailed summary
- Structured extractions (medications, conditions, etc.)
- Provenance/source cards
- Confidence breakdown visualization
- Metadata display

---

---

## Error State Components

The ErrorState module provides comprehensive error handling components for graceful error display and recovery.

### ErrorState Component (Generic)

Generic error display with customizable message, recovery suggestion, and retry functionality.

#### Features

✅ **Customizable Message** - Any error message
✅ **Recovery Suggestions** - Helpful hints for users
✅ **Error Codes** - Display error codes when available
✅ **Technical Details** - Expandable details section
✅ **Retry Button** - Optional retry functionality
✅ **Two Variants** - Error (red) and Warning (yellow)

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `error` | `ErrorInfo` | Yes | - | Error information object |
| `onRetry` | `() => void` | No | - | Callback for retry button |
| `variant` | `'error' \| 'warning'` | No | `'error'` | Visual variant |

```typescript
interface ErrorInfo {
  message: string;
  recovery_suggestion?: string;
  error_code?: string;
  details?: string;
}
```

#### Usage

```tsx
import { ErrorState, createErrorInfo } from './components/ErrorState';

function MyComponent() {
  const query = useQuery();

  if (query.isError) {
    return (
      <ErrorState
        error={createErrorInfo(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  }
}
```

---

### EmptyState Component

Displays when no results are found (not an error, just empty).

#### Features

✅ **Clean Design** - Simple and minimal
✅ **FileText Icon** - Visual indicator
✅ **Helpful Text** - Suggests alternative approaches

#### Props

None

#### Usage

```tsx
import { EmptyState } from './components/ErrorState';

function SearchResults({ results }) {
  if (results.length === 0) {
    return <EmptyState />;
  }

  return <ResultsList results={results} />;
}
```

---

### Specialized Error Components

Pre-configured components for common error scenarios.

#### NetworkErrorState

For network connectivity issues.

```tsx
import { NetworkErrorState } from './components/ErrorState';

<NetworkErrorState onRetry={handleRetry} />
```

#### TimeoutErrorState

For request timeout errors.

```tsx
import { TimeoutErrorState } from './components/ErrorState';

<TimeoutErrorState timeout={30} onRetry={handleRetry} />
```

#### RateLimitErrorState

For rate limit errors with countdown timer.

```tsx
import { RateLimitErrorState } from './components/ErrorState';

<RateLimitErrorState retryAfter={60} onRetry={handleRetry} />
```

**Special Feature**: Live countdown timer that updates every second.

#### AuthenticationErrorState

For authentication/authorization errors.

```tsx
import { AuthenticationErrorState } from './components/ErrorState';

<AuthenticationErrorState onLogin={handleLogin} />
```

---

### createErrorInfo Helper

Helper function to convert any error type to ErrorInfo interface.

#### Usage

```tsx
import { createErrorInfo } from './components/ErrorState';

try {
  await operation();
} catch (error) {
  const errorInfo = createErrorInfo(error);
  // Use errorInfo with ErrorState component
}
```

#### Handles

- String errors: `"Network error"` → `{ message: "Network error" }`
- Error objects: Extracts message and stack trace
- Custom objects: Extracts all relevant fields
- Unknown types: Provides default error message

---

### Error Components Comparison

| Component | Use Case | Props | Color |
|-----------|----------|-------|-------|
| **ErrorState** | Generic errors | error, onRetry?, variant? | Red/Yellow |
| **EmptyState** | No results | None | Gray |
| **NetworkErrorState** | Network issues | onRetry? | Red |
| **TimeoutErrorState** | Request timeout | timeout?, onRetry? | Orange |
| **RateLimitErrorState** | Rate limiting | retryAfter?, onRetry? | Purple |
| **AuthenticationErrorState** | Auth required | onLogin? | Red |

---

## Component Architecture

```
App.tsx
├── SearchBar.tsx          (Search input with features)
├── LoadingState.tsx       (Loading components module)
│   ├── LoadingSkeleton    (Full page skeleton screen)
│   ├── LoadingSpinner     (Inline spinner)
│   └── LoadingState       (Legacy with message)
├── ErrorState.tsx         (Error handling module)
│   ├── ErrorState         (Generic error display)
│   ├── EmptyState         (No results found)
│   ├── NetworkErrorState  (Network issues)
│   ├── TimeoutErrorState  (Request timeout)
│   ├── RateLimitErrorState (Rate limiting)
│   └── AuthenticationErrorState (Auth required)
├── ResultsDisplay.tsx     (Results container)
│   └── ProvenanceCard.tsx (Individual source cards)
└── [Other components...]
```

## Design Principles

1. **Composability** - Small, focused components
2. **Type Safety** - Full TypeScript coverage
3. **Accessibility** - ARIA labels and keyboard support
4. **Performance** - Minimal re-renders with proper state management
5. **Responsiveness** - Mobile-first design approach
6. **User Feedback** - Clear loading and error states
7. **Error Recovery** - Retry functionality for all errors
8. **User-Friendly Messages** - Clear, helpful error explanations
