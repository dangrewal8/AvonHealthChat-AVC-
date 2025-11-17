/**
 * Query History Service
 * Persists query history to disk for analytics and debugging
 *
 * Features:
 * - Stores last 100 queries per patient
 * - Automatic persistence to disk
 * - Load on startup
 */

import * as fs from 'fs';
import * as path from 'path';
import { QueryHistoryItem } from '../types/api.types';

/**
 * Query History Service Class
 * Manages query history with disk persistence
 */
class QueryHistoryService {
  private queryHistory: Map<string, QueryHistoryItem[]> = new Map();
  private readonly maxQueriesPerPatient: number = 100;
  private readonly savePath: string = './data/query-history/history.json';

  /**
   * Add query to history
   * @param patientId - Patient ID
   * @param item - Query history item
   */
  addToHistory(patientId: string, item: QueryHistoryItem): void {
    const history = this.queryHistory.get(patientId) || [];
    history.push(item);

    // Keep only last 100 queries per patient
    if (history.length > this.maxQueriesPerPatient) {
      history.shift();
    }

    this.queryHistory.set(patientId, history);
  }

  /**
   * Get recent queries for a patient
   * @param patientId - Patient ID
   * @param limit - Number of queries to return (default: 10)
   * @returns Array of query history items (most recent first)
   */
  getRecentQueries(patientId: string, limit: number = 10): QueryHistoryItem[] {
    const history = this.queryHistory.get(patientId) || [];
    return history.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get total query count for a patient
   * @param patientId - Patient ID
   * @returns Total query count
   */
  getQueryCount(patientId: string): number {
    const history = this.queryHistory.get(patientId) || [];
    return history.length;
  }

  /**
   * Clear history for a patient
   * @param patientId - Patient ID
   */
  clearHistory(patientId: string): void {
    this.queryHistory.delete(patientId);
    console.log(`[QueryHistory] Cleared history for patient ${patientId}`);
  }

  /**
   * Save query history to disk
   * @param filepath - Optional file path (default: ./data/query-history/history.json)
   */
  async save(filepath?: string): Promise<void> {
    const savePath = filepath || this.savePath;

    try {
      console.log(`[QueryHistory] Saving query history to ${savePath}`);

      // Ensure directory exists
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert Map to array for JSON serialization
      const historyData = Array.from(this.queryHistory.entries());

      fs.writeFileSync(savePath, JSON.stringify(historyData, null, 2));

      const totalQueries = historyData.reduce((sum, [_, queries]) => sum + queries.length, 0);

      console.log('[QueryHistory] ✓ Query history saved successfully');
      console.log(`  Total patients: ${this.queryHistory.size}`);
      console.log(`  Total queries: ${totalQueries}`);
      console.log(`  File: ${savePath}\n`);
    } catch (error) {
      console.error('[QueryHistory] Failed to save history:', error);
      throw new Error(
        `Failed to save query history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load query history from disk
   * @param filepath - Optional file path (default: ./data/query-history/history.json)
   */
  async load(filepath?: string): Promise<void> {
    const loadPath = filepath || this.savePath;

    try {
      console.log(`[QueryHistory] Loading query history from ${loadPath}`);

      if (!fs.existsSync(loadPath)) {
        throw new Error(`History file not found: ${loadPath}`);
      }

      const historyData = JSON.parse(fs.readFileSync(loadPath, 'utf-8'));

      // Restore Map
      this.queryHistory = new Map(historyData);

      const totalQueries = historyData.reduce(
        (sum: number, [_, queries]: [string, QueryHistoryItem[]]) => sum + queries.length,
        0
      );

      console.log('[QueryHistory] ✓ Query history loaded successfully');
      console.log(`  Total patients: ${this.queryHistory.size}`);
      console.log(`  Total queries: ${totalQueries}\n`);
    } catch (error) {
      console.error('[QueryHistory] Failed to load history:', error);
      throw new Error(
        `Failed to load query history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalPatients: number;
    totalQueries: number;
    queriesPerPatient: Record<string, number>;
  } {
    const queriesPerPatient: Record<string, number> = {};
    let totalQueries = 0;

    for (const [patientId, queries] of this.queryHistory.entries()) {
      queriesPerPatient[patientId] = queries.length;
      totalQueries += queries.length;
    }

    return {
      totalPatients: this.queryHistory.size,
      totalQueries,
      queriesPerPatient,
    };
  }
}

// Export singleton instance
export const queryHistoryService = new QueryHistoryService();
export default queryHistoryService;
