# Avon Health RAG Frontend

Modern React frontend for the Avon Health RAG System - A Retrieval-Augmented Generation interface for Electronic Medical Records.

## Tech Stack

- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **@tanstack/react-query** - Server state management
- **axios** - HTTP client
- **lucide-react** - Icon library
- **react-router-dom** - Routing (ready for future use)

## Project Structure

```
src/
├── components/          # React components
│   ├── SearchBar.tsx    # Search input component
│   ├── ResultsDisplay.tsx # Query results display
│   ├── ProvenanceCard.tsx # Citation/source card
│   └── LoadingState.tsx # Loading indicator
├── hooks/              # Custom React hooks
│   └── useQuery.ts     # RAG query hooks
├── services/           # API services
│   ├── api.ts          # API client functions
│   └── api.service.ts  # Axios service wrapper
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
├── config/             # Configuration
│   └── api.config.ts   # API configuration
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── index.css           # Global styles
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` to set your API URL:

```
VITE_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Check TypeScript types

## Features

### Search Interface

- Real-time query input with character count
- Disabled state during loading
- Form validation

### Results Display

- **Answer Section** - Short answer with confidence score
- **Detailed Summary** - Comprehensive explanation
- **Key Information** - Structured extractions (medications, conditions, etc.)
- **Sources** - Provenance cards with:
  - Artifact type badges
  - Date information
  - Relevance scores
  - Source links
- **Confidence Breakdown** - Visual confidence metrics
- **Metadata** - Processing time, artifacts searched, etc.

### UI/UX

- Responsive design (mobile-friendly)
- Loading states with spinners
- Error handling with user-friendly messages
- Empty state with example queries
- Color-coded confidence levels (high/medium/low)
- Tailwind CSS utility classes

## Components

### SearchBar

Query input component with submit button.

```tsx
<SearchBar
  onSearch={(query) => handleSearch(query)}
  isLoading={isLoading}
  placeholder="Ask a question..."
/>
```

### ResultsDisplay

Comprehensive results display with all query response data.

```tsx
<ResultsDisplay result={uiResponse} />
```

### ProvenanceCard

Individual source/citation card.

```tsx
<ProvenanceCard
  provenance={provenanceItem}
  index={1}
/>
```

### LoadingState

Loading indicator with optional message.

```tsx
<LoadingState message="Searching medical records..." />
```

## Hooks

### useRAGQuery

React Query mutation hook for querying the RAG system.

```tsx
const ragQuery = useRAGQuery();

const handleSearch = async (query: string) => {
  const result = await ragQuery.mutateAsync({
    query,
    patient_id: 'patient-123',
    options: {
      detail_level: 3,
      max_results: 5,
    },
  });
};
```

### useRecentQueries

Fetch recent query history for a patient.

```tsx
const { data, isLoading } = useRecentQueries('patient-123', 10);
```

## API Integration

The frontend communicates with the backend via REST API:

- `POST /api/query` - Submit query
- `GET /api/queries/recent/:patientId` - Get query history
- `GET /api/health` - Health check
- `POST /api/index/:patientId` - Index patient data

## TypeScript Types

All API interfaces are fully typed:

- `UIResponse` - Complete query response
- `QueryRequest` - Query request payload
- `FormattedProvenance` - Source/citation data
- `StructuredExtraction` - Extracted medical data
- `ConfidenceScore` - Confidence metrics
- `QueryHistoryItem` - Historical query data

## Styling

### Tailwind Configuration

Custom colors defined in `tailwind.config.js`:

```js
colors: {
  primary: '#2563eb',  // Blue
  secondary: '#64748b', // Slate gray
}
```

### Component Styling

- Utility-first approach with Tailwind
- Responsive breakpoints
- Hover states and transitions
- Focus states for accessibility

## Development

### Hot Module Replacement (HMR)

Vite provides instant HMR for fast development.

### Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

### Building

Production build with type checking:

```bash
npm run build
```

Output in `dist/` directory.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Proprietary - Avon Health

## Tech Stack Compliance

✅ React 18+ + TypeScript + Tailwind CSS + Vite ONLY
✅ NO Vue, Angular, Bootstrap, or other frameworks
✅ All components use functional React with hooks
✅ Type-safe throughout with TypeScript
✅ Modern React patterns (hooks, context, React Query)
