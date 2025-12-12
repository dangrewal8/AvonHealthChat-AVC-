/**
 * Data Source Plugin Interface
 *
 * This interface allows easy adaptation to new API endpoints and data sources.
 * Simply implement this interface for any new data type, and the system will
 * automatically integrate it into compartmentalized fetching and LLM context.
 *
 * Example: Adding a new "Lab Results" endpoint
 *
 * ```typescript
 * export class LabResultsPlugin implements DataSourcePlugin<LabResult> {
 *   name = 'lab_results';
 *   keywords = ['lab', 'test', 'blood work', 'result'];
 *   relatedCompartments = ['patient', 'notes'];
 *
 *   async fetch(service: AvonHealthService, patientId: string): Promise<LabResult[]> {
 *     return await service.getLabResults(patientId);
 *   }
 *
 *   normalize(data: any): LabResult[] {
 *     return data.map(item => ({ ... }));
 *   }
 *
 *   toContextString(data: LabResult[]): string {
 *     return data.map(lab => `${lab.test}: ${lab.result}`).join('\n');
 *   }
 * }
 *
 * // Register the plugin
 * DataPluginRegistry.register(new LabResultsPlugin());
 * ```
 */

import { AvonHealthService } from '../services/avonhealth.service';

/**
 * Base interface for all data source plugins
 */
export interface DataSourcePlugin<T = any> {
  /**
   * Unique identifier for this data source
   * Used as key in CompartmentalizedData object
   * Example: 'medications', 'notes', 'lab_results'
   */
  name: string;

  /**
   * Keywords that trigger fetching this data source
   * Used for query intent detection
   * Example: ['medication', 'medicine', 'drug', 'prescription']
   */
  keywords: string[];

  /**
   * Other compartments commonly fetched with this one
   * Used to optimize parallel fetching
   * Example: ['patient', 'notes'] for lab results
   */
  relatedCompartments?: string[];

  /**
   * Fetch data from the API endpoint
   *
   * @param service - Authenticated AvonHealthService instance
   * @param patientId - Patient ID to fetch data for
   * @returns Promise resolving to array of data items
   */
  fetch(service: AvonHealthService, patientId: string): Promise<T[]>;

  /**
   * Normalize raw API response into standard format
   *
   * @param data - Raw data from API
   * @returns Normalized data array
   */
  normalize(data: any): T[];

  /**
   * Convert data to LLM context string
   *
   * @param data - Normalized data array
   * @returns String representation for LLM consumption
   */
  toContextString(data: T[]): string;

  /**
   * Extract structured data for verification
   *
   * @param data - Normalized data array
   * @param query - User's original query
   * @returns Array of structured extractions with source attribution
   */
  extractStructuredData?(data: T[], query: string): StructuredExtraction[];

  /**
   * Validate if data is empty/placeholder
   *
   * @param item - Single data item
   * @returns true if item is empty or contains placeholder content
   */
  isEmptyOrPlaceholder?(item: T): boolean;
}

/**
 * Structured extraction format for verification
 */
export interface StructuredExtraction {
  type: string;
  value: string;
  relevance: number;
  confidence: number;
  source_artifact_id: string;
  supporting_text: string;
  occurred_at: string;
}

/**
 * Plugin metadata for registration
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: string[];
}

/**
 * Extended plugin interface with metadata
 */
export interface DataSourcePluginWithMetadata<T = any> extends DataSourcePlugin<T> {
  metadata: PluginMetadata;
}
