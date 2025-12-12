/**
 * Clinical Notes Plugin
 *
 * Handles fetching and processing clinical notes from Avon Health API
 */

import { DataSourcePlugin, StructuredExtraction } from '../data-source-plugin.interface';
import { AvonHealthService } from '../../services/avonhealth.service';

export class NotesPlugin implements DataSourcePlugin {
  name = 'notes';

  keywords = [
    'note',
    'notes',
    'visit',
    'encounter',
    'exam',
    'doctor',
    'physician',
    'clinical',
    'documentation',
  ];

  relatedCompartments = ['patient', 'appointments'];

  async fetch(service: AvonHealthService, patientId: string): Promise<any[]> {
    return await service.getNotes(patientId);
  }

  normalize(data: any): any[] {
    if (!Array.isArray(data)) return [];
    return data;
  }

  toContextString(data: any[]): string {
    if (data.length === 0) {
      return 'No clinical notes found.';
    }

    return data.map(note => {
      const parts: string[] = [];
      if (note.name) parts.push(`Title: ${note.name}`);
      if (note.type) parts.push(`Type: ${note.type}`);
      if (note.created_at) parts.push(`Date: ${note.created_at}`);
      if (note.created_by) parts.push(`Author: ${note.created_by}`);

      const content = note.content || note.text || '';
      const isEmpty = this.isEmptyOrPlaceholder(note);

      if (isEmpty) {
        parts.push('Status: Empty/Placeholder');
      } else {
        parts.push(`Content: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`);
      }

      return parts.join(' | ');
    }).join('\n');
  }

  extractStructuredData(data: any[], query: string): StructuredExtraction[] {
    const queryLower = query.toLowerCase();
    const isNotesQuery = this.keywords.some(k => queryLower.includes(k));

    if (!isNotesQuery) {
      return [];
    }

    // ALWAYS include notes as sources when query is about notes
    // This allows users to verify that notes are actually empty/placeholder
    return data.map(note => {
      const noteContent = note.content || note.text || '';
      const isEmpty = this.isEmptyOrPlaceholder(note);

      const parts: string[] = [];
      if (note.name) parts.push(`Title: ${note.name}`);
      if (note.created_at) parts.push(`Created: ${note.created_at}`);
      if (note.created_by) parts.push(`Author: ${note.created_by}`);

      if (isEmpty) {
        parts.push('Status: Empty/Placeholder');
      } else {
        parts.push(`Content: ${noteContent.substring(0, 100)}...`);
      }

      return {
        type: 'note',
        value: note.name || 'Medical Note',
        relevance: 0.8,
        confidence: 1.0,
        source_artifact_id: note.id || 'unknown',
        supporting_text: parts.join(' | '),
        occurred_at: note.created_at || new Date().toISOString(),
      };
    });
  }

  isEmptyOrPlaceholder(item: any): boolean {
    const content = item.content || item.text || '';
    return (
      !content ||
      content.trim() === '' ||
      content.toLowerCase().includes('lorem ipsum') ||
      content.toLowerCase().includes('placeholder')
    );
  }
}
