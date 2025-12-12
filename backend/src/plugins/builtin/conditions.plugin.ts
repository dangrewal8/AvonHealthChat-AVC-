/**
 * Conditions Plugin
 *
 * Handles fetching and processing condition/diagnosis data from Avon Health API
 */

import { DataSourcePlugin, StructuredExtraction } from '../data-source-plugin.interface';
import { AvonHealthService } from '../../services/avonhealth.service';

export class ConditionsPlugin implements DataSourcePlugin {
  name = 'conditions';

  keywords = [
    'condition',
    'conditions',
    'diagnosis',
    'diagnoses',
    'disease',
    'illness',
    'diagnosed',
    'health issue',
  ];

  relatedCompartments = ['patient', 'notes'];

  async fetch(service: AvonHealthService, patientId: string): Promise<any[]> {
    return await service.getConditions(patientId);
  }

  normalize(data: any): any[] {
    if (!Array.isArray(data)) return [];
    return data;
  }

  toContextString(data: any[]): string {
    if (data.length === 0) {
      return 'No conditions found.';
    }

    return data.map(condition => {
      const parts: string[] = [];
      if (condition.name) parts.push(`Condition: ${condition.name}`);
      if (condition.code) parts.push(`Code: ${condition.code}`);
      if (condition.status) parts.push(`Status: ${condition.status}`);
      if (condition.onset_date) parts.push(`Onset: ${condition.onset_date}`);
      if (condition.diagnosed_date) parts.push(`Diagnosed: ${condition.diagnosed_date}`);
      if (condition.severity) parts.push(`Severity: ${condition.severity}`);

      return parts.join(' | ');
    }).join('\n');
  }

  extractStructuredData(data: any[], query: string): StructuredExtraction[] {
    const queryLower = query.toLowerCase();
    const isConditionQuery = this.keywords.some(k => queryLower.includes(k));

    if (!isConditionQuery || data.length === 0) {
      return [];
    }

    return data.map(condition => ({
      type: 'condition',
      value: condition.name || 'Unknown condition',
      relevance: 0.9,
      confidence: 1.0,
      source_artifact_id: condition.id || 'unknown',
      supporting_text: `${condition.name || 'Unknown'} - Status: ${condition.status || 'Unknown'} - ${condition.diagnosed_date ? `Diagnosed: ${condition.diagnosed_date}` : 'Date unknown'}`,
      occurred_at: condition.diagnosed_date || condition.onset_date || new Date().toISOString(),
    }));
  }

  isEmptyOrPlaceholder(item: any): boolean {
    return !item.name || item.name.toLowerCase().includes('placeholder');
  }
}
