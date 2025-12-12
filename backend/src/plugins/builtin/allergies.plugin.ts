/**
 * Allergies Plugin
 *
 * Handles fetching and processing allergy data from Avon Health API
 */

import { DataSourcePlugin, StructuredExtraction } from '../data-source-plugin.interface';
import { AvonHealthService } from '../../services/avonhealth.service';

export class AllergiesPlugin implements DataSourcePlugin {
  name = 'allergies';

  keywords = [
    'allergy',
    'allergies',
    'allergic',
    'reaction',
    'sensitivity',
    'intolerance',
  ];

  relatedCompartments = ['patient'];

  async fetch(service: AvonHealthService, patientId: string): Promise<any[]> {
    return await service.getAllergies(patientId);
  }

  normalize(data: any): any[] {
    if (!Array.isArray(data)) return [];
    return data;
  }

  toContextString(data: any[]): string {
    if (data.length === 0) {
      return 'No allergies found.';
    }

    return data.map(allergy => {
      const parts: string[] = [];
      if (allergy.allergen) parts.push(`Allergen: ${allergy.allergen}`);
      if (allergy.reaction) parts.push(`Reaction: ${allergy.reaction}`);
      if (allergy.severity) parts.push(`Severity: ${allergy.severity}`);
      if (allergy.onset_date) parts.push(`Onset: ${allergy.onset_date}`);
      if (allergy.status) parts.push(`Status: ${allergy.status}`);

      return parts.join(' | ');
    }).join('\n');
  }

  extractStructuredData(data: any[], query: string): StructuredExtraction[] {
    const queryLower = query.toLowerCase();
    const isAllergyQuery = this.keywords.some(k => queryLower.includes(k));

    if (!isAllergyQuery || data.length === 0) {
      return [];
    }

    return data.map(allergy => ({
      type: 'allergy',
      value: allergy.allergen || 'Unknown allergen',
      relevance: 0.9,
      confidence: 1.0,
      source_artifact_id: allergy.id || 'unknown',
      supporting_text: `${allergy.allergen || 'Unknown'} - Reaction: ${allergy.reaction || 'Unknown'} - Severity: ${allergy.severity || 'Unknown'}`,
      occurred_at: allergy.onset_date || allergy.created_at || new Date().toISOString(),
    }));
  }

  isEmptyOrPlaceholder(item: any): boolean {
    return !item.allergen || item.allergen.toLowerCase().includes('placeholder');
  }
}
