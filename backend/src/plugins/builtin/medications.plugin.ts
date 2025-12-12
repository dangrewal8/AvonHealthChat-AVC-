/**
 * Medications Plugin
 *
 * Handles fetching and processing medication data from Avon Health API
 */

import { DataSourcePlugin, StructuredExtraction } from '../data-source-plugin.interface';
import { AvonHealthService } from '../../services/avonhealth.service';

export class MedicationsPlugin implements DataSourcePlugin {
  name = 'medications';

  keywords = [
    'medication',
    'medicine',
    'drug',
    'prescription',
    'taking',
    'pill',
    'dosage',
    'prescribed',
  ];

  relatedCompartments = ['patient'];

  async fetch(service: AvonHealthService, patientId: string): Promise<any[]> {
    return await service.getMedications(patientId);
  }

  normalize(data: any): any[] {
    if (!Array.isArray(data)) return [];
    return data;
  }

  toContextString(data: any[]): string {
    if (data.length === 0) {
      return 'No medications found.';
    }

    return data.map(med => {
      const parts: string[] = [];
      if (med.name) parts.push(`Name: ${med.name}`);
      if (med.dosage) parts.push(`Dosage: ${med.dosage}`);
      if (med.frequency) parts.push(`Frequency: ${med.frequency}`);
      if (med.route) parts.push(`Route: ${med.route}`);
      if (med.prescribed_date) parts.push(`Prescribed: ${med.prescribed_date}`);
      if (med.prescriber) parts.push(`Prescriber: ${med.prescriber}`);
      if (med.status) parts.push(`Status: ${med.status}`);

      return parts.join(' | ');
    }).join('\n');
  }

  extractStructuredData(data: any[], query: string): StructuredExtraction[] {
    const queryLower = query.toLowerCase();
    const isMedicationQuery = this.keywords.some(k => queryLower.includes(k));

    if (!isMedicationQuery || data.length === 0) {
      return [];
    }

    return data.map(med => ({
      type: 'medication',
      value: med.name || 'Unknown medication',
      relevance: 0.9,
      confidence: 1.0,
      source_artifact_id: med.id || 'unknown',
      supporting_text: `${med.name || 'Unknown'} - ${med.dosage || 'Unknown dosage'} - ${med.frequency || 'Unknown frequency'}`,
      occurred_at: med.prescribed_date || med.created_at || new Date().toISOString(),
    }));
  }

  isEmptyOrPlaceholder(item: any): boolean {
    return !item.name || item.name.toLowerCase().includes('placeholder');
  }
}
