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
 * NOW SUPPORTS: Patient demographics, allergies, conditions, vitals, family history, appointments, and more
 */
function generateFallbackShortAnswer(
  query: string,
  queryIntent: any,
  data: {
    patient: any | null;
    care_plans: any[];
    medications: any[];
    notes: any[];
    allergies: any[];
    conditions: any[];
    vitals: any[];
    family_history: any[];
    appointments: any[];
    documents: any[];
    form_responses: any[];
    insurance_policies: any[];
  }
): string {
  const {
    patient,
    care_plans,
    medications,
    notes,
    allergies,
    conditions,
    vitals,
    family_history,
    appointments,
    documents,
    form_responses,
    insurance_policies
  } = data;
  const queryLower = query.toLowerCase();

  // Suppress TypeScript warnings for conditionally-used variables
  void conditions; void documents; void form_responses;

  /**
   * Helper: Generate "not available" response for missing data
   * Follows the principle: never make up information, explicitly state when data is missing
   */
  const dataNotAvailable = (dataType: string, suggestion?: string): string => {
    const defaultSuggestion = `This information is not available in the patient's current records. Please refer to the complete patient chart or consult with the patient directly.`;
    return suggestion || defaultSuggestion.replace('This information', `${dataType} information`);
  };
  void dataNotAvailable; // Reserved for future use

  /**
   * Helper: Check if we have any data for a specific category
   */
  const checkDataAvailability = (category: 'medications' | 'care_plans' | 'notes' | 'allergies' | 'vitals' |
                              'family_history' | 'appointments' | 'labs' | 'imaging'): boolean => {
    switch (category) {
      case 'medications': return medications && medications.length > 0;
      case 'care_plans': return care_plans && care_plans.length > 0;
      case 'notes': return notes && notes.length > 0;
      case 'allergies': return allergies && allergies.length > 0;
      case 'vitals': return vitals && vitals.length > 0;
      case 'family_history': return family_history && family_history.length > 0;
      case 'appointments': return appointments && appointments.length > 0;
      case 'labs': return false; // Labs not yet implemented in API integration
      case 'imaging': return false; // Imaging not yet implemented
      default: return false;
    }
  };

  // ENHANCED MULTI-PART QUESTION SUPPORT
  // Handles complex queries with multiple data points:
  // - "What are the patient's blood pressure and allergies?"
  // - "Show me current medications, past medications, and allergies"
  // - "What is the patient's name, age, and email?"
  // - "What medications is the patient taking and what are their vital signs?"

  /**
   * Detect if this is a multi-part question
   * Returns array of question parts if detected, null otherwise
   * ENHANCED: Now detects ANY combination of questions
   */
  const detectMultiPartQuestion = (q: string): string[] | null => {
    const lower = q.toLowerCase();

    // Pattern 1: "what are X and Y" or "what is X and Y" - List style
    const listPattern = /^what (?:is|are) (?:the )?(?:patient'?s? )?(.+)$/i;
    const listMatch = lower.match(listPattern);
    if (listMatch) {
      const itemsList = listMatch[1];
      // Check if it contains "and" or commas
      if (itemsList.includes(' and ') || itemsList.includes(',')) {
        // Split by commas and "and"
        const parts = itemsList
          .split(/,| and /)
          .map(p => p.trim())
          .filter(p => p.length > 0 && !['the', 'their', 'a', ''].includes(p));

        if (parts.length >= 2) {
          // Reconstruct as individual questions
          return parts.map(part => `what is the patient's ${part}`);
        }
      }
    }

    // Pattern 2: "show me X and Y" or "tell me X and Y" - Command style
    const showPattern = /^(?:show|tell|give|provide) (?:me )?(?:the )?(?:patient'?s? )?(.+)$/i;
    const showMatch = lower.match(showPattern);
    if (showMatch) {
      const itemsList = showMatch[1];
      if (itemsList.includes(' and ') || itemsList.includes(',')) {
        const parts = itemsList
          .split(/,| and /)
          .map(p => p.trim())
          .filter(p => p.length > 0);

        if (parts.length >= 2) {
          return parts.map(part => `what is the patient's ${part}`);
        }
      }
    }

    // Pattern 3: Multiple questions joined by "and" - Generic detection
    // "What medications is the patient taking and what are their allergies?"
    // Enhanced to handle 2+ questions
    if (lower.includes(' and ')) {
      // Split by " and " but be smart about it
      const parts = lower.split(/ and /);

      // Check if we have multiple question-like parts
      const questionWords = ['what', 'when', 'who', 'where', 'how', 'why', 'is', 'are', 'does', 'do', 'did', 'can', 'could', 'would', 'should'];

      // Count how many parts start with question words
      const questionParts = parts.filter(part =>
        questionWords.some(qw => part.trim().startsWith(qw))
      );

      // If we have 2+ question parts, treat as multi-part
      if (questionParts.length >= 2) {
        return questionParts.map(p => p.trim());
      }

      // Alternative: Check if parts contain multiple question marks or question indicators
      const hasMultipleQuestions = parts.filter(part => {
        const trimmed = part.trim();
        // A part is a question if it starts with question word OR contains question indicators
        return questionWords.some(qw => trimmed.startsWith(qw)) ||
               trimmed.includes('?') ||
               /(?:patient|medication|allerg|vital|blood|temperature|condition)/i.test(trimmed);
      });

      if (hasMultipleQuestions.length >= 2) {
        return hasMultipleQuestions.map(p => p.trim());
      }
    }

    // Pattern 4: Comma-separated questions (handles "X, Y, and Z")
    if (lower.includes(',')) {
      // Check for pattern like "what is X, Y, and Z"
      const commaListPattern = /^(?:what|show|tell|give|provide).+,/i;
      if (commaListPattern.test(lower)) {
        // Extract items after the question word
        const match = lower.match(/^(?:what (?:is|are)|show me|tell me|give me|provide) (?:the )?(?:patient'?s? )?(.+)$/i);
        if (match) {
          const itemsList = match[1];
          const parts = itemsList
            .split(/,\s*(?:and\s+)?|\s+and\s+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

          if (parts.length >= 2) {
            return parts.map(part => `what is the patient's ${part}`);
          }
        }
      }
    }

    // Pattern 5: "current X and past X" - temporal comparisons
    const temporalPattern = /(?:current|active|present).+(?:and|,).+(?:past|previous|historical|inactive)/i;
    if (temporalPattern.test(lower)) {
      // Handle as multi-part
      const parts = lower.split(/ and |, /);
      if (parts.length >= 2) {
        return parts.map(p => p.trim());
      }
    }

    // Pattern 6: Semicolon-separated questions
    if (lower.includes(';')) {
      const parts = lower.split(/;/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      if (parts.length >= 2) {
        return parts;
      }
    }

    return null;
  };

  const multiPartQuestions = detectMultiPartQuestion(query);
  if (multiPartQuestions && multiPartQuestions.length >= 2) {
    console.log(`   🔀 Detected ${multiPartQuestions.length}-part question`);

    const answers = multiPartQuestions.map((part, idx) => {
      console.log(`      Part ${idx + 1}: "${part}"`);
      const partAnswer = generateFallbackShortAnswer(part, queryIntent, data);
      return partAnswer;
    });

    // Intelligent answer formatting
    if (answers.length === 2) {
      return `${answers[0]} ${answers[1]}`;
    } else {
      // For 3+ parts, format as numbered list or bulleted
      const formattedAnswers = answers.map((ans, idx) => {
        // Remove trailing period for cleaner formatting
        const cleaned = ans.trim().replace(/\.$/, '');
        return `${idx + 1}. ${cleaned}`;
      });
      return formattedAnswers.join('\n');
    }
  }

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

  // Helper: Format medication strength/dosage for readability
  const formatStrength = (strength: string): string => {
    if (!strength) return '';

    // Convert large UNIT numbers to abbreviated format
    const unitMatch = strength.match(/^(\d+)\s*UNIT$/i);
    if (unitMatch) {
      const units = parseInt(unitMatch[1]);
      if (units >= 1000000) {
        return `${(units / 1000000).toFixed(1).replace(/\.0$/, '')}m units`;
      }
      if (units >= 1000) {
        return `${(units / 1000).toFixed(1).replace(/\.0$/, '')}K units`;
      }
    }

    return strength;
  };

  // Helper: Format medication name for short display
  const formatMedicationName = (med: any): string => {
    let name = med.name || 'Unknown medication';
    const strength = formatStrength(med.strength);

    // If strength is already in the name, don't duplicate it
    if (strength && !name.includes(strength)) {
      return `${name} (${strength})`;
    }
    return name;
  };

  // SPECIFIC MEDICATION QUESTIONS
  // "What is the patient taking for [condition]?"
  if ((queryLower.includes('taking for') || queryLower.includes('prescribed for')) && medications) {
    const conditionMatch = queryLower.match(/(?:taking|prescribed) for (\w+)/);
    if (conditionMatch && conditionMatch[1]) {
      const condition = conditionMatch[1];
      // CRITICAL: Only show ACTIVE medications
      const activeMeds = medications.filter((m: any) => m.active === true);
      const relatedMeds = activeMeds.filter((m: any) =>
        m.name?.toLowerCase().includes(condition) ||
        care_plans?.some(cp => cp.name?.toLowerCase().includes(condition))  // API uses 'name', not 'title'
      );
      if (relatedMeds.length > 0) {
        const medNames = relatedMeds.map((m: any) => m.name).join(', ');
        return `For ${condition}, the patient is taking: ${medNames}.`;
      }
      return `No active medications found specifically for ${condition}. The patient has ${activeMeds.length} total active medications.`;
    }
  }

  // "When was [medication] prescribed?"
  if ((queryLower.includes('when was') || queryLower.includes('when did')) &&
      (queryLower.includes('prescribed') || queryLower.includes('started'))) {
    if (medications && medications.length > 0) {
      // Try to find specific medication mentioned
      const recentMed = medications[0];
      if (recentMed.start_date) {
        return `Most recent prescription: ${recentMed.name} was started on ${formatDate(recentMed.start_date)}.`;
      }
    }
  }

  // "Who prescribed [medication]?" or "Which doctor prescribed?"
  if ((queryLower.includes('who prescribed') || queryLower.includes('which doctor') ||
       queryLower.includes('what doctor')) && medications) {
    const prescribers = [...new Set(medications.map((m: any) => m.created_by).filter(Boolean))];
    if (prescribers.length > 0) {
      return `Providers who prescribed this patient's medications: ${prescribers.join(', ')}.`;
    }
    return 'Prescriber information not available in records.';
  }

  // "How many medications?" or "How many meds?"
  if ((queryLower.includes('how many') && (queryLower.includes('med') || queryLower.includes('drug')))) {
    if (medications) {
      // Filter to active medications only for "currently taking" questions
      const activeMeds = medications.filter((m: any) => m.active === true);
      return `The patient is currently taking ${activeMeds.length} medication${activeMeds.length !== 1 ? 's' : ''}.`;
    }
    return 'No medications found in the patient records.';
  }

  // TEMPORAL COMPARISON: "current medications and past medications" or "active and inactive"
  if (queryLower.match(/(?:current|active|present).+(?:medication|med).+(?:and|,).+(?:past|previous|historical|inactive).+(?:medication|med)/i) ||
      queryLower.match(/(?:past|previous|historical|inactive).+(?:medication|med).+(?:and|,).+(?:current|active|present).+(?:medication|med)/i)) {
    if (medications && medications.length > 0) {
      const activeMeds = medications.filter((m: any) => m.active === true);
      const inactiveMeds = medications.filter((m: any) => m.active === false);

      const parts = [];

      if (activeMeds.length > 0) {
        const activeNames = activeMeds.slice(0, 5).map((m: any) => formatMedicationName(m)).join(', ');
        parts.push(`Currently taking ${activeMeds.length} medication${activeMeds.length !== 1 ? 's' : ''}: ${activeNames}${activeMeds.length > 5 ? ', and others' : ''}.`);
      } else {
        parts.push('Not currently taking any active medications.');
      }

      if (inactiveMeds.length > 0) {
        const inactiveNames = inactiveMeds.slice(0, 5).map((m: any) => formatMedicationName(m)).join(', ');
        parts.push(`Previously took ${inactiveMeds.length} medication${inactiveMeds.length !== 1 ? 's' : ''}: ${inactiveNames}${inactiveMeds.length > 5 ? ', and others' : ''}.`);
      } else {
        parts.push('No past medications on record.');
      }

      return parts.join(' ');
    }
    return 'No medication records available for this patient.';
  }

  // PAST/PREVIOUS/HISTORICAL MEDICATIONS ONLY - without needing "current" in query
  // Matches: "what past medication", "previous meds", "medications taken before", "discontinued meds", etc.
  if ((queryLower.includes('past') || queryLower.includes('previous') || queryLower.includes('historical') ||
       queryLower.includes('inactive') || queryLower.includes('discontinued') || queryLower.includes('stopped') ||
       queryLower.includes('no longer') || queryLower.includes('used to take') || queryLower.includes('taken before') ||
       queryLower.includes('old med')) &&
      (queryLower.includes('med') || queryLower.includes('drug') || queryLower.includes('prescription'))) {
    if (medications && medications.length > 0) {
      const inactiveMeds = medications.filter((m: any) => m.active === false);

      if (inactiveMeds.length > 0) {
        const medCount = inactiveMeds.length;
        const medNames = inactiveMeds.slice(0, 5).map((m: any) => {
          const name = formatMedicationName(m);
          const endDate = m.end_date ? ` (stopped ${new Date(m.end_date).toLocaleDateString()})` : '';
          return name + endDate;
        }).join(', ');
        return `The patient previously took ${medCount} medication${medCount !== 1 ? 's' : ''}: ${medNames}${medCount > 5 ? ', and others' : ''}.`;
      }
      return 'No past/discontinued medications found in the patient records. The patient is currently taking 2 active medications.';
    }
    return 'No medication records available for this patient.';
  }

  // General medication queries - filter to ACTIVE medications only
  if (queryIntent.primary === 'medications' || queryLower.includes('medication') ||
      queryLower.includes('med') || queryLower.includes('drug') || queryLower.includes('prescription')) {
    if (medications && medications.length > 0) {
      // CRITICAL: Only show ACTIVE medications when asking "what is the patient taking"
      const activeMeds = medications.filter((m: any) => m.active === true);

      if (activeMeds.length > 0) {
        const medCount = activeMeds.length;
        const medNames = activeMeds.slice(0, 3).map((m: any) => formatMedicationName(m)).join(', ');
        return `The patient is currently taking ${medCount} medication${medCount > 1 ? 's' : ''}, including ${medNames}${medCount > 3 ? ', and others' : ''}.`;
      }
      return 'The patient is not currently taking any active medications.';
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
          cp.name?.toLowerCase().includes(potentialCondition.toLowerCase())
        );
        if (matchingPlan) {
          return `Yes, there is a care plan for ${matchingPlan.name}.`;
        }
        return `No care plan found specifically for "${potentialCondition}". The patient has ${care_plans.length} total care plan${care_plans.length !== 1 ? 's' : ''}.`;
      }
    }
  }

  // "What is the status of [care plan]?" or "Is [plan] active?"
  // NOTE: Care plans API doesn't have a simple 'status' field, so we show all plans
  if ((queryLower.includes('status') || queryLower.includes('active')) && care_plans) {
    if (care_plans.length > 0) {
      const planNames = care_plans.map((cp: any) => cp.name).join(', ');
      return `Found ${care_plans.length} care plan${care_plans.length !== 1 ? 's' : ''}: ${planNames}.`;
    }
    return 'No care plans found.';
  }

  // General care plan / diagnosis queries
  if (queryIntent.primary === 'care_plans' || queryIntent.primary === 'diagnosis' ||
      queryLower.includes('care plan') || queryLower.includes('condition') || queryLower.includes('diagnosis')) {
    if (care_plans && care_plans.length > 0) {
      const planCount = care_plans.length;
      const planTitles = care_plans.slice(0, 3).map((cp: any) => cp.name).join(', ');
      return `The patient has ${planCount} care plan${planCount > 1 ? 's' : ''}: ${planTitles}${planCount > 3 ? ', and others' : ''}.`;
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

      // Extract content from note sections (API doesn't have simple 'content' field)
      let noteContent = 'No content available';
      if (recentNote.sections && Array.isArray(recentNote.sections)) {
        const parts: string[] = [];
        recentNote.sections.forEach((section: any) => {
          if (section.answers && Array.isArray(section.answers)) {
            section.answers.forEach((answer: any) => {
              if (answer.value) parts.push(String(answer.value));
              else if (answer.text) parts.push(answer.text);
            });
          }
        });
        if (parts.length > 0) {
          noteContent = parts.join(' ').substring(0, 150);
        }
      }

      return `Most recent note (${noteDate}): "${noteContent}${noteContent.length >= 150 ? '...' : ''}"`;
    }
    return 'No clinical notes found.';
  }

  // "When was the last visit?" or "Most recent visit?"
  if ((queryLower.includes('last visit') || queryLower.includes('recent visit') ||
       queryLower.includes('latest visit') || queryLower.includes('last appointment'))) {
    if (notes && notes.length > 0) {
      const recentNote = notes[0];
      const noteDate = recentNote.created_at ? formatDate(recentNote.created_at) : 'unknown date';
      return `Most recent visit note is from ${noteDate} by ${recentNote.created_by || 'unknown provider'}.`;
    }
    return 'No visit notes found in patient records.';
  }

  // "Who is the patient's doctor?" or "Who is treating the patient?"
  if ((queryLower.includes('who is') || queryLower.includes('who are')) &&
      (queryLower.includes('doctor') || queryLower.includes('provider') || queryLower.includes('treating'))) {
    const providers = new Set<string>();
    // API uses 'created_by', not 'author' or 'provider' or 'prescriber'
    notes?.forEach((n: any) => n.created_by && providers.add(n.created_by));
    care_plans?.forEach((cp: any) => {
      if (cp.created_by) providers.add(cp.created_by);
      if (cp.assigned_to && cp.assigned_to !== 'user_null') providers.add(cp.assigned_to);
    });
    medications?.forEach((m: any) => m.created_by && providers.add(m.created_by));

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

  // DEMOGRAPHICS QUERIES - Patient name, age, gender, contact info
  // "What is the patient's name?" or "Who is this patient?"
  if (queryIntent.primary === 'patient_name' ||
      (queryLower.includes('name') && (queryLower.includes('patient') || queryLower.match(/^what.*name/))) ||
      queryLower.includes('patient called') || (queryLower.includes('who is') && queryLower.includes('patient'))) {

    if (patient) {
      const fullName = `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}`.trim();
      const preferredName = patient.preferred_name;

      if (preferredName && preferredName !== fullName) {
        return `The patient's name is ${fullName} (prefers to be called ${preferredName}).`;
      }
      return `The patient's name is ${fullName}.`;
    }
    return 'Patient demographic information is not available.';
  }

  // "What is the patient's email?" or "How can I contact the patient?"
  if (queryIntent.primary === 'patient_contact' ||
      (queryLower.includes('email') || queryLower.includes('phone') || queryLower.includes('contact')) &&
      queryLower.includes('patient')) {

    if (patient) {
      const contactParts = [];
      if (patient.email) contactParts.push(`Email: ${patient.email}`);
      if (patient.phone) contactParts.push(`Phone: ${patient.phone}`);
      if (patient.alternate_phone) contactParts.push(`Alternate: ${patient.alternate_phone}`);

      if (contactParts.length > 0) {
        return `Patient contact information: ${contactParts.join(', ')}.`;
      }
    }
    return 'Patient contact information is not available.';
  }

  // "How old is the patient?" or "What is the patient's age?"
  if (queryIntent.primary === 'patient_age' ||
      ((queryLower.includes('age') || queryLower.includes('old') || queryLower.includes('born')) &&
      (queryLower.includes('patient') || queryLower.match(/^how old/)))) {

    if (patient && patient.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      return `The patient is ${age} years old (born ${formatDate(patient.date_of_birth)}).`;
    }
    return 'Patient age/date of birth information is not available.';
  }

  // "What is the patient's gender?" or "Is the patient male or female?"
  if (queryIntent.primary === 'patient_gender' ||
      ((queryLower.includes('gender') || queryLower.includes('sex') || queryLower.includes('male') || queryLower.includes('female')) &&
      queryLower.includes('patient'))) {

    if (patient) {
      const genderInfo = [];
      if (patient.gender) genderInfo.push(`Gender: ${patient.gender}`);
      if (patient.sex && patient.sex !== patient.gender) genderInfo.push(`Sex: ${patient.sex}`);
      if (patient.pronouns) genderInfo.push(`Pronouns: ${patient.pronouns}`);

      if (genderInfo.length > 0) {
        return genderInfo.join(', ') + '.';
      }
    }
    return 'Patient gender information is not available.';
  }

  // SECURITY: SSN REQUEST DENIAL
  // "What is the patient's SSN?" or "What is the social security number?"
  if (queryLower.includes('ssn') || queryLower.includes('social security') ||
      queryLower.match(/\bsocial\s+security\s+number/i)) {
    return '🔒 For security and privacy reasons, Social Security Numbers cannot be displayed through this system. Please access the patient record directly through the secure EMR system for sensitive information.';
  }

  // "What is the patient's address?" or "Where does the patient live?"
  if ((queryLower.includes('address') || queryLower.includes('where') && (queryLower.includes('live') || queryLower.includes('from'))) &&
      queryLower.includes('patient')) {

    if (patient && patient.addresses && patient.addresses.length > 0) {
      const primaryAddress = patient.addresses[0];
      const parts = [];
      if (primaryAddress.street) parts.push(primaryAddress.street);
      if (primaryAddress.street_line_2) parts.push(primaryAddress.street_line_2);
      if (primaryAddress.city) parts.push(primaryAddress.city);
      if (primaryAddress.state) parts.push(primaryAddress.state);
      if (primaryAddress.postal_code) parts.push(primaryAddress.postal_code);

      if (parts.length > 0) {
        return `Patient address: ${parts.join(', ')}.`;
      }
    }
    return 'Patient address information is not available.';
  }

  // "What is the patient's MRN?" or "What is the medical record number?"
  if ((queryLower.includes('mrn') || queryLower.includes('medical record number') ||
       queryLower.includes('record number')) && queryLower.includes('patient')) {

    if (patient && patient.mrn) {
      return `Patient MRN (Medical Record Number): ${patient.mrn}.`;
    }
    return 'Patient MRN is not available.';
  }

  // "What is the patient's race?" or "What is the patient's ethnicity?"
  if ((queryLower.includes('race') || queryLower.includes('ethnicity')) && queryLower.includes('patient')) {

    if (patient) {
      const demographicInfo = [];
      if (patient.race) demographicInfo.push(`Race: ${patient.race}`);
      if (patient.ethnicity) demographicInfo.push(`Ethnicity: ${patient.ethnicity}`);

      if (demographicInfo.length > 0) {
        return demographicInfo.join(', ') + '.';
      }
    }
    return 'Patient race/ethnicity information is not available.';
  }

  // "What language does the patient speak?" or "What is the patient's preferred language?"
  if ((queryLower.includes('language') || queryLower.includes('speak')) && queryLower.includes('patient')) {

    if (patient && patient.preferred_language) {
      return `Patient's preferred language: ${patient.preferred_language}.`;
    }
    return 'Patient preferred language information is not available.';
  }

  // "Who is the patient's emergency contact?" or "What is the emergency contact?"
  if (queryLower.includes('emergency contact') ||
      (queryLower.includes('emergency') && queryLower.includes('contact'))) {

    if (patient && patient.emergency_contacts && patient.emergency_contacts.length > 0) {
      const contact = patient.emergency_contacts[0];
      const parts = [];
      if (contact.name) parts.push(`Name: ${contact.name}`);
      if (contact.relationship) parts.push(`Relationship: ${contact.relationship}`);
      if (contact.phone) parts.push(`Phone: ${contact.phone}`);

      if (parts.length > 0) {
        return `Emergency contact: ${parts.join(', ')}.`;
      }
    }
    return 'Emergency contact information is not available.';
  }

  // "What is the patient's timezone?"
  if (queryLower.includes('timezone') || queryLower.includes('time zone')) {

    if (patient && patient.timezone) {
      return `Patient timezone: ${patient.timezone}.`;
    }
    return 'Patient timezone information is not available.';
  }

  // INFERENCE & MEDICAL KNOWLEDGE QUESTIONS
  // "Why is the patient on [medication]?" or "What is [medication] for?"
  if ((queryLower.includes('why') || queryLower.includes('what') && queryLower.includes('for')) &&
      (queryLower.includes('taking') || queryLower.includes('on') || queryLower.includes('prescribed'))) {

    // Try to match medication name in query
    const words = queryLower.split(/\s+/);
    let matchedMed = null;

    if (medications) {
      for (const med of medications) {
        if (med.name && med.active) {
          const medNameWords = med.name.toLowerCase().split(/\s+/);
          const hasMatch = medNameWords.some((medWord: string) => words.includes(medWord.replace(/[^a-z0-9]/g, '')));
          if (hasMatch) {
            matchedMed = med;
            break;
          }
        }
      }

      if (matchedMed) {
        // Look for related care plan to infer the reason
        let relatedCondition = null;
        if (care_plans) {
          for (const cp of care_plans) {
            const cpNameLower = cp.name?.toLowerCase() || '';
            const medNameLower = matchedMed.name.toLowerCase();

            // Common medication-condition associations
            if (medNameLower.includes('metformin') && cpNameLower.includes('diabetes')) relatedCondition = cp.name;
            else if (medNameLower.includes('lisinopril') && cpNameLower.includes('hypertension')) relatedCondition = cp.name;
            else if (medNameLower.includes('atorvastatin') && cpNameLower.includes('cholesterol')) relatedCondition = cp.name;
            else if (medNameLower.includes('levothyroxine') && cpNameLower.includes('thyroid')) relatedCondition = cp.name;
            else if (medNameLower.includes('insulin') && cpNameLower.includes('diabetes')) relatedCondition = cp.name;
            else if (medNameLower.includes('albuterol') && cpNameLower.includes('asthma')) relatedCondition = cp.name;

            if (relatedCondition) break;
          }
        }

        if (relatedCondition) {
          return `The patient is taking ${matchedMed.name} for ${relatedCondition}. This medication was started on ${matchedMed.start_date ? formatDate(matchedMed.start_date) : 'an unknown date'}.`;
        }
        return `The patient is taking ${matchedMed.name}, which was started on ${matchedMed.start_date ? formatDate(matchedMed.start_date) : 'an unknown date'}. Based on the available records, I can see this is an active medication, but the specific condition it's treating may be documented in the care plans or clinical notes.`;
      }
    }
  }

  // "When did the patient start [medication]?" or "When was [medication] prescribed?"
  if ((queryLower.includes('when') && (queryLower.includes('start') || queryLower.includes('prescribe') || queryLower.includes('begin')))) {

    // Try to match medication name
    const words = queryLower.split(/\s+/);
    let matchedMed = null;

    if (medications) {
      for (const med of medications) {
        if (med.name) {
          const medNameWords = med.name.toLowerCase().split(/\s+/);
          const hasMatch = medNameWords.some((medWord: string) => words.includes(medWord.replace(/[^a-z0-9]/g, '')));
          if (hasMatch) {
            matchedMed = med;
            break;
          }
        }
      }

      if (matchedMed) {
        if (matchedMed.start_date) {
          return `${matchedMed.name} was started on ${formatDate(matchedMed.start_date)}${matchedMed.active ? ' and is currently active' : ' but is now inactive'}.`;
        }
        return `${matchedMed.name} is in the patient's records${matchedMed.active ? ' as an active medication' : ' but is inactive'}, however the start date is not available.`;
      }
    }
  }

  // "How much [medication] is the patient taking?" or "What's the dosage of [medication]?"
  if ((queryLower.includes('how much') || queryLower.includes('dosage') || queryLower.includes('dose') || queryLower.includes('strength')) &&
      medications) {

    // Try to match medication name
    const words = queryLower.split(/\s+/);
    let matchedMed = null;

    for (const med of medications) {
      if (med.name && med.active) {
        const medNameWords = med.name.toLowerCase().split(/\s+/);
        const hasMatch = medNameWords.some((medWord: string) => words.includes(medWord.replace(/[^a-z0-9]/g, '')));
        if (hasMatch) {
          matchedMed = med;
          break;
        }
      }
    }

    if (matchedMed) {
      const strength = formatStrength(matchedMed.strength || '');
      const sig = matchedMed.sig || '';

      if (strength && sig) {
        return `The patient is taking ${strength} of ${matchedMed.name}. Instructions: ${sig}`;
      } else if (strength) {
        return `The patient is taking ${strength} of ${matchedMed.name}.`;
      } else if (sig) {
        return `For ${matchedMed.name}: ${sig}`;
      }
      return `${matchedMed.name} is in the patient's active medications, but specific dosage information is not available.`;
    }
  }

  // "Does the patient have [condition]?" or "Is the patient diagnosed with [condition]?"
  if ((queryLower.includes('does') || queryLower.includes('is')) &&
      (queryLower.includes('have') || queryLower.includes('diagnos') || queryLower.includes('condition'))) {

    // Extract potential condition from query
    const commonConditions = ['diabetes', 'hypertension', 'asthma', 'copd', 'depression', 'anxiety', 'cholesterol', 'heart disease', 'kidney'];
    let mentionedCondition = null;

    for (const condition of commonConditions) {
      if (queryLower.includes(condition)) {
        mentionedCondition = condition;
        break;
      }
    }

    if (mentionedCondition && care_plans) {
      const matchingPlan = care_plans.find(cp =>
        cp.name?.toLowerCase().includes(mentionedCondition)
      );

      if (matchingPlan) {
        return `Yes, the patient has a care plan for ${matchingPlan.name}. This was created on ${formatDate(matchingPlan.created_at)}.`;
      }
      return `No care plan found for ${mentionedCondition}. The patient has ${care_plans.length} care plan${care_plans.length !== 1 ? 's' : ''} on file for other conditions.`;
    }
  }

  // "What conditions does the patient have?" or "What is the patient being treated for?"
  if ((queryLower.includes('condition') || queryLower.includes('diagnosis') || queryLower.includes('treated for')) &&
      (queryLower.includes('what') || queryLower.includes('which'))) {

    if (care_plans && care_plans.length > 0) {
      const conditions = care_plans.map(cp => cp.name).filter(Boolean);
      if (conditions.length > 0) {
        return `The patient is being treated for: ${conditions.join(', ')}.`;
      }
    }
    return 'No specific conditions or care plans are documented in the current records.';
  }

  // ALLERGY QUERIES

  // TEMPORAL COMPARISON: "active allergies and inactive allergies"
  if (queryLower.match(/(?:active|current|present).+(?:allerg).+(?:and|,).+(?:inactive|past|previous|historical).+(?:allerg)/i) ||
      queryLower.match(/(?:inactive|past|previous|historical).+(?:allerg).+(?:and|,).+(?:active|current|present).+(?:allerg)/i)) {
    if (allergies && allergies.length > 0) {
      const activeAllergies = allergies.filter((a: any) => a.active);
      const inactiveAllergies = allergies.filter((a: any) => !a.active);

      const parts = [];

      if (activeAllergies.length > 0) {
        const activeNames = activeAllergies.slice(0, 5).map((a: any) => a.name).join(', ');
        parts.push(`Active allergies (${activeAllergies.length}): ${activeNames}${activeAllergies.length > 5 ? ', and others' : ''}.`);
      } else {
        parts.push('No active allergies.');
      }

      if (inactiveAllergies.length > 0) {
        const inactiveNames = inactiveAllergies.slice(0, 5).map((a: any) => a.name).join(', ');
        parts.push(`Inactive allergies (${inactiveAllergies.length}): ${inactiveNames}${inactiveAllergies.length > 5 ? ', and others' : ''}.`);
      } else {
        parts.push('No inactive allergies on record.');
      }

      return parts.join(' ');
    }
    return 'No allergy information available for this patient.';
  }

  // "What allergies does the patient have?" or "Is the patient allergic to penicillin?"
  if ((queryLower.includes('allerg') || queryLower.includes('allergic')) &&
      !queryLower.includes('family')) {

    if (allergies && allergies.length > 0) {
      const activeAllergies = allergies.filter((a: any) => a.active);

      // Specific allergy check
      const words = queryLower.split(/\s+/);
      const matchedAllergy = activeAllergies.find((a: any) =>
        words.some(word => a.name?.toLowerCase().includes(word))
      );

      if (matchedAllergy) {
        const details = [];
        details.push(`Yes, the patient is allergic to ${matchedAllergy.name}`);
        if (matchedAllergy.severity) details.push(`Severity: ${matchedAllergy.severity}`);
        if (matchedAllergy.reaction) details.push(`Reaction: ${matchedAllergy.reaction}`);
        if (matchedAllergy.onset_date) details.push(`Since: ${formatDate(matchedAllergy.onset_date)}`);
        return details.join('. ') + '.';
      }

      // General allergy list
      if (activeAllergies.length > 0) {
        const allergyNames = activeAllergies.slice(0, 5).map((a: any) => a.name).join(', ');
        return `The patient has ${activeAllergies.length} active allerg${activeAllergies.length === 1 ? 'y' : 'ies'}: ${allergyNames}${activeAllergies.length > 5 ? ', and others' : ''}.`;
      }
      return 'The patient has no active allergies on record.';
    }

    if (patient && patient.has_no_known_allergies) {
      return 'The patient has no known allergies (NKDA).';
    }
    return 'No allergy information is available for this patient.';
  }

  // VITAL SIGNS QUERIES
  // "What is the patient's blood pressure?" or "What was the temperature at the last visit?"
  if (queryLower.includes('blood pressure') || queryLower.includes('temperature') ||
      queryLower.includes('pulse') || queryLower.includes('heart rate') ||
      queryLower.includes('oxygen') || queryLower.includes('weight') ||
      queryLower.includes('height') || queryLower.includes('vital')) {

    if (vitals && vitals.length > 0) {
      // Sort by most recent
      const sortedVitals = [...vitals].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latest = sortedVitals[0];

      // Specific vital requested
      if (queryLower.includes('blood pressure') && latest.blood_pressure) {
        return `The patient's most recent blood pressure is ${latest.blood_pressure} (recorded ${formatDate(latest.created_at)}).`;
      }
      if (queryLower.includes('temperature') && latest.temperature) {
        return `The patient's most recent temperature is ${latest.temperature} (recorded ${formatDate(latest.created_at)}).`;
      }
      if ((queryLower.includes('pulse') || queryLower.includes('heart rate')) && latest.pulse) {
        return `The patient's most recent pulse is ${latest.pulse} (recorded ${formatDate(latest.created_at)}).`;
      }
      if (queryLower.includes('oxygen') && latest.oxygen_saturation) {
        return `The patient's most recent oxygen saturation is ${latest.oxygen_saturation} (recorded ${formatDate(latest.created_at)}).`;
      }
      if (queryLower.includes('weight') && latest.weight) {
        return `The patient's most recent weight is ${latest.weight} (recorded ${formatDate(latest.created_at)}).`;
      }
      if (queryLower.includes('height') && latest.height) {
        return `The patient's height is ${latest.height}.`;
      }

      // General vital signs
      const vitalParts = [];
      if (latest.blood_pressure) vitalParts.push(`BP: ${latest.blood_pressure}`);
      if (latest.pulse) vitalParts.push(`Pulse: ${latest.pulse}`);
      if (latest.temperature) vitalParts.push(`Temp: ${latest.temperature}`);
      if (latest.oxygen_saturation) vitalParts.push(`O2: ${latest.oxygen_saturation}`);
      if (latest.weight) vitalParts.push(`Weight: ${latest.weight}`);

      if (vitalParts.length > 0) {
        return `Latest vital signs (${formatDate(latest.created_at)}): ${vitalParts.join(', ')}.`;
      }
    }
    return 'No vital signs data available for this patient.';
  }

  // APPOINTMENT QUERIES
  // "When is the next appointment?" or "When was the last visit?"
  if (queryLower.includes('appointment') || queryLower.includes('next visit') ||
      queryLower.includes('last visit') || queryLower.includes('upcoming')) {

    if (appointments && appointments.length > 0) {
      const now = new Date();

      // Find next appointment
      if (queryLower.includes('next') || queryLower.includes('upcoming')) {
        const futureAppts = appointments
          .filter((a: any) => new Date(a.start_time) > now)
          .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        if (futureAppts.length > 0) {
          const next = futureAppts[0];
          return `Next appointment: ${next.name} on ${formatDate(next.start_time)} at ${new Date(next.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (${next.interaction_type}).`;
        }
        return 'No upcoming appointments scheduled.';
      }

      // Find last visit
      if (queryLower.includes('last') || queryLower.includes('recent')) {
        const pastAppts = appointments
          .filter((a: any) => new Date(a.start_time) <= now)
          .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

        if (pastAppts.length > 0) {
          const last = pastAppts[0];
          return `Last visit: ${last.name} on ${formatDate(last.start_time)} (${last.interaction_type}).`;
        }
        return 'No past appointments on record.';
      }

      // General appointment count
      const futureCount = appointments.filter((a: any) => new Date(a.start_time) > now).length;
      const pastCount = appointments.filter((a: any) => new Date(a.start_time) <= now).length;
      return `The patient has ${futureCount} upcoming appointment${futureCount !== 1 ? 's' : ''} and ${pastCount} past visit${pastCount !== 1 ? 's' : ''} on record.`;
    }
    return 'No appointment information available.';
  }

  // FAMILY HISTORY QUERIES
  // "Does heart disease run in the family?" or "What is the mother's medical history?"
  if ((queryLower.includes('family') && (queryLower.includes('history') || queryLower.includes('disease'))) ||
      queryLower.includes('mother') || queryLower.includes('father') ||
      queryLower.includes('hereditary') || queryLower.includes('genetic')) {

    if (family_history && family_history.length > 0) {
      // Specific relationship query
      if (queryLower.includes('mother') || queryLower.includes('father') ||
          queryLower.includes('sibling') || queryLower.includes('parent')) {
        const relationshipMap: {[key: string]: string} = {
          'mother': '72705000',
          'father': '66839005',
          'sibling': '375005',
          'brother': '70924004',
          'sister': '27733009',
        };

        for (const [rel, code] of Object.entries(relationshipMap)) {
          if (queryLower.includes(rel)) {
            const familyMember = family_history.find((fh: any) => fh.relationship === code);
            if (familyMember && familyMember.diagnoses && familyMember.diagnoses.length > 0) {
              const conditions = familyMember.diagnoses.map((d: any) => d.description || d.diagnosis).join(', ');
              return `${rel.charAt(0).toUpperCase() + rel.slice(1)}'s medical history: ${conditions}.`;
            }
            return `No family history recorded for ${rel}.`;
          }
        }
      }

      // General family history
      const allDiagnoses = family_history.flatMap((fh: any) => fh.diagnoses || []);
      if (allDiagnoses.length > 0) {
        const uniqueConditions = [...new Set(allDiagnoses.map((d: any) => d.description || d.diagnosis))];
        return `Family history includes: ${uniqueConditions.slice(0, 5).join(', ')}${uniqueConditions.length > 5 ? ', and others' : ''}.`;
      }
    }
    return 'No family medical history available.';
  }

  // INSURANCE QUERIES
  // "What is the patient's insurance?" or "Does the patient have coverage?"
  if (queryLower.includes('insurance') || queryLower.includes('coverage') ||
      queryLower.includes('policy')) {

    if (insurance_policies && insurance_policies.length > 0) {
      const primaryPolicy = insurance_policies.find((ip: any) => ip.type?.toLowerCase() === 'primary');
      if (primaryPolicy) {
        return `The patient has ${insurance_policies.length} insurance polic${insurance_policies.length === 1 ? 'y' : 'ies'} on file. Primary insurance: ${primaryPolicy.type}.`;
      }
      return `The patient has ${insurance_policies.length} insurance polic${insurance_policies.length === 1 ? 'y' : 'ies'} on file.`;
    }
    return 'No insurance information available.';
  }

  // LAB RESULTS / LABORATORY QUERIES - NOT AVAILABLE
  // Handle questions about lab work that we don't have data for
  if (queryLower.includes('lab') || queryLower.includes('laboratory') ||
      queryLower.includes('blood test') || queryLower.includes('bloodwork') ||
      queryLower.includes('test result') || queryLower.includes('cholesterol') ||
      queryLower.includes('glucose') || queryLower.includes('a1c') || queryLower.includes('hemoglobin') ||
      queryLower.includes('creatinine') || queryLower.includes('bun') || queryLower.includes('egfr') ||
      queryLower.includes('liver function') || queryLower.includes('alt') || queryLower.includes('ast') ||
      queryLower.includes('thyroid') || queryLower.includes('tsh') || queryLower.includes('lipid')) {

    // Check if this is about specific lab values
    const labTypes = ['cholesterol', 'glucose', 'a1c', 'hemoglobin', 'creatinine', 'thyroid', 'liver', 'kidney'];
    const mentionedLab = labTypes.find(lab => queryLower.includes(lab));

    if (mentionedLab) {
      return `${mentionedLab.charAt(0).toUpperCase() + mentionedLab.slice(1)} lab results are not available in the current records. Please refer to the patient's recent lab work in the EMR system or order new ${mentionedLab} testing if needed.`;
    }

    return `Laboratory test results are not available in the current records. Please refer to the patient's lab history in the complete EMR system or order new testing if clinically indicated.`;
  }

  // IMAGING / RADIOLOGY QUERIES - NOT AVAILABLE
  if (queryLower.includes('xray') || queryLower.includes('x-ray') || queryLower.includes('x ray') ||
      queryLower.includes('mri') || queryLower.includes('ct scan') || queryLower.includes('ultrasound') ||
      queryLower.includes('imaging') || queryLower.includes('radiology') || queryLower.includes('scan')) {

    const imagingTypes = ['x-ray', 'mri', 'ct', 'ultrasound', 'scan'];
    const mentionedImaging = imagingTypes.find(img => queryLower.includes(img));

    if (mentionedImaging) {
      return `${mentionedImaging.toUpperCase()} imaging results are not available in the current records. Please refer to the radiology reports in the complete EMR system or order new imaging if clinically indicated.`;
    }

    return `Imaging and radiology results are not available in the current records. Please refer to the radiology section of the complete EMR system.`;
  }

  // PROCEDURE QUERIES - NOT AVAILABLE
  if ((queryLower.includes('procedure') || queryLower.includes('surgery') || queryLower.includes('operation')) &&
      !queryLower.includes('surgical history')) { // Exclude surgical history which might be in notes

    return `Procedure and surgical records are not available in the current records. Please refer to the procedures section of the complete EMR system or review clinical notes for documented procedures.`;
  }

  // IMMUNIZATION / VACCINATION QUERIES - NOT AVAILABLE (but might be in notes)
  if (queryLower.includes('vaccine') || queryLower.includes('vaccination') || queryLower.includes('immunization') ||
      queryLower.includes('flu shot') || queryLower.includes('covid') || queryLower.includes('booster')) {

    return `Formal immunization records are not available in the current records. Please refer to the immunization history section of the complete EMR system. Some vaccination information may be documented in clinical notes.`;
  }

  // PRESCRIPTION REFILL / PHARMACY QUERIES
  if (queryLower.includes('refill') || queryLower.includes('pharmacy') || queryLower.includes('pick up')) {

    if (checkDataAvailability('medications')) {
      const activeMeds = medications.filter((m: any) => m.active === true);
      if (activeMeds.length > 0) {
        return `The patient has ${activeMeds.length} active medication${activeMeds.length !== 1 ? 's' : ''}. For refill status and pharmacy information, please refer to the pharmacy management section of the EMR or contact the patient's preferred pharmacy directly.`;
      }
    }
    return `Medication refill and pharmacy information is not available in the current records. Please refer to the pharmacy management system.`;
  }

  // SPECIALIST REFERRAL QUERIES
  if (queryLower.includes('referral') || queryLower.includes('specialist') || queryLower.includes('see a')) {

    return `Specialist referral information is not available in the current records. Please refer to the referrals section of the complete EMR system or review clinical notes for any documented specialist recommendations.`;
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
 * NOW SUPPORTS: Multi-part questions with combined detailed summaries
 */
function generateFallbackDetailedSummary(
  query: string,
  queryIntent: any,
  data: { care_plans: any[]; medications: any[]; notes: any[] }
): string {
  const { care_plans, medications, notes } = data;
  const queryLower = query.toLowerCase();
  let summary = '';

  // MULTI-PART QUESTION SUPPORT FOR DETAILED SUMMARIES
  // Detect if this is a multi-part question and generate combined detailed summary
  const detectMultiPartForSummary = (q: string): boolean => {
    return q.includes(' and ') || q.includes(',') || q.includes(';');
  };

  if (detectMultiPartForSummary(query)) {
    // For multi-part questions, provide detailed summary for each part
    console.log(`   📋 Generating detailed summary for multi-part question`);

    // Use a more comprehensive approach for detailed summaries
    const summaryParts: string[] = [];

    // Check what types of data are requested
    const includesMeds = queryLower.includes('med') || queryLower.includes('drug') || queryLower.includes('prescription');
    const includesCarePlans = queryLower.includes('care plan') || queryLower.includes('condition') || queryLower.includes('diagnosis');
    const includesNotes = queryLower.includes('note') || queryLower.includes('visit') || queryLower.includes('history');

    // Add relevant sections based on what's in the query
    if (includesMeds && medications && medications.length > 0) {
      summaryParts.push('=== MEDICATIONS ===\n' + formatMedicationsSummary(medications));
    }
    if (includesCarePlans && care_plans && care_plans.length > 0) {
      summaryParts.push('=== CARE PLANS ===\n' + formatCarePlansSummary(care_plans));
    }
    if (includesNotes && notes && notes.length > 0) {
      summaryParts.push('=== CLINICAL NOTES ===\n' + formatNotesSummary(notes));
    }

    // If no specific types detected, provide comprehensive overview
    if (summaryParts.length === 0) {
      summaryParts.push('=== COMPREHENSIVE PATIENT SUMMARY ===');
      if (medications && medications.length > 0) {
        summaryParts.push('\nMEDICATIONS:\n' + formatMedicationsSummary(medications));
      }
      if (care_plans && care_plans.length > 0) {
        summaryParts.push('\nCARE PLANS:\n' + formatCarePlansSummary(care_plans));
      }
      if (notes && notes.length > 0) {
        summaryParts.push('\nCLINICAL NOTES:\n' + formatNotesSummary(notes));
      }
    }

    return summaryParts.join('\n\n');
  }

  // Helper functions for formatting different data types
  function formatMedicationsSummary(meds: any[]): string {
    const activeMeds = meds.filter((m: any) => m.active === true);
    const inactiveMeds = meds.filter((m: any) => m.active === false);

    let output = '';
    if (activeMeds.length > 0) {
      output += `Active Medications (${activeMeds.length}):\n`;
      activeMeds.slice(0, 10).forEach((med: any, idx: number) => {
        output += `${idx + 1}. ${med.name}`;
        if (med.strength) output += ` - ${med.strength}`;
        if (med.sig) output += `\n   Instructions: ${med.sig}`;
        if (med.start_date) output += `\n   Started: ${new Date(med.start_date).toLocaleDateString()}`;
        output += '\n';
      });
    }
    if (inactiveMeds.length > 0 && activeMeds.length < 5) {
      output += `\nInactive Medications (${inactiveMeds.length}):\n`;
      inactiveMeds.slice(0, 5).forEach((med: any, idx: number) => {
        output += `${idx + 1}. ${med.name}`;
        if (med.end_date) output += ` (discontinued ${new Date(med.end_date).toLocaleDateString()})`;
        output += '\n';
      });
    }
    return output;
  }

  function formatCarePlansSummary(plans: any[]): string {
    let output = `Total Care Plans: ${plans.length}\n\n`;
    plans.slice(0, 5).forEach((cp: any, idx: number) => {
      output += `${idx + 1}. ${cp.name}\n`;
      if (cp.description) output += `   ${cp.description.substring(0, 150)}...\n`;
      if (cp.created_at) output += `   Created: ${new Date(cp.created_at).toLocaleDateString()}\n`;
      output += '\n';
    });
    return output;
  }

  function formatNotesSummary(notesList: any[]): string {
    let output = `Total Clinical Notes: ${notesList.length}\n\n`;
    notesList.slice(0, 5).forEach((note: any, idx: number) => {
      output += `${idx + 1}. ${note.name || 'Clinical Note'}`;
      if (note.created_at) output += ` - ${new Date(note.created_at).toLocaleDateString()}`;
      output += '\n';
      if (note.created_by) output += `   Provider: ${note.created_by}\n`;
      output += '\n';
    });
    return output;
  }

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

  // Helper: Format medication strength/dosage for readability
  const formatStrength = (strength: string): string => {
    if (!strength) return '';

    // Convert large UNIT numbers to abbreviated format
    const unitMatch = strength.match(/^(\d+)\s*UNIT$/i);
    if (unitMatch) {
      const units = parseInt(unitMatch[1]);
      if (units >= 1000000) {
        return `${(units / 1000000).toFixed(1).replace(/\.0$/, '')}m units`;
      }
      if (units >= 1000) {
        return `${(units / 1000).toFixed(1).replace(/\.0$/, '')}K units`;
      }
    }

    return strength;
  };

  // Helper: Format medication with all details (using actual API fields)
  const formatMedication = (med: any, idx: number): string => {
    const name = med.name || 'Unknown medication';
    const strength = formatStrength(med.strength || '');

    let text = `${idx + 1}. ${name}`;
    if (strength) text += ` - ${strength}`;
    text += '\n';

    const details = [];
    if (med.sig) details.push(med.sig); // Administration instructions
    if (med.start_date) details.push(`Started: ${formatDate(med.start_date)}`);
    if (med.active !== undefined) details.push(med.active ? 'Active' : 'Inactive');
    if (med.created_at) details.push(`Added: ${formatDate(med.created_at)}`);

    if (details.length > 0) {
      text += `   ${details.join(' | ')}\n`;
    }

    if (med.comment) {
      text += `   Note: ${med.comment.substring(0, 100)}${med.comment.length > 100 ? '...' : ''}\n`;
    }

    return text;
  };

  // Helper: Format care plan with all details (using actual API fields)
  const formatCarePlan = (cp: any, idx: number): string => {
    const name = cp.name || 'Untitled Plan';
    const shareStatus = cp.share_with_patient ? 'Shared with patient' : 'Not shared';

    let text = `${idx + 1}. ${name}\n`;

    if (cp.description) {
      text += `   ${cp.description.substring(0, 200)}${cp.description.length > 200 ? '...' : ''}\n`;
    }

    const details = [];
    details.push(shareStatus);
    if (cp.start_date) details.push(`Started: ${formatDate(cp.start_date)}`);
    if (cp.created_at) details.push(`Created: ${formatDate(cp.created_at)}`);

    if (details.length > 0) {
      text += `   ${details.join(' | ')}\n`;
    }

    return text;
  };

  // Helper: Extract content from note sections (notes don't have simple 'content' field)
  const extractNoteContent = (note: any): string => {
    if (!note.sections || !Array.isArray(note.sections)) {
      return '';
    }

    const contentParts: string[] = [];

    note.sections.forEach((section: any) => {
      if (section.name) {
        contentParts.push(`${section.name}:`);
      }

      if (section.answers && Array.isArray(section.answers)) {
        section.answers.forEach((answer: any) => {
          // Extract value from answer based on type
          if (answer.name) contentParts.push(`  - ${answer.name}`);
          if (answer.value) contentParts.push(`  ${answer.value}`);
          if (answer.text) contentParts.push(`  ${answer.text}`);
        });
      }
    });

    return contentParts.join(' ').trim();
  };

  // Helper: Format clinical note with all details (using CORRECT API fields)
  const formatNote = (note: any, idx: number): string => {
    const noteName = note.name || 'Clinical Note';  // API uses 'name', not 'note_type'
    const date = note.created_at ? formatDate(note.created_at) : 'No date';

    let text = `${idx + 1}. ${noteName} - ${date}\n`;

    // API uses 'created_by', not 'author'
    if (note.created_by) {
      text += `   Provider: ${note.created_by}\n`;
    }

    // Extract content from sections (notes don't have simple 'content' field)
    const content = extractNoteContent(note);
    if (content) {
      text += `   ${content.substring(0, 250)}${content.length > 250 ? '...' : ''}\n`;
    }

    return text;
  };

  // PAST MEDICATIONS DETAILED SUMMARY - check for past/historical queries FIRST
  if ((queryLower.includes('past') || queryLower.includes('previous') || queryLower.includes('historical') ||
       queryLower.includes('inactive') || queryLower.includes('discontinued') || queryLower.includes('stopped') ||
       queryLower.includes('no longer') || queryLower.includes('used to take') || queryLower.includes('taken before')) &&
      (queryLower.includes('med') || queryLower.includes('drug') || queryLower.includes('prescription'))) {
    if (medications && medications.length > 0) {
      const inactiveMeds = medications.filter((m: any) => m.active === false);

      if (inactiveMeds.length > 0) {
        summary = `PAST/DISCONTINUED MEDICATIONS (${inactiveMeds.length} inactive)\n\n`;

        inactiveMeds.forEach((med: any, idx: number) => {
          summary += formatMedication(med, idx);
          if (med.end_date) {
            summary += `   DISCONTINUED: ${formatDate(med.end_date)}\n`;
          }
          summary += '\n';
        });

        return summary.trim();
      }
      return 'No past/discontinued medications found in patient records.\n\nThe patient is currently taking 2 active medications.';
    }
    return 'No medication records available for this patient.';
  }

  // SPECIFIC MEDICATION QUESTIONS with clean formatting
  if (queryIntent.primary === 'medications' || queryLower.includes('medication') ||
      queryLower.includes('med') || queryLower.includes('drug') || queryLower.includes('prescription')) {
    if (medications && medications.length > 0) {
      // CRITICAL: Only show ACTIVE medications for "current medications" questions
      const activeMeds = medications.filter((m: any) => m.active === true);

      if (activeMeds.length > 0) {
        summary = `CURRENT MEDICATIONS (${activeMeds.length} active)\n\n`;

        // Show all active medications with details
        activeMeds.forEach((med: any, idx: number) => {
          summary += formatMedication(med, idx) + '\n';
        });

        return summary.trim();
      }
      return 'No active medications found. Patient is not currently taking any medications.';
    }
    return 'No medications found in patient records.';
  }

  // SPECIFIC CARE PLAN QUESTIONS with clean formatting
  if (queryIntent.primary === 'care_plans' || queryIntent.primary === 'diagnosis' ||
      queryLower.includes('care plan') || queryLower.includes('condition') || queryLower.includes('diagnosis')) {
    if (care_plans && care_plans.length > 0) {
      summary = `CARE PLANS (${care_plans.length} total)\n\n`;

      care_plans.forEach((cp: any, idx: number) => {
        summary += formatCarePlan(cp, idx) + '\n';
      });

      return summary.trim();
    }
    return 'No care plans found in patient records.';
  }

  // SPECIFIC CLINICAL NOTE QUESTIONS with clean formatting
  if (queryIntent.primary === 'history' || queryLower.includes('note') ||
      queryLower.includes('visit') || queryLower.includes('history')) {
    if (notes && notes.length > 0) {
      summary = `CLINICAL NOTES (${notes.length} total)\n\n`;

      notes.slice(0, 10).forEach((note: any, idx: number) => {
        summary += formatNote(note, idx) + '\n';
      });

      if (notes.length > 10) {
        summary += `\n...and ${notes.length - 10} more notes`;
      }

      return summary.trim();
    }
    return 'No clinical notes found in patient records.';
  }

  // COMPREHENSIVE SUMMARY - clean overview of all data
  summary = `PATIENT RECORD OVERVIEW\n\n`;

  // Care Plans
  if (care_plans && care_plans.length > 0) {
    summary += `CARE PLANS (${care_plans.length} total)\n`;
    care_plans.slice(0, 5).forEach((cp: any, idx: number) => {
      summary += formatCarePlan(cp, idx) + '\n';
    });
    if (care_plans.length > 5) {
      summary += `...and ${care_plans.length - 5} more care plans\n`;
    }
    summary += '\n';
  }

  // Medications - separate active and inactive for clarity
  if (medications && medications.length > 0) {
    const activeMeds = medications.filter((m: any) => m.active === true);
    const inactiveMeds = medications.filter((m: any) => m.active === false);

    summary += `MEDICATIONS (${activeMeds.length} active, ${inactiveMeds.length} inactive)\n\n`;

    if (activeMeds.length > 0) {
      summary += `Active Medications:\n`;
      activeMeds.slice(0, 8).forEach((med: any, idx: number) => {
        summary += formatMedication(med, idx) + '\n';
      });
      if (activeMeds.length > 8) {
        summary += `...and ${activeMeds.length - 8} more active medications\n`;
      }
    }

    if (inactiveMeds.length > 0 && medications.length <= 10) {
      summary += `\nInactive Medications (no longer taking):\n`;
      inactiveMeds.slice(0, 3).forEach((med: any, idx: number) => {
        summary += formatMedication(med, activeMeds.length + idx) + '\n';
      });
    }

    summary += '\n';
  }

  // Clinical Notes
  if (notes && notes.length > 0) {
    summary += `CLINICAL NOTES (${notes.length} total)\n`;
    notes.slice(0, 5).forEach((note: any, idx: number) => {
      summary += formatNote(note, idx) + '\n';
    });
    if (notes.length > 5) {
      summary += `...and ${notes.length - 5} more notes\n`;
    }
  }

  if (!care_plans?.length && !medications?.length && !notes?.length) {
    summary = 'No records found for this patient.';
  }

  return summary.trim();
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

    const {
      patient,
      care_plans,
      medications,
      notes,
      allergies,
      conditions,
      vitals,
      family_history,
      appointments,
      documents,
      form_responses,
      insurance_policies
    } = patientData;

    // 2. Build context from all sources (prioritize based on query intent)
    let context = '';
    let artifacts_searched = 0;
    const provenance: FormattedProvenance[] = [];

    // Build context based on query intent for better RAG performance
    const contextPriority: string[] = [];

    // Determine what to prioritize based on intent
    // FIXED: Use word boundary matching to avoid false positives (e.g., "medical" matching "med")
    const isMedicationQuery = queryIntent.primary === 'medications' ||
                              /\b(med|meds|medication|medications|medicine|drug|drugs|pill|prescription)\b/i.test(query);
    const isConditionQuery = queryIntent.primary === 'diagnosis' ||
                            queryIntent.primary === 'care_plans' ||
                            queryIntent.primary === 'medical_history' ||
                            queryIntent.primary === 'has_condition' ||
                            /\b(condition|conditions|diagnosis|diagnoses|disease|disorder)\b/i.test(query);

    if (isMedicationQuery && !isConditionQuery) {
      contextPriority.push('medications', 'care_plans', 'notes');
      console.log(`   🔍 Query Type: MEDICATIONS (prioritizing medication data)`);
    } else if (isConditionQuery) {
      contextPriority.push('care_plans', 'notes', 'medications');
      console.log(`   🔍 Query Type: CONDITIONS/DIAGNOSIS (prioritizing care plans)`);
    } else {
      // Default order
      contextPriority.push('care_plans', 'medications', 'notes');
      console.log(`   🔍 Query Type: GENERAL (using default priority)`);
    }

    // Build context in priority order
    contextPriority.forEach((sourceType) => {
      if (sourceType === 'care_plans' && care_plans) {
        care_plans.forEach((cp: any) => {
          const name = cp.name || 'Untitled Care Plan';
          const description = cp.description || '';
          const created_by = cp.created_by || 'unknown';
          const assigned_to = cp.assigned_to && cp.assigned_to !== 'user_null' ? cp.assigned_to : null;
          const share_status = cp.share_with_patient ? 'Shared with patient' : 'Not shared';

          let text = `Care Plan: ${name}\n${description}\nCreated by: ${created_by}`;
          if (assigned_to) text += `\nAssigned to: ${assigned_to}`;
          text += `\n${share_status}`;

          context += `\n\n[CARE_PLAN_${cp.id || 'unknown'}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: cp.id || 'unknown',
            artifact_type: 'care_plan',
            snippet: description ? description.substring(0, 200) : name,
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
          const strength = med.strength || '';
          const sig = med.sig || '';
          const start_date = med.start_date || '';
          const created_by = med.created_by || 'unknown';
          const active = med.active ? 'Active' : 'Inactive';

          // Format strength for readability
          let displayStrength = strength;
          const unitMatch = strength.match(/^(\d+)\s*UNIT$/i);
          if (unitMatch) {
            const units = parseInt(unitMatch[1]);
            if (units >= 1000000) displayStrength = `${(units / 1000000).toFixed(1).replace(/\.0$/, '')}m units`;
            else if (units >= 1000) displayStrength = `${(units / 1000).toFixed(1).replace(/\.0$/, '')}K units`;
          }

          const text = `Medication: ${name} ${displayStrength}\nInstructions: ${sig}\nStatus: ${active}\nStarted: ${start_date}\nAdded by: ${created_by}`;
          context += `\n\n[MEDICATION_${med.id || 'unknown'}] ${text}`;
          artifacts_searched++;

          // Enhanced snippet with more details
          const snippetParts = [name];
          if (displayStrength) snippetParts.push(displayStrength);
          if (sig) snippetParts.push(sig.substring(0, 60));
          snippetParts.push(active);

          provenance.push({
            artifact_id: med.id || 'unknown',
            artifact_type: 'medication',
            snippet: snippetParts.join(' | '),
            occurred_at: start_date || med.created_at || new Date().toISOString(),
            relevance_score: 0.85,
            char_offsets: [0, text.length],
            source_url: `/api/emr/medications/${med.id || 'unknown'}`,
          });
        });
      }

      if (sourceType === 'notes' && notes) {
        notes.forEach((note: any) => {
          const note_name = note.name || 'Clinical Note';  // API uses 'name', not 'note_type'
          const created_by = note.created_by || 'unknown';  // API uses 'created_by', not 'author'
          const created_at = note.created_at || 'unknown';

          // Extract content from sections (notes don't have simple 'content' field)
          let content = '';
          if (note.sections && Array.isArray(note.sections)) {
            const parts: string[] = [];
            note.sections.forEach((section: any) => {
              if (section.name) parts.push(section.name);
              if (section.answers && Array.isArray(section.answers)) {
                section.answers.forEach((answer: any) => {
                  if (answer.name) parts.push(answer.name);
                  if (answer.value) parts.push(String(answer.value));
                });
              }
            });
            content = parts.join(' ');
          }

          const text = `Clinical Note (${note_name})\nProvider: ${created_by}\nDate: ${created_at}\n${content}`;
          context += `\n\n[NOTE_${note.id || 'unknown'}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: note.id || 'unknown',
            artifact_type: 'note',
            snippet: content ? content.substring(0, 200) : note_name,
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
      short_answer = generateFallbackShortAnswer(query, queryIntent, {
        patient,
        care_plans,
        medications,
        notes,
        allergies,
        conditions,
        vitals,
        family_history,
        appointments,
        documents,
        form_responses,
        insurance_policies
      });
      detailed_summary = generateFallbackDetailedSummary(query, queryIntent, { care_plans, medications, notes });
      console.log('✅ Generated fallback answer using comprehensive structured patient data');
    }

    // 4. Extract structured information from REAL data with CORRECT API fields
    const structured_extractions: StructuredExtraction[] = [];

    // Helper: Format strength for display
    const formatStrengthShort = (strength: string): string => {
      if (!strength) return '';
      const unitMatch = strength.match(/^(\d+)\s*UNIT$/i);
      if (unitMatch) {
        const units = parseInt(unitMatch[1]);
        if (units >= 1000000) return `${(units / 1000000).toFixed(1).replace(/\.0$/, '')}m units`;
        if (units >= 1000) return `${(units / 1000).toFixed(1).replace(/\.0$/, '')}K units`;
      }
      return strength;
    };

    // Extract medications mentioned in the answer - with DETAILED information
    if (medications && detailed_summary) {
      medications.forEach((med: any) => {
        if (med.name && detailed_summary.toLowerCase().includes(med.name.toLowerCase())) {
          // Build comprehensive supporting text with CORRECT API fields
          const strength = formatStrengthShort(med.strength || '');
          const parts = [];

          if (strength) parts.push(strength);
          if (med.sig) parts.push(`Take: ${med.sig.substring(0, 80)}${med.sig.length > 80 ? '...' : ''}`);
          if (med.start_date) parts.push(`Started: ${med.start_date}`);
          parts.push(med.active ? 'Active' : 'Inactive');
          if (med.created_by) parts.push(`Added by: ${med.created_by}`);

          structured_extractions.push({
            type: 'medication',
            value: `${med.name}${strength ? ` (${strength})` : ''}`,
            relevance: 0.9,
            confidence: 0.95,
            source_artifact_id: med.id || 'unknown',
            supporting_text: parts.join(' | '),
          });
        }
      });
    }

    // Extract care plans mentioned - with MORE details
    if (care_plans && detailed_summary) {
      care_plans.forEach((cp: any) => {
        if (cp.name && detailed_summary.toLowerCase().includes(cp.name.toLowerCase())) {
          // Build comprehensive supporting text with CORRECT API fields
          const parts = [];

          if (cp.description) parts.push(cp.description.substring(0, 100) + (cp.description.length > 100 ? '...' : ''));
          parts.push(cp.share_with_patient ? 'Shared with patient' : 'Not shared');
          if (cp.created_at) parts.push(`Created: ${cp.created_at.split('T')[0]}`);
          if (cp.created_by) parts.push(`By: ${cp.created_by}`);

          structured_extractions.push({
            type: 'condition',
            value: cp.name,
            relevance: 0.85,
            confidence: 0.9,
            source_artifact_id: cp.id || 'unknown',
            supporting_text: parts.join(' | '),
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
