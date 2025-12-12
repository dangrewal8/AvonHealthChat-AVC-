/**
 * Data Plugin Registry
 *
 * Central registry for all data source plugins.
 * Manages plugin lifecycle and provides discovery mechanisms.
 */

import { DataSourcePlugin, StructuredExtraction } from './data-source-plugin.interface';
import { AvonHealthService } from '../services/avonhealth.service';

export class DataPluginRegistry {
  private static plugins: Map<string, DataSourcePlugin> = new Map();

  /**
   * Register a new data source plugin
   *
   * @param plugin - Plugin instance to register
   * @throws Error if plugin with same name already exists
   */
  static register(plugin: DataSourcePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name '${plugin.name}' is already registered`);
    }

    console.log(`✅ Registered data plugin: ${plugin.name}`);
    console.log(`   Keywords: ${plugin.keywords.join(', ')}`);
    if (plugin.relatedCompartments) {
      console.log(`   Related compartments: ${plugin.relatedCompartments.join(', ')}`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Unregister a plugin by name
   *
   * @param name - Plugin name to unregister
   */
  static unregister(name: string): void {
    this.plugins.delete(name);
    console.log(`❌ Unregistered data plugin: ${name}`);
  }

  /**
   * Get a plugin by name
   *
   * @param name - Plugin name
   * @returns Plugin instance or undefined
   */
  static get(name: string): DataSourcePlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   *
   * @returns Array of all plugins
   */
  static getAll(): DataSourcePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin names that match query keywords
   *
   * @param query - User query to analyze
   * @returns Array of plugin names that should be fetched
   */
  static detectPlugins(query: string): string[] {
    const queryLower = query.toLowerCase();
    const matchedPlugins: string[] = [];

    for (const [name, plugin] of this.plugins.entries()) {
      const hasKeyword = plugin.keywords.some(keyword =>
        queryLower.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        matchedPlugins.push(name);
      }
    }

    return matchedPlugins;
  }

  /**
   * Get all compartments needed based on detected plugins
   *
   * @param pluginNames - Array of plugin names to fetch
   * @returns Array of all required compartment names (including related ones)
   */
  static getRequiredCompartments(pluginNames: string[]): string[] {
    const compartments = new Set<string>(['patient']); // Always include patient

    for (const name of pluginNames) {
      const plugin = this.plugins.get(name);
      if (!plugin) continue;

      // Add the plugin itself as a compartment
      compartments.add(name);

      // Add any related compartments
      if (plugin.relatedCompartments) {
        plugin.relatedCompartments.forEach(c => compartments.add(c));
      }
    }

    return Array.from(compartments);
  }

  /**
   * Fetch data for a specific plugin
   *
   * @param pluginName - Name of plugin to fetch
   * @param service - AvonHealthService instance
   * @param patientId - Patient ID
   * @returns Fetched and normalized data
   */
  static async fetchPlugin(
    pluginName: string,
    service: AvonHealthService,
    patientId: string
  ): Promise<any[]> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`⚠️  Plugin '${pluginName}' not found, returning empty array`);
      return [];
    }

    try {
      console.log(`   📦 Fetching ${pluginName}...`);
      const rawData = await plugin.fetch(service, patientId);
      const normalized = plugin.normalize(rawData);
      console.log(`   ✅ Fetched ${normalized.length} ${pluginName} items`);
      return normalized;
    } catch (error: any) {
      console.error(`   ❌ Error fetching ${pluginName}:`, error.message);
      return [];
    }
  }

  /**
   * Extract structured data from all plugins
   *
   * @param data - Compartmentalized data object
   * @param query - User's original query
   * @returns Array of all structured extractions
   */
  static extractAllStructuredData(
    data: Record<string, any>,
    query: string
  ): StructuredExtraction[] {
    const extractions: StructuredExtraction[] = [];

    for (const [name, plugin] of this.plugins.entries()) {
      if (!plugin.extractStructuredData) continue;
      if (!data[name] || data[name].length === 0) continue;

      try {
        const pluginExtractions = plugin.extractStructuredData(data[name], query);
        extractions.push(...pluginExtractions);
      } catch (error: any) {
        console.error(`Error extracting structured data from ${name}:`, error.message);
      }
    }

    return extractions;
  }

  /**
   * Convert all data to LLM context string
   *
   * @param data - Compartmentalized data object
   * @returns Formatted context string for LLM
   */
  static toContextString(data: Record<string, any>): string {
    const sections: string[] = [];

    for (const [name, plugin] of this.plugins.entries()) {
      if (!data[name]) continue;

      const items = Array.isArray(data[name]) ? data[name] : [data[name]];
      if (items.length === 0) continue;

      try {
        const contextStr = plugin.toContextString(items);
        if (contextStr.trim()) {
          sections.push(`## ${name.toUpperCase()}\n${contextStr}`);
        }
      } catch (error: any) {
        console.error(`Error converting ${name} to context:`, error.message);
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Clear all registered plugins (useful for testing)
   */
  static clear(): void {
    this.plugins.clear();
    console.log('🧹 Cleared all plugins');
  }

  /**
   * Get registry statistics
   */
  static getStats(): {
    totalPlugins: number;
    pluginNames: string[];
    totalKeywords: number;
  } {
    const allKeywords = new Set<string>();
    for (const plugin of this.plugins.values()) {
      plugin.keywords.forEach(k => allKeywords.add(k));
    }

    return {
      totalPlugins: this.plugins.size,
      pluginNames: Array.from(this.plugins.keys()),
      totalKeywords: allKeywords.size,
    };
  }
}
