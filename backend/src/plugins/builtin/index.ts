/**
 * Built-in Data Source Plugins
 *
 * Export all default plugins that come with the system
 */

export { MedicationsPlugin } from './medications.plugin';
export { NotesPlugin } from './notes.plugin';
export { ConditionsPlugin } from './conditions.plugin';
export { AllergiesPlugin } from './allergies.plugin';

// Re-export for convenience
import { MedicationsPlugin } from './medications.plugin';
import { NotesPlugin } from './notes.plugin';
import { ConditionsPlugin } from './conditions.plugin';
import { AllergiesPlugin } from './allergies.plugin';

/**
 * Get all built-in plugins as instances
 */
export function getBuiltInPlugins() {
  return [
    new MedicationsPlugin(),
    new NotesPlugin(),
    new ConditionsPlugin(),
    new AllergiesPlugin(),
  ];
}
