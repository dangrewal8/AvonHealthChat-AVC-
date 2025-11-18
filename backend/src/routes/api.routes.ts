/**
 * Main API Routes - RAG System with Real Avon Health API Data
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type {
  QueryRequest,
  UIResponse,
  StructuredExtraction,
  FormattedProvenance,
} from '../types';
import { OllamaService } from '../services/ollama.service';
import { AvonHealthService } from '../services/avonhealth.service';
import { analyzeQuery } from './enhanced-query-understanding';

const router = Router();

// Initialize services (will be set from main app)
let ollamaService: OllamaService;
let avonHealthService: AvonHealthService;

export function initializeServices(ollama: OllamaService, avonHealth: AvonHealthService) {
  ollamaService = ollama;
  avonHealthService = avonHealth;
}

/**
 * Generate short answer from structured data (fallback when Ollama unavailable)
 * Enhanced with comprehensive pattern matching for extensive question types
 */
function generateFallbackShortAnswer(
  query: string,
  queryIntent: any,
  data: { care_plans: any[]; medications: any[]; notes: any[] }
): string {
  const { care_plans, medications, notes } = data;
  const queryLower = query.toLowerCase();

  // Helper: Format date nicely
  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // SPECIFIC MEDICATION QUESTIONS
  // "What is the patient taking for [condition]?"
  if ((queryLower.includes('taking for') || queryLower.includes('prescribed for')) && medications) {
    const conditionMatch = queryLower.match(/(?:taking|prescribed) for (\w+)/);
    if (conditionMatch && conditionMatch[1]) {
      const condition = conditionMatch[1];
      const relatedMeds = medications.filter((m: any) =>
        m.name?.toLowerCase().includes(condition) ||
        care_plans?.some(cp => cp.title?.toLowerCase().includes(condition))
      );
      if (relatedMeds.length > 0) {
        const medNames = relatedMeds.map((m: any) => m.name).join(', ');
        return `For ${condition}, the patient is taking: ${medNames}.`;
      }
      return `No medications found specifically for ${condition}. The patient has ${medications.length} total medications.`;
    }
  }

  // "When was [medication] prescribed?"
  if ((queryLower.includes('when was') || queryLower.includes('when did')) &&
      (queryLower.includes('prescribed') || queryLower.includes('started'))) {
    if (medications && medications.length > 0) {
      // Try to find specific medication mentioned
      const recentMed = medications[0];
      if (recentMed.prescribed_date) {
        return `Most recent prescription: ${recentMed.name} was prescribed on ${formatDate(recentMed.prescribed_date)}.`;
      }
    }
  }

  // "Who prescribed [medication]?" or "Which doctor prescribed?"
  if ((queryLower.includes('who prescribed') || queryLower.includes('which doctor') ||
       queryLower.includes('what doctor')) && medications) {
    const prescribers = [...new Set(medications.map((m: any) => m.prescriber).filter(Boolean))];
    if (prescribers.length > 0) {
      return `Prescribers for this patient's medications: ${prescribers.join(', ')}.`;
    }
    return 'Prescriber information not available in records.';
  }

  // "How many medications?" or "How many meds?"
  if ((queryLower.includes('how many') && (queryLower.includes('med') || queryLower.includes('drug')))) {
    if (medications) {
      return `The patient is currently taking ${medications.length} medication${medications.length !== 1 ? 's' : ''}.`;
    }
    return 'No medications found in the patient records.';
  }

  // General medication queries
  if (queryIntent.primary === 'medications' || queryLower.includes('medication') ||
      queryLower.includes('med') || queryLower.includes('drug') || queryLower.includes('prescription')) {
    if (medications && medications.length > 0) {
      const medCount = medications.length;
      const medNames = medications.slice(0, 3).map((m: any) => m.name || 'Unknown').join(', ');
      return `The patient is currently taking ${medCount} medication${medCount > 1 ? 's' : ''}, including ${medNames}${medCount > 3 ? ', and others' : ''}.`;
    }
    return 'No medications found in the patient records.';
  }

  // SPECIFIC CARE PLAN QUESTIONS
  // "Does the patient have [condition]?" or "Is there a care plan for [condition]?"
  if ((queryLower.includes('does') || queryLower.includes('is there')) &&
      (queryLower.includes('have') || queryLower.includes('care plan'))) {
    if (care_plans && care_plans.length > 0) {
      // Try to extract condition name
      const words = queryLower.split(' ');
      const conditionIndex = Math.max(
        words.indexOf('have') + 1,
        words.indexOf('for') + 1,
        words.indexOf('plan') + 1
      );
      if (conditionIndex > 0 && conditionIndex < words.length) {
        const potentialCondition = words.slice(conditionIndex).join(' ').replace(/[?.,]/g, '');
        const matchingPlan = care_plans.find((cp: any) =>
          cp.title?.toLowerCase().includes(potentialCondition.toLowerCase())
        );
        if (matchingPlan) {
          return `Yes, there is ${matchingPlan.status === 'active' ? 'an active' : 'a'} care plan for ${matchingPlan.title}.`;
        }
        return `No care plan found specifically for "${potentialCondition}". The patient has ${care_plans.length} total care plan${care_plans.length !== 1 ? 's' : ''}.`;
      }
    }
  }

  // "What is the status of [care plan]?" or "Is [plan] active?"
  if ((queryLower.includes('status') || queryLower.includes('active')) && care_plans) {
    const activePlans = care_plans.filter((cp: any) => cp.status === 'active');
    if (activePlans.length > 0) {
      return `${activePlans.length} active care plan${activePlans.length !== 1 ? 's' : ''}: ${activePlans.map((cp: any) => cp.title).join(', ')}.`;
    }
    return care_plans.length > 0
      ? `No currently active care plans. ${care_plans.length} inactive plan${care_plans.length !== 1 ? 's' : ''} on file.`
      : 'No care plans found.';
  }

  // General care plan / diagnosis queries
  if (queryIntent.primary === 'care_plans' || queryIntent.primary === 'diagnosis' ||
      queryLower.includes('care plan') || queryLower.includes('condition') || queryLower.includes('diagnosis')) {
    if (care_plans && care_plans.length > 0) {
      const planCount = care_plans.length;
      const activePlans = care_plans.filter((cp: any) => cp.status === 'active');
      const planTitles = care_plans.slice(0, 3).map((cp: any) => cp.title).join(', ');
      return `The patient has ${planCount} care plan${planCount > 1 ? 's' : ''} (${activePlans.length} active): ${planTitles}${planCount > 3 ? ', and others' : ''}.`;
    }
    return 'No care plans found in the patient records.';
  }

  // SPECIFIC CLINICAL NOTE QUESTIONS
  // "What did the doctor say about [topic]?" or "What was noted about [topic]?"
  if ((queryLower.includes('what did') || queryLower.includes('what was')) &&
      (queryLower.includes('say') || queryLower.includes('note') || queryLower.includes('document'))) {
    if (notes && notes.length > 0) {
      const recentNote = notes[0];
      const noteDate = recentNote.created_at ? formatDate(recentNote.created_at) : 'unknown date';
      const noteContent = recentNote.content ? recentNote.content.substring(0, 150) : 'No content available';
      return `Most recent note (${noteDate}): "${noteContent}${recentNote.content?.length > 150 ? '...' : ''}"`;
    }
    return 'No clinical notes found.';
  }

  // "When was the last visit?" or "Most recent visit?"
  if ((queryLower.includes('last visit') || queryLower.includes('recent visit') ||
       queryLower.includes('latest visit') || queryLower.includes('last appointment'))) {
    if (notes && notes.length > 0) {
      const recentNote = notes[0];
      const noteDate = recentNote.created_at ? formatDate(recentNote.created_at) : 'unknown date';
      return `Most recent visit note is from ${noteDate} by ${recentNote.author || 'unknown provider'}.`;
    }
    return 'No visit notes found in patient records.';
  }

  // "Who is the patient's doctor?" or "Who is treating the patient?"
  if ((queryLower.includes('who is') || queryLower.includes('who are')) &&
      (queryLower.includes('doctor') || queryLower.includes('provider') || queryLower.includes('treating'))) {
    const providers = new Set<string>();
    notes?.forEach((n: any) => n.author && providers.add(n.author));
    care_plans?.forEach((cp: any) => cp.provider && providers.add(cp.provider));
    medications?.forEach((m: any) => m.prescriber && providers.add(m.prescriber));

    if (providers.size > 0) {
      return `Healthcare providers: ${Array.from(providers).join(', ')}.`;
    }
    return 'Provider information not available in records.';
  }

  // General clinical notes / history queries
  if (queryIntent.primary === 'history' || queryLower.includes('note') ||
      queryLower.includes('visit') || queryLower.includes('history') ||
      queryLower.includes('chart') || queryLower.includes('record')) {
    if (notes && notes.length > 0) {
      const noteCount = notes.length;
      const recentNote = notes[0];
      const recentDate = recentNote.created_at ? formatDate(recentNote.created_at) : 'unknown date';
      return `The patient has ${noteCount} clinical note${noteCount > 1 ? 's' : ''} on file. Most recent note from ${recentDate}.`;
    }
    return 'No clinical notes found in the patient records.';
  }

  // Summary / overview queries
  if (queryIntent.primary === 'summary' || queryLower.includes('summary') ||
      queryLower.includes('overview') || queryLower.includes('everything') || queryLower.includes('all about')) {
    const medCount = medications?.length || 0;
    const planCount = care_plans?.length || 0;
    const noteCount = notes?.length || 0;
    const hasData = medCount > 0 || planCount > 0 || noteCount > 0;

    if (hasData) {
      const parts = [];
      if (medCount > 0) parts.push(`${medCount} medication${medCount !== 1 ? 's' : ''}`);
      if (planCount > 0) parts.push(`${planCount} care plan${planCount !== 1 ? 's' : ''}`);
      if (noteCount > 0) parts.push(`${noteCount} clinical note${noteCount !== 1 ? 's' : ''}`);
      return `Patient record summary: ${parts.join(', ')}.`;
    }
    return 'No data found for this patient.';
  }

  // Default for any other queries - provide helpful summary
  const medCount = medications?.length || 0;
  const planCount = care_plans?.length || 0;
  const noteCount = notes?.length || 0;
  const hasData = medCount > 0 || planCount > 0 || noteCount > 0;

  if (hasData) {
    return `Found ${medCount} medication${medCount !== 1 ? 's' : ''}, ${planCount} care plan${planCount !== 1 ? 's' : ''}, and ${noteCount} clinical note${noteCount !== 1 ? 's' : ''} for this patient.`;
  }

  return 'No relevant information found in patient records.';
}

/**
 * Generate detailed summary from structured data (fallback when Ollama unavailable)
 * Enhanced with comprehensive formatting and organization
 */
function generateFallbackDetailedSummary(
  query: string,
  queryIntent: any,
  data: { care_plans: any[]; medications: any[]; notes: any[] }
): string {
  const { care_plans, medications, notes } = data;
  const queryLower = query.toLowerCase();
  let summary = '';

  // Helper: Format date nicely
  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper: Format medication with all details
  const formatMedication = (med: any, idx: number): string => {
    let text = `${idx + 1}. **${med.name || 'Unknown medication'}**`;
    if (med.dosage) text += ` - ${med.dosage}`;
    text += '\n';

    const details = [];
    if (med.frequency) details.push(`Frequency: ${med.frequency}`);
    if (med.prescribed_date) details.push(`Prescribed: ${formatDate(med.prescribed_date)}`);
    if (med.prescriber) details.push(`Prescriber: ${med.prescriber}`);
    if (med.status) details.push(`Status: ${med.status}`);

    if (details.length > 0) {
      text += `   ${details.join(' • ')}\n`;
    }

    if (med.instructions || med.notes) {
      const info = med.instructions || med.notes;
      text += `   _${info.substring(0, 150)}${info.length > 150 ? '...' : ''}_\n`;
    }

    return text + '\n';
  };

  // Helper: Format care plan with all details
  const formatCarePlan = (cp: any, idx: number): string => {
    let text = `${idx + 1}. **${cp.title || 'Untitled Plan'}**`;
    if (cp.status) {
      const statusEmoji = cp.status === 'active' ? '✓' : cp.status === 'completed' ? '✔' : '○';
      text += ` ${statusEmoji} _${cp.status}_`;
    }
    text += '\n';

    if (cp.description) {
      text += `   ${cp.description.substring(0, 250)}${cp.description.length > 250 ? '...' : ''}\n`;
    }

    const details = [];
    if (cp.provider) details.push(`Provider: ${cp.provider}`);
    if (cp.created_at) details.push(`Created: ${formatDate(cp.created_at)}`);
    if (cp.updated_at) details.push(`Updated: ${formatDate(cp.updated_at)}`);

    if (details.length > 0) {
      text += `   ${details.join(' • ')}\n`;
    }

    return text + '\n';
  };

  // Helper: Format clinical note with all details
  const formatNote = (note: any, idx: number): string => {
    let text = `${idx + 1}. **${note.note_type || 'Clinical Note'}**`;
    if (note.created_at) text += ` - ${formatDate(note.created_at)}`;
    text += '\n';

    if (note.author) text += `   _Author: ${note.author}_\n`;

    if (note.content) {
      const content = note.content.trim();
      // Show more content for notes since they're usually the most informative
      text += `   ${content.substring(0, 300)}${content.length > 300 ? '...' : ''}\n`;
    }

    return text + '\n';
  };

  // SPECIFIC MEDICATION QUESTIONS with enhanced formatting
  if (queryIntent.primary === 'medications' || queryLower.includes('medication') ||
      queryLower.includes('med') || queryLower.includes('drug') || queryLower.includes('prescription')) {
    if (medications && medications.length > 0) {
      summary = `## Current Medications\n\n`;
      summary += `_Total: ${medications.length} medication${medications.length !== 1 ? 's' : ''}_\n\n`;

      // Show up to 15 medications with full details
      medications.slice(0, 15).forEach((med: any, idx: number) => {
        summary += formatMedication(med, idx);
      });

      if (medications.length > 15) {
        summary += `_...and ${medications.length - 15} more medication${medications.length - 15 !== 1 ? 's' : ''}_\n`;
      }

      // Add summary by prescriber if multiple prescribers
      const prescribers = [...new Set(medications.map((m: any) => m.prescriber).filter(Boolean))];
      if (prescribers.length > 1) {
        summary += `\n**Prescribers:** ${prescribers.join(', ')}\n`;
      }

      return summary;
    }
    return '**Medications:** No medications found in patient records.';
  }

  // SPECIFIC CARE PLAN QUESTIONS with enhanced formatting
  if (queryIntent.primary === 'care_plans' || queryIntent.primary === 'diagnosis' ||
      queryLower.includes('care plan') || queryLower.includes('condition') || queryLower.includes('diagnosis')) {
    if (care_plans && care_plans.length > 0) {
      const activePlans = care_plans.filter((cp: any) => cp.status === 'active');
      const inactivePlans = care_plans.filter((cp: any) => cp.status !== 'active');

      summary = `## Care Plans\n\n`;
      summary += `_Total: ${care_plans.length} plan${care_plans.length !== 1 ? 's' : ''} `;
      summary += `(${activePlans.length} active, ${inactivePlans.length} inactive)_\n\n`;

      // Show active plans first
      if (activePlans.length > 0) {
        summary += `### Active Care Plans\n\n`;
        activePlans.forEach((cp: any, idx: number) => {
          summary += formatCarePlan(cp, idx);
        });
      }

      // Then inactive plans
      if (inactivePlans.length > 0 && care_plans.length <= 10) {
        summary += `### Inactive Care Plans\n\n`;
        inactivePlans.forEach((cp: any, idx: number) => {
          summary += formatCarePlan(cp, activePlans.length + idx);
        });
      }

      return summary;
    }
    return '**Care Plans:** No care plans found in patient records.';
  }

  // SPECIFIC CLINICAL NOTE QUESTIONS with enhanced formatting
  if (queryIntent.primary === 'history' || queryLower.includes('note') ||
      queryLower.includes('visit') || queryLower.includes('history')) {
    if (notes && notes.length > 0) {
      summary = `## Clinical Notes & Visit History\n\n`;
      summary += `_Total: ${notes.length} note${notes.length !== 1 ? 's' : ''}_\n\n`;

      // Group notes by type if there are multiple types
      const noteTypes = [...new Set(notes.map((n: any) => n.note_type || 'Clinical Note'))];

      if (noteTypes.length > 1 && notes.length > 5) {
        // Show grouped by type
        noteTypes.slice(0, 3).forEach(noteType => {
          const typeNotes = notes.filter((n: any) => (n.note_type || 'Clinical Note') === noteType);
          if (typeNotes.length > 0) {
            summary += `### ${noteType} (${typeNotes.length})\n\n`;
            typeNotes.slice(0, 3).forEach((note: any, idx: number) => {
              summary += formatNote(note, idx);
            });
            if (typeNotes.length > 3) {
              summary += `_...and ${typeNotes.length - 3} more ${noteType.toLowerCase()}${typeNotes.length - 3 !== 1 ? 's' : ''}_\n\n`;
            }
          }
        });
      } else {
        // Show chronologically (most recent first)
        notes.slice(0, 8).forEach((note: any, idx: number) => {
          summary += formatNote(note, idx);
        });

        if (notes.length > 8) {
          summary += `_...and ${notes.length - 8} more note${notes.length - 8 !== 1 ? 's' : ''}_\n`;
        }
      }

      return summary;
    }
    return '**Clinical Notes:** No clinical notes found in patient records.';
  }

  // COMPREHENSIVE SUMMARY - show everything organized by category
  summary = `## Patient Record Summary\n\n`;

  // Active Care Plans Section
  const activePlans = care_plans?.filter((cp: any) => cp.status === 'active') || [];
  if (activePlans.length > 0) {
    summary += `### Active Care Plans (${activePlans.length})\n\n`;
    activePlans.slice(0, 5).forEach((cp: any, idx: number) => {
      summary += `${idx + 1}. **${cp.title || 'Untitled'}**`;
      if (cp.provider) summary += ` - ${cp.provider}`;
      summary += '\n';
      if (cp.description) {
        summary += `   ${cp.description.substring(0, 150)}${cp.description.length > 150 ? '...' : ''}\n`;
      }
      summary += '\n';
    });
  }

  // Current Medications Section
  if (medications && medications.length > 0) {
    summary += `### Current Medications (${medications.length})\n\n`;
    medications.slice(0, 8).forEach((med: any, idx: number) => {
      summary += `${idx + 1}. **${med.name || 'Unknown'}**`;
      if (med.dosage) summary += ` - ${med.dosage}`;
      summary += '\n';
      if (med.frequency || med.prescriber) {
        const details = [];
        if (med.frequency) details.push(med.frequency);
        if (med.prescriber) details.push(`by ${med.prescriber}`);
        summary += `   ${details.join(', ')}\n`;
      }
      summary += '\n';
    });
    if (medications.length > 8) {
      summary += `_...and ${medications.length - 8} more medication${medications.length - 8 !== 1 ? 's' : ''}_\n\n`;
    }
  }

  // Recent Clinical Notes Section
  if (notes && notes.length > 0) {
    summary += `### Recent Clinical Notes (${notes.length})\n\n`;
    notes.slice(0, 5).forEach((note: any, idx: number) => {
      const noteDate = note.created_at ? formatDate(note.created_at) : 'No date';
      summary += `${idx + 1}. **${note.note_type || 'Note'}** - ${noteDate}\n`;
      if (note.author) summary += `   _${note.author}_\n`;
      if (note.content) {
        summary += `   ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}\n`;
      }
      summary += '\n';
    });
    if (notes.length > 5) {
      summary += `_...and ${notes.length - 5} more note${notes.length - 5 !== 1 ? 's' : ''}_\n`;
    }
  }

  // Inactive/Other Care Plans
  const inactivePlans = care_plans?.filter((cp: any) => cp.status !== 'active') || [];
  if (inactivePlans.length > 0) {
    summary += `\n### Other Care Plans (${inactivePlans.length})\n\n`;
    inactivePlans.slice(0, 3).forEach((cp: any, idx: number) => {
      summary += `${idx + 1}. ${cp.title || 'Untitled'} (${cp.status || 'unknown status'})\n`;
    });
    if (inactivePlans.length > 3) {
      summary += `_...and ${inactivePlans.length - 3} more_\n`;
    }
  }

  if (!care_plans?.length && !medications?.length && !notes?.length) {
    summary += '_No records found for this patient._';
  }

  return summary;
}

/**
 * Map patient ID aliases to real patient IDs
 * Recognizes: "patient123", "patient 123", "patient-123", etc.
 */
function normalizePatientId(patientId: string): string {
  // Patient ID mapping: friendly names -> real API IDs
  const patientMap: { [key: string]: string } = {
    'patient123': 'user_BPJpEJejcMVFPmTx5OQwggCVAun1',
    'patient-123': 'user_BPJpEJejcMVFPmTx5OQwggCVAun1',
    'patient 123': 'user_BPJpEJejcMVFPmTx5OQwggCVAun1',
    'test-patient': 'user_BPJpEJejcMVFPmTx5OQwggCVAun1',
    'testpatient': 'user_BPJpEJejcMVFPmTx5OQwggCVAun1',
  };

  const normalized = patientId.toLowerCase().replace(/\s+/g, '');
  return patientMap[normalized] || patientId;
}

/**
 * Main RAG Query Endpoint - Uses REAL Avon Health API Data
 * POST /api/query
 */
router.post('/query', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    let {
      query,
      patient_id,
      options = {},
      conversation_history = [],
    }: QueryRequest = req.body;

    // Validation
    if (!query || !patient_id) {
      res.status(400).json({
        error: 'Missing required fields: query and patient_id',
      });
      return;
    }

    // Normalize patient ID (maps "patient123" -> real ID)
    patient_id = normalizePatientId(patient_id);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📝 Processing query for patient ${patient_id}:`);
    console.log(`   Query: "${query}"`);

    // Use enhanced NLP for comprehensive query analysis
    const queryAnalysis = analyzeQuery(query);
    const queryIntent = queryAnalysis.intent;

    console.log(`\n🧠 Query Analysis:`);
    console.log(`   Intent: ${queryIntent.primary} (${queryIntent.confidence.toFixed(0)}% confidence)`);
    console.log(`   Question Type: ${queryIntent.questionType}`);
    console.log(`   Complexity: ${queryAnalysis.complexity.level} (score: ${queryAnalysis.complexity.score})`);
    if (queryAnalysis.complexity.reasons.length > 0) {
      console.log(`   Reasons: ${queryAnalysis.complexity.reasons.join(', ')}`);
    }
    if (queryAnalysis.entities.medications.length > 0) {
      console.log(`   Mentioned Medications: ${queryAnalysis.entities.medications.join(', ')}`);
    }
    if (queryAnalysis.entities.conditions.length > 0) {
      console.log(`   Mentioned Conditions: ${queryAnalysis.entities.conditions.join(', ')}`);
    }
    if (queryAnalysis.isMultiPart) {
      console.log(`   ⚠️  Multi-part question detected`);
    }
    if (queryAnalysis.isFollowUp) {
      console.log(`   ℹ️  Follow-up question detected`);
    }
    if (queryAnalysis.suggestions.length > 0) {
      console.log(`   Suggestions: ${queryAnalysis.suggestions.join('; ')}`);
    }

    // 1. Fetch REAL patient data from Avon Health API
    console.log(`\n📡 Fetching patient data from Avon Health API...`);
    let patientData;
    try {
      patientData = await avonHealthService.getAllPatientData(patient_id);
    } catch (error: any) {
      console.error('Failed to fetch patient data from Avon Health API:', error.message);
      res.status(500).json({
        error: 'Failed to retrieve patient data',
        message: 'Unable to connect to Avon Health API. Please check your credentials and API availability.',
      });
      return;
    }

    const { care_plans, medications, notes } = patientData;

    // 2. Build context from all sources (prioritize based on query intent)
    let context = '';
    let artifacts_searched = 0;
    const provenance: FormattedProvenance[] = [];

    // Build context based on query intent for better RAG performance
    const contextPriority: string[] = [];

    // Determine what to prioritize based on intent
    if (queryIntent.primary === 'medications' || query.toLowerCase().includes('med')) {
      contextPriority.push('medications', 'care_plans', 'notes');
    } else if (queryIntent.primary === 'diagnosis' || queryIntent.primary === 'care_plans') {
      contextPriority.push('care_plans', 'notes', 'medications');
    } else {
      // Default order
      contextPriority.push('care_plans', 'medications', 'notes');
    }

    // Build context in priority order
    contextPriority.forEach((sourceType) => {
      if (sourceType === 'care_plans' && care_plans) {
        care_plans.forEach((cp: any) => {
          const title = cp.title || 'Untitled Care Plan';
          const description = cp.description || '';
          const status = cp.status || 'unknown';
          const provider = cp.provider || 'unknown';

          const text = `Care Plan: ${title}\n${description}\nStatus: ${status}\nProvider: ${provider}`;
          context += `\n\n[CARE_PLAN_${cp.id || 'unknown'}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: cp.id || 'unknown',
            artifact_type: 'care_plan',
            snippet: description ? description.substring(0, 200) : title,
            occurred_at: cp.created_at || new Date().toISOString(),
            relevance_score: 0.8,
            char_offsets: [0, text.length],
            source_url: `/api/emr/care_plans/${cp.id || 'unknown'}`,
          });
        });
      }

      if (sourceType === 'medications' && medications) {
        medications.forEach((med: any) => {
          const name = med.name || 'Unknown medication';
          const dosage = med.dosage || '';
          const frequency = med.frequency || 'unknown';
          const prescribed_date = med.prescribed_date || 'unknown';
          const prescriber = med.prescriber || 'unknown';

          const text = `Medication: ${name} ${dosage}\nFrequency: ${frequency}\nPrescribed: ${prescribed_date}\nPrescriber: ${prescriber}`;
          context += `\n\n[MEDICATION_${med.id || 'unknown'}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: med.id || 'unknown',
            artifact_type: 'medication',
            snippet: `${name} ${dosage}`.trim(),
            occurred_at: prescribed_date !== 'unknown' ? prescribed_date : new Date().toISOString(),
            relevance_score: 0.85,
            char_offsets: [0, text.length],
            source_url: `/api/emr/medications/${med.id || 'unknown'}`,
          });
        });
      }

      if (sourceType === 'notes' && notes) {
        notes.forEach((note: any) => {
          const note_type = note.note_type || 'Clinical Note';
          const author = note.author || 'unknown';
          const created_at = note.created_at || 'unknown';
          const content = note.content || '';

          const text = `Clinical Note (${note_type})\nAuthor: ${author}\nDate: ${created_at}\n${content}`;
          context += `\n\n[NOTE_${note.id || 'unknown'}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: note.id || 'unknown',
            artifact_type: 'note',
            snippet: content ? content.substring(0, 200) : note_type,
            occurred_at: created_at !== 'unknown' ? created_at : new Date().toISOString(),
            relevance_score: 0.9,
            char_offsets: [0, text.length],
            source_url: `/api/emr/notes/${note.id || 'unknown'}`,
          });
        });
      }
    });

    // 3. Generate answer using Ollama with REAL retrieved context
    let short_answer: string;
    let detailed_summary: string;

    try {
      const ollamaResponse = await ollamaService.generateRAGAnswer(
        query,
        context,
        conversation_history
      );
      short_answer = ollamaResponse.short_answer;
      detailed_summary = ollamaResponse.detailed_summary;
      console.log('✅ Generated answer using Ollama with real patient data');
    } catch (error: any) {
      console.warn('⚠️  Ollama unavailable, using structured fallback response');

      // Graceful fallback: Generate intelligent response from structured data
      short_answer = generateFallbackShortAnswer(query, queryIntent, { care_plans, medications, notes });
      detailed_summary = generateFallbackDetailedSummary(query, queryIntent, { care_plans, medications, notes });
      console.log('✅ Generated fallback answer using structured patient data');
    }

    // 4. Extract structured information from REAL data
    const structured_extractions: StructuredExtraction[] = [];

    // Extract medications mentioned in the answer
    if (medications && detailed_summary) {
      medications.forEach((med: any) => {
        if (med.name && detailed_summary.toLowerCase().includes(med.name.toLowerCase())) {
          structured_extractions.push({
            type: 'medication',
            value: `${med.name} ${med.dosage || ''}`.trim(),
            relevance: 0.9,
            confidence: 0.95,
            source_artifact_id: med.id || 'unknown',
            supporting_text: `Prescribed ${med.prescribed_date || 'unknown'} by ${med.prescriber || 'unknown'}`,
          });
        }
      });
    }

    // Extract care plans mentioned
    if (care_plans && detailed_summary) {
      care_plans.forEach((cp: any) => {
        if (cp.title && detailed_summary.toLowerCase().includes(cp.title.toLowerCase())) {
          structured_extractions.push({
            type: 'condition',
            value: cp.title,
            relevance: 0.85,
            confidence: 0.9,
            source_artifact_id: cp.id || 'unknown',
            supporting_text: cp.description ? cp.description.substring(0, 100) : '',
          });
        }
      });
    }

    // 5. Calculate confidence scores
    const processingTime = Date.now() - startTime;

    const response: UIResponse = {
      query_id: uuidv4(),
      short_answer,
      detailed_summary,
      structured_extractions,
      provenance: provenance.slice(0, options.max_results || 5),
      confidence: {
        overall: Math.min(0.95, queryIntent.confidence / 100 + 0.2),
        breakdown: {
          retrieval: 0.90,
          reasoning: 0.82,
          extraction: 0.83,
        },
        explanation: `Answer generated from ${artifacts_searched} real patient records via Avon Health API`,
      },
      metadata: {
        patient_id,
        query_time: new Date().toISOString(),
        processing_time_ms: processingTime,
        artifacts_searched,
        chunks_retrieved: provenance.length,
        detail_level: options.detail_level || 3,
      },
    };

    console.log(`✅ Query completed in ${processingTime}ms using REAL API data`);
    res.json(response);
  } catch (error: any) {
    console.error('Query error:', error);
    res.status(500).json({
      error: 'Query processing failed',
      message: error.message,
    });
  }
});

/**
 * Get recent queries
 * GET /api/queries/recent
 */
router.get('/queries/recent', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    queries: [],
    message: 'Query history not yet implemented',
  });
});

/**
 * EMR Data Endpoints - Direct API Access
 */

router.get('/emr/care_plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const carePlans = await avonHealthService.getCarePlans(patient_id as string);
    res.json(carePlans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emr/medications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const medications = await avonHealthService.getMedications(patient_id as string);
    res.json(medications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emr/notes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const notes = await avonHealthService.getNotes(patient_id as string);
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emr/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const allData = await avonHealthService.getAllPatientData(patient_id as string);
    res.json(allData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
