# Frontend Configuration

This directory contains API and environment configuration for the Avon Health RAG frontend.

## Usage

Import and use the configuration:

```typescript
import apiConfig, { API_ENDPOINTS } from './config/api.config';

// Access configuration
console.log(apiConfig.baseUrl);
console.log(apiConfig.appName);

// Use API endpoints
const queryEndpoint = `${apiConfig.baseUrl}${API_ENDPOINTS.query}`;
const carePlansEndpoint = `${apiConfig.baseUrl}${API_ENDPOINTS.emr.carePlans}`;
```

## Configuration Structure

```typescript
interface ApiConfig {
  baseUrl: string;
  appName: string;
  appVersion: string;
  features: {
    streaming: boolean;
  };
  timeout: number;
  retryAttempts: number;
}
```

## API Endpoints

All API endpoints are defined in `API_ENDPOINTS`:

```typescript
API_ENDPOINTS = {
  health: '/health',
  query: '/api/query',
  emr: {
    carePlans: '/api/emr/care_plans',
    medications: '/api/emr/medications',
    notes: '/api/emr/notes',
    all: '/api/emr/all',
  },
  queries: {
    recent: '/api/queries/recent',
  },
  index: {
    patient: (patientId: string) => `/api/index/patient/${patientId}`,
  },
  metrics: '/api/metrics',
}
```

## Environment Variables

All Vite environment variables must be prefixed with `VITE_`.

### Required
- `VITE_API_BASE_URL` - Backend API URL (e.g., "http://localhost:3001")

### Optional
- `VITE_APP_NAME` - Default: "Avon Health RAG"
- `VITE_APP_VERSION` - Default: "1.0.0"
- `VITE_ENABLE_STREAMING` - Default: false

## Type Safety

TypeScript types for environment variables are defined in `vite-env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_STREAMING: string;
}
```

## Validation

The configuration validator:
1. Checks required variables exist
2. Validates URL format
3. Throws errors on missing required config
4. Provides sensible defaults for optional values

## Example Usage in Components

```typescript
import axios from 'axios';
import apiConfig, { API_ENDPOINTS } from '../config/api.config';

const api = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
});

// Make API calls
const response = await api.post(API_ENDPOINTS.query, {
  query: "What medications?",
  patient_id: "123"
});
```
