/**
 * Data Plugin System
 *
 * Export all plugin interfaces, registry, and built-in plugins
 */

// Core interfaces
export * from './data-source-plugin.interface';
export * from './plugin-registry';

// Built-in plugins
export * from './builtin';

// Convenience function to initialize all built-in plugins
import { DataPluginRegistry } from './plugin-registry';
import { getBuiltInPlugins } from './builtin';

/**
 * Initialize and register all built-in plugins
 *
 * Call this at application startup to enable default data sources
 */
export function initializeBuiltInPlugins(): void {
  const plugins = getBuiltInPlugins();

  console.log(`🔌 Initializing ${plugins.length} built-in data plugins...`);

  for (const plugin of plugins) {
    DataPluginRegistry.register(plugin);
  }

  const stats = DataPluginRegistry.getStats();
  console.log(`✅ Plugin system ready: ${stats.totalPlugins} plugins, ${stats.totalKeywords} keywords`);
}
