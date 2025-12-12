# Data Plugin System Guide

## Overview

The Data Plugin System provides an **extensible architecture** for easily adding new API endpoints and data sources to the Avon Health RAG system without modifying core code.

### Key Benefits

✅ **Easy Integration**: Add new data sources with ~50 lines of code
✅ **Auto-Discovery**: Keywords automatically trigger data fetching
✅ **Source Attribution**: Built-in structured extraction support
✅ **Type Safety**: Full TypeScript support
✅ **Containerized**: Each plugin is isolated and self-contained

---

## Quick Start

### 1. Create a New Plugin

```typescript
// src/plugins/custom/lab-results.plugin.ts

import { DataSourcePlugin, StructuredExtraction } from '../data-source-plugin.interface';
import { AvonHealthService } from '../../services/avonhealth.service';

export class LabResultsPlugin implements DataSourcePlugin {
  // Unique identifier (used as key in data object)
  name = 'lab_results';

  // Keywords that trigger fetching this data
  keywords = ['lab', 'test', 'blood work', 'result', 'laboratory'];

  // Other compartments typically fetched with this one
  relatedCompartments = ['patient', 'notes'];

  // Fetch data from API
  async fetch(service: AvonHealthService, patientId: string): Promise<any[]> {
    return await service.getLabResults(patientId);
  }

  // Normalize raw API response
  normalize(data: any): any[] {
    if (!Array.isArray(data)) return [];
    return data;
  }

  // Convert to LLM context string
  toContextString(data: any[]): string {
    if (data.length === 0) return 'No lab results found.';

    return data.map(lab => {
      const parts: string[] = [];
      if (lab.test_name) parts.push(`Test: ${lab.test_name}`);
      if (lab.result) parts.push(`Result: ${lab.result}`);
      if (lab.unit) parts.push(`Unit: ${lab.unit}`);
      if (lab.reference_range) parts.push(`Range: ${lab.reference_range}`);
      if (lab.test_date) parts.push(`Date: ${lab.test_date}`);

      return parts.join(' | ');
    }).join('\n');
  }

  // Extract structured data for source attribution
  extractStructuredData(data: any[], query: string): StructuredExtraction[] {
    const queryLower = query.toLowerCase();
    const isLabQuery = this.keywords.some(k => queryLower.includes(k));

    if (!isLabQuery || data.length === 0) return [];

    return data.map(lab => ({
      type: 'lab_result',
      value: lab.test_name || 'Unknown test',
      relevance: 0.9,
      confidence: 1.0,
      source_artifact_id: lab.id || 'unknown',
      supporting_text: `${lab.test_name}: ${lab.result} ${lab.unit}`,
      occurred_at: lab.test_date || new Date().toISOString(),
    }));
  }

  // Optional: Check if data is empty/placeholder
  isEmptyOrPlaceholder(item: any): boolean {
    return !item.test_name || !item.result;
  }
}
```

### 2. Register the Plugin

```typescript
// src/index.ts or startup file

import { DataPluginRegistry } from './plugins';
import { LabResultsPlugin } from './plugins/custom/lab-results.plugin';

// Register at application startup
DataPluginRegistry.register(new LabResultsPlugin());
```

### 3. It Works Automatically!

Now when a user asks: **"What are my lab results?"**

The system will:
1. ✅ Detect keywords: `lab` → triggers `lab_results` plugin
2. ✅ Fetch only required compartments: `patient + lab_results + notes`
3. ✅ Include lab results in LLM context
4. ✅ Extract structured data with source citations
5. ✅ Show sources to user for verification

---

## Architecture

### Plugin Interface

```typescript
interface DataSourcePlugin<T = any> {
  name: string;                    // Unique identifier
  keywords: string[];               // Trigger keywords
  relatedCompartments?: string[];   // Related data to fetch

  fetch(service, patientId): Promise<T[]>;     // Fetch from API
  normalize(data): T[];                        // Normalize response
  toContextString(data: T[]): string;          // Format for LLM
  extractStructuredData?(data, query): StructuredExtraction[];  // Optional
  isEmptyOrPlaceholder?(item: T): boolean;     // Optional
}
```

### Plugin Registry

The `DataPluginRegistry` manages all plugins:

```typescript
// Register a plugin
DataPluginRegistry.register(new MyPlugin());

// Detect which plugins to use based on query
const plugins = DataPluginRegistry.detectPlugins("What are my lab results?");
// Returns: ['lab_results']

// Get all required compartments
const compartments = DataPluginRegistry.getRequiredCompartments(['lab_results']);
// Returns: ['patient', 'lab_results', 'notes']

// Fetch data for a plugin
const data = await DataPluginRegistry.fetchPlugin('lab_results', service, patientId);

// Get statistics
const stats = DataPluginRegistry.getStats();
// { totalPlugins: 5, pluginNames: [...], totalKeywords: 35 }
```

---

## Built-in Plugins

The system comes with 4 built-in plugins:

### 1. MedicationsPlugin
- **Keywords**: medication, medicine, drug, prescription, pill, dosage
- **Fetches**: Patient medications
- **Related**: patient

### 2. NotesPlugin
- **Keywords**: note, visit, encounter, exam, doctor, clinical, documentation
- **Fetches**: Clinical notes
- **Related**: patient, appointments
- **Special**: Includes sources even for empty/placeholder notes

### 3. ConditionsPlugin
- **Keywords**: condition, diagnosis, disease, illness, diagnosed
- **Fetches**: Medical conditions
- **Related**: patient, notes

### 4. AllergiesPlugin
- **Keywords**: allergy, allergic, reaction, sensitivity, intolerance
- **Fetches**: Patient allergies
- **Related**: patient

---

## Advanced Use Cases

### 1. Plugin with API Method Implementation

If the API method doesn't exist yet in `AvonHealthService`, add it first:

```typescript
// src/services/avonhealth.service.ts

export class AvonHealthService {
  // ... existing methods

  async getLabResults(patientId: string): Promise<any[]> {
    const endpoint = `/v2/patients/${patientId}/lab_results`;
    return await this.makeAuthenticatedRequest<any[]>(endpoint);
  }
}
```

Then create the plugin as shown above.

### 2. Plugin with Complex Normalization

```typescript
normalize(data: any): LabResult[] {
  if (!Array.isArray(data)) return [];

  return data.map(item => ({
    id: item.id,
    test_name: item.test?.name || item.name,
    result: this.parseResult(item.value),
    unit: item.unit_of_measure || item.unit,
    reference_range: this.formatRange(item.reference),
    test_date: item.performed_at || item.created_at,
    status: item.status || 'final',
    is_abnormal: this.checkAbnormal(item),
  }));
}

private parseResult(value: any): string {
  if (typeof value === 'object') return value.value || 'N/A';
  return String(value);
}

private checkAbnormal(item: any): boolean {
  // Custom logic to determine if result is abnormal
  return item.flags?.includes('abnormal') || false;
}
```

### 3. Plugin with Conditional Extraction

```typescript
extractStructuredData(data: any[], query: string): StructuredExtraction[] {
  const queryLower = query.toLowerCase();

  // Only extract if query is specifically about this data type
  if (!this.keywords.some(k => queryLower.includes(k))) {
    return [];
  }

  // Filter to only recent results
  const recent = data.filter(item => {
    const date = new Date(item.test_date);
    const monthsAgo = 6;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsAgo);
    return date >= cutoff;
  });

  return recent.map(item => ({
    type: 'lab_result',
    value: item.test_name,
    relevance: this.calculateRelevance(item, queryLower),
    confidence: 1.0,
    source_artifact_id: item.id,
    supporting_text: this.formatSupportingText(item),
    occurred_at: item.test_date,
  }));
}
```

### 4. Multi-Source Plugin

```typescript
export class ImagingPlugin implements DataSourcePlugin {
  name = 'imaging';
  keywords = ['xray', 'x-ray', 'mri', 'ct scan', 'ultrasound', 'imaging'];
  relatedCompartments = ['patient', 'notes', 'documents'];

  async fetch(service: AvonHealthService, patientId: string): Promise<any[]> {
    // Fetch from multiple endpoints
    const [xrays, mris, ctScans] = await Promise.all([
      service.getXRays(patientId),
      service.getMRIs(patientId),
      service.getCTScans(patientId),
    ]);

    // Combine and normalize
    return [
      ...xrays.map(x => ({ ...x, modality: 'X-Ray' })),
      ...mris.map(m => ({ ...m, modality: 'MRI' })),
      ...ctScans.map(c => ({ ...c, modality: 'CT' })),
    ];
  }

  // ... rest of implementation
}
```

---

## Integration with Data Compartmentalization

The plugin system integrates seamlessly with the existing `DataCompartmentService`:

```typescript
// Before (hardcoded compartments)
const INTENT_TO_COMPARTMENTS = {
  medications: ['patient', 'medications'],
  notes: ['patient', 'notes'],
  // ... hardcoded mappings
};

// After (plugin-powered)
const plugins = DataPluginRegistry.detectPlugins(query);
const compartments = DataPluginRegistry.getRequiredCompartments(plugins);
// Automatically determines what to fetch based on registered plugins
```

---

## Testing Your Plugin

### Unit Test Example

```typescript
// test/plugins/lab-results.plugin.test.ts

import { LabResultsPlugin } from '../../src/plugins/custom/lab-results.plugin';

describe('LabResultsPlugin', () => {
  let plugin: LabResultsPlugin;

  beforeEach(() => {
    plugin = new LabResultsPlugin();
  });

  test('should detect lab-related queries', () => {
    const query = 'Show me my recent blood work results';
    const hasKeyword = plugin.keywords.some(k =>
      query.toLowerCase().includes(k)
    );
    expect(hasKeyword).toBe(true);
  });

  test('should normalize API response', () => {
    const rawData = [
      { id: '1', test: { name: 'CBC' }, value: '5.2', unit: 'mg/dL' },
    ];
    const normalized = plugin.normalize(rawData);
    expect(normalized).toHaveLength(1);
  });

  test('should extract structured data', () => {
    const data = [
      { id: '1', test_name: 'CBC', result: '5.2', unit: 'mg/dL', test_date: '2025-01-01' },
    ];
    const extractions = plugin.extractStructuredData(data, 'show my lab results');
    expect(extractions).toHaveLength(1);
    expect(extractions[0].type).toBe('lab_result');
  });
});
```

### Integration Test

```typescript
// Test with real API
const service = new AvonHealthService(credentials);
const plugin = new LabResultsPlugin();

const data = await plugin.fetch(service, patientId);
const normalized = plugin.normalize(data);
const context = plugin.toContextString(normalized);
const extractions = plugin.extractStructuredData(normalized, 'lab results');

console.log('Fetched:', data.length, 'lab results');
console.log('Context:\n', context);
console.log('Extractions:', extractions.length);
```

---

## Best Practices

### 1. **Keyword Selection**
- Include common variations: "medication" vs "medicine" vs "drug"
- Include medical and layman terms: "hypertension" vs "high blood pressure"
- Avoid overly generic keywords that could trigger false positives

### 2. **Error Handling**
```typescript
async fetch(service: AvonHealthService, patientId: string): Promise<any[]> {
  try {
    return await service.getLabResults(patientId);
  } catch (error) {
    console.error(`Error fetching lab results:`, error);
    return []; // Return empty array on error
  }
}
```

### 3. **Null Safety**
```typescript
toContextString(data: any[]): string {
  return data.map(item => {
    const parts: string[] = [];

    // Safe field access with fallbacks
    if (item.name) parts.push(`Name: ${item.name}`);
    if (item.value) parts.push(`Value: ${item.value}`);

    return parts.join(' | ');
  }).join('\n');
}
```

### 4. **Performance**
- Keep `toContextString` concise (LLMs have token limits)
- Use `relatedCompartments` wisely (don't over-fetch)
- Cache expensive computations in `normalize()`

### 5. **Source Attribution**
Always implement `extractStructuredData` for data types that should show sources:

```typescript
extractStructuredData(data: any[], query: string): StructuredExtraction[] {
  // Check if query is relevant
  const isRelevant = this.keywords.some(k => query.toLowerCase().includes(k));
  if (!isRelevant) return [];

  // Include ALL items for verification (even empty ones)
  return data.map(item => ({
    type: this.name,
    value: item.name || 'Unknown',
    relevance: 0.9,
    confidence: 1.0,
    source_artifact_id: item.id || 'unknown',
    supporting_text: this.formatSupportingText(item),
    occurred_at: item.date || new Date().toISOString(),
  }));
}
```

---

## Migration Guide

### Migrating Existing Hardcoded Data Types

**Before** (hardcoded in `data-compartment.service.ts`):
```typescript
const COMPARTMENT_FETCHERS = {
  medications: () => service.getMedications(patientId),
  notes: () => service.getNotes(patientId),
  // ... hardcoded
};
```

**After** (plugin-based):
```typescript
// 1. Create plugin
export class MedicationsPlugin implements DataSourcePlugin { ... }

// 2. Register at startup
DataPluginRegistry.register(new MedicationsPlugin());

// 3. Use dynamic fetching
const plugins = DataPluginRegistry.detectPlugins(query);
for (const pluginName of plugins) {
  data[pluginName] = await DataPluginRegistry.fetchPlugin(pluginName, service, patientId);
}
```

---

## Troubleshooting

### Plugin Not Triggering

**Problem**: Query contains keywords but plugin doesn't fetch

**Solution**: Check keyword case sensitivity and partial matches
```typescript
keywords = ['lab', 'laboratory', 'test result', 'blood work'];
// Query: "What are my lab test results?" → Should match 'lab' and 'test result'
```

### Empty Extractions

**Problem**: Data fetches correctly but doesn't show in sources

**Solution**: Ensure `extractStructuredData` checks query relevance
```typescript
extractStructuredData(data: any[], query: string): StructuredExtraction[] {
  const queryLower = query.toLowerCase();
  const isRelevant = this.keywords.some(k => queryLower.includes(k));

  if (!isRelevant || data.length === 0) {
    return []; // ← Check this condition
  }

  // ... rest of extraction
}
```

### TypeScript Errors

**Problem**: Type mismatch in plugin methods

**Solution**: Use generic type parameter
```typescript
export class MyPlugin implements DataSourcePlugin<MyDataType> {
  async fetch(service: AvonHealthService, patientId: string): Promise<MyDataType[]> {
    // Type-safe!
  }
}
```

---

## Examples

See these files for complete examples:

- **Medications**: `/src/plugins/builtin/medications.plugin.ts`
- **Notes**: `/src/plugins/builtin/notes.plugin.ts`
- **Conditions**: `/src/plugins/builtin/conditions.plugin.ts`
- **Allergies**: `/src/plugins/builtin/allergies.plugin.ts`

---

## Summary

The plugin system provides:

1. ✅ **Easy addition** of new API endpoints (~50 lines of code)
2. ✅ **Automatic integration** with query understanding and fetching
3. ✅ **Built-in source attribution** for verification
4. ✅ **Containerized architecture** - plugins are isolated
5. ✅ **Type-safe** with full TypeScript support

To add a new data source:
1. Create plugin class implementing `DataSourcePlugin`
2. Register with `DataPluginRegistry.register()`
3. Done! System handles the rest automatically

---

**Questions?** Check the interface definitions in:
- `/src/plugins/data-source-plugin.interface.ts`
- `/src/plugins/plugin-registry.ts`
