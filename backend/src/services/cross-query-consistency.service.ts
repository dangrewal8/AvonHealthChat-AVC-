/**
 * Cross-Query Consistency Checker Service
 *
 * Phase 9: Detects contradictions across patient conversations.
 * Ensures temporal and semantic consistency of answers over time.
 *
 * Tech Stack: PostgreSQL (raw SQL), TypeScript strict mode
 * HIPAA Compliant: All processing local
 */

import { Pool } from 'pg';
import {
  ConsistencyResult,
  Contradiction,
  ConsistencyCheckType,
  ConflictSeverity,
  ConsistencyCheckRecord,
  EntityHistory,
  ConversationRecord,
} from '../types/hallucination-prevention.types';
import { Extraction } from '../services/extraction-prompt-builder.service';
import conversationHistoryService from './conversation-history.service';
import { v4 as uuidv4 } from 'uuid';

class CrossQueryConsistencyService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'avon_health_rag',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('[Consistency Checker] PostgreSQL pool initialized');
  }

  /**
   * Check consistency of current conversation against patient history
   */
  async checkConsistency(
    currentConversation: ConversationRecord,
    patientId: string
  ): Promise<ConsistencyResult> {
    try {
      console.log(`[Consistency Checker] Checking consistency for conversation ${currentConversation.id}`);

      // Get recent patient history (last 30 days)
      const historyStart = new Date();
      historyStart.setDate(historyStart.getDate() - 30);

      const history = await conversationHistoryService.getConversationsByPatient(
        patientId,
        50 // Last 50 conversations
      );

      // Filter to exclude current conversation and only recent
      const recentHistory = history.filter(
        conv => conv.id !== currentConversation.id &&
                conv.query_timestamp >= historyStart
      );

      console.log(`[Consistency Checker] Found ${recentHistory.length} recent conversations for comparison`);

      const contradictions: Contradiction[] = [];

      // Check 1: Entity consistency (medications, conditions, etc.)
      const entityContradictions = await this.checkEntityConsistency(
        currentConversation,
        recentHistory
      );
      contradictions.push(...entityContradictions);

      // Check 2: Temporal consistency (discontinued medications shouldn't reappear)
      const temporalContradictions = await this.checkTemporalConsistency(
        currentConversation,
        recentHistory
      );
      contradictions.push(...temporalContradictions);

      // Check 3: Semantic consistency (no conflicting statements)
      const semanticContradictions = await this.checkSemanticConsistency(
        currentConversation,
        recentHistory
      );
      contradictions.push(...semanticContradictions);

      // Calculate consistency score
      const consistencyScore = this.calculateConsistencyScore(
        contradictions,
        recentHistory.length
      );

      // Generate warnings
      const warnings = this.generateWarnings(contradictions);

      // Store consistency checks to database
      await this.storeConsistencyChecks(currentConversation.id, patientId, contradictions);

      const result: ConsistencyResult = {
        conversation_id: currentConversation.id,
        patient_id: patientId,
        is_consistent: contradictions.length === 0,
        consistency_score: consistencyScore,
        contradictions,
        warnings,
        checked_at: new Date(),
      };

      console.log(
        `[Consistency Checker] Consistency check complete: ` +
        `${contradictions.length} contradictions found, ` +
        `score: ${consistencyScore.toFixed(2)}`
      );

      return result;
    } catch (error) {
      console.error('[Consistency Checker] Error checking consistency:', error);
      throw new Error(`Failed to check consistency: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check entity consistency (same entities should have consistent attributes)
   */
  private async checkEntityConsistency(
    current: ConversationRecord,
    history: ConversationRecord[]
  ): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = [];

    // Extract entities from current conversation
    const currentEntities = this.extractEntitiesFromExtractions(current.extractions);

    // Check each entity against history
    for (const entity of currentEntities) {
      // Find past mentions of this entity
      const pastMentions = this.findEntityInHistory(entity, history);

      for (const pastMention of pastMentions) {
        // Check for contradictions
        const contradiction = this.compareEntityAttributes(entity, pastMention);

        if (contradiction) {
          contradictions.push({
            current_statement: this.formatEntityMention(entity),
            previous_statement: this.formatEntityMention(pastMention.entity),
            previous_conversation_id: pastMention.conversation.id,
            previous_query: pastMention.conversation.query,
            previous_timestamp: pastMention.conversation.query_timestamp,
            severity: this.calculateSeverity(contradiction.type),
            explanation: contradiction.explanation,
            entity_type: entity.type,
            entity_value: entity.value,
          });
        }
      }
    }

    return contradictions;
  }

  /**
   * Check temporal consistency (medications discontinued shouldn't reappear)
   */
  private async checkTemporalConsistency(
    current: ConversationRecord,
    history: ConversationRecord[]
  ): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = [];

    // Check for medications mentioned as "discontinued" in history
    // but appearing as "active" in current conversation
    const currentMedications = this.extractMedicationsFromExtractions(current.extractions);

    for (const med of currentMedications) {
      const discontinuedInHistory = this.wasMedicationDiscontinued(med, history);

      if (discontinuedInHistory) {
        contradictions.push({
          current_statement: `Patient is currently taking ${med}`,
          previous_statement: `${med} was discontinued`,
          previous_conversation_id: discontinuedInHistory.conversation.id,
          previous_query: discontinuedInHistory.conversation.query,
          previous_timestamp: discontinuedInHistory.conversation.query_timestamp,
          severity: 'high',
          explanation: `Medication ${med} appears in current answer but was marked as discontinued in a previous conversation`,
          entity_type: 'medication',
          entity_value: med,
        });
      }
    }

    return contradictions;
  }

  /**
   * Check semantic consistency (no conflicting statements)
   */
  private async checkSemanticConsistency(
    current: ConversationRecord,
    history: ConversationRecord[]
  ): Promise<Contradiction[]> {
    const contradictions: Contradiction[] = [];

    // Look for semantic contradictions
    // Example: Previous answer said "no diabetes", current says "taking diabetes medication"

    const currentAnswer = current.short_answer.toLowerCase();

    for (const past of history) {
      const pastAnswer = past.short_answer.toLowerCase();

      // Check for negation contradictions
      const negationConflict = this.checkNegationConflict(
        currentAnswer,
        pastAnswer,
        current,
        past
      );

      if (negationConflict) {
        contradictions.push(negationConflict);
      }
    }

    return contradictions;
  }

  /**
   * Extract entities from extractions
   */
  private extractEntitiesFromExtractions(extractions: Extraction[]): Array<{type: string, value: string, details?: any}> {
    const entities: Array<{type: string, value: string, details?: any}> = [];

    for (const extraction of extractions) {
      // Extract the primary value from content (first value)
      const value = Object.values(extraction.content)[0] as string || '';

      entities.push({
        type: extraction.type,
        value,
        details: extraction,
      });
    }

    return entities;
  }

  /**
   * Extract medication names from extractions
   */
  private extractMedicationsFromExtractions(extractions: Extraction[]): string[] {
    return extractions
      .filter(e => e.type === 'medication')
      .map(e => Object.values(e.content)[0] as string || '');
  }

  /**
   * Find entity in conversation history
   */
  private findEntityInHistory(
    entity: {type: string, value: string, details?: any},
    history: ConversationRecord[]
  ): Array<{conversation: ConversationRecord, entity: {type: string, value: string, details?: any}}> {
    const mentions: Array<{conversation: ConversationRecord, entity: {type: string, value: string, details?: any}}> = [];

    for (const conversation of history) {
      const entities = this.extractEntitiesFromExtractions(conversation.extractions);

      for (const e of entities) {
        // Match by type and value (case-insensitive)
        if (e.type === entity.type &&
            e.value.toLowerCase() === entity.value.toLowerCase()) {
          mentions.push({ conversation, entity: e });
        }
      }
    }

    return mentions;
  }

  /**
   * Compare entity attributes for contradictions
   */
  private compareEntityAttributes(
    current: {type: string, value: string, details?: any},
    past: {conversation: ConversationRecord, entity: {type: string, value: string, details?: any}}
  ): {type: string, explanation: string} | null {
    // For medications, check dosage consistency
    if (current.type === 'medication') {
      const currentDosage = current.details?.dosage;
      const pastDosage = past.entity.details?.dosage;

      if (currentDosage && pastDosage && currentDosage !== pastDosage) {
        // Check if the change is recent (within 7 days)
        const daysDiff = Math.abs(
          (new Date().getTime() - past.conversation.query_timestamp.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff < 7) {
          return {
            type: 'dosage_change',
            explanation: `Dosage changed from ${pastDosage} to ${currentDosage} within ${Math.round(daysDiff)} days`,
          };
        }
      }
    }

    // For conditions, check status consistency
    if (current.type === 'condition') {
      const currentStatus = current.details?.status;
      const pastStatus = past.entity.details?.status;

      if (currentStatus === 'active' && pastStatus === 'resolved') {
        return {
          type: 'status_contradiction',
          explanation: `Condition was previously marked as resolved but now appears as active`,
        };
      }
    }

    return null;
  }

  /**
   * Check if medication was discontinued in history
   */
  private wasMedicationDiscontinued(
    medication: string,
    history: ConversationRecord[]
  ): {conversation: ConversationRecord} | null {
    for (const conversation of history) {
      const answer = conversation.short_answer.toLowerCase() + ' ' + conversation.detailed_summary.toLowerCase();

      // Look for discontinuation indicators
      if (answer.includes(medication.toLowerCase()) &&
          (answer.includes('discontinued') ||
           answer.includes('stopped') ||
           answer.includes('no longer taking'))) {
        return { conversation };
      }
    }

    return null;
  }

  /**
   * Check for negation conflicts
   */
  private checkNegationConflict(
    currentAnswer: string,
    pastAnswer: string,
    current: ConversationRecord,
    past: ConversationRecord
  ): Contradiction | null {
    // Common medical keywords
    const keywords = ['diabetes', 'hypertension', 'allergy', 'medication', 'condition'];

    for (const keyword of keywords) {
      const currentHasKeyword = currentAnswer.includes(keyword);
      const pastHasKeyword = pastAnswer.includes(keyword);

      if (currentHasKeyword && pastHasKeyword) {
        // Check for negation in past but not in current
        const pastIsNegated = pastAnswer.includes(`no ${keyword}`) ||
                             pastAnswer.includes(`not ${keyword}`) ||
                             pastAnswer.includes(`without ${keyword}`);

        const currentIsNegated = currentAnswer.includes(`no ${keyword}`) ||
                                currentAnswer.includes(`not ${keyword}`) ||
                                currentAnswer.includes(`without ${keyword}`);

        if (pastIsNegated && !currentIsNegated) {
          return {
            current_statement: `Current answer mentions ${keyword}`,
            previous_statement: `Previous answer indicated no ${keyword}`,
            previous_conversation_id: past.id,
            previous_query: past.query,
            previous_timestamp: past.query_timestamp,
            severity: 'medium',
            explanation: `Current answer mentions ${keyword} but previous answer indicated none`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Format entity mention for display
   */
  private formatEntityMention(entity: {type: string, value: string, details?: any}): string {
    if (entity.details?.dosage) {
      return `${entity.value} ${entity.details.dosage}`;
    }
    return entity.value;
  }

  /**
   * Calculate severity of contradiction
   */
  private calculateSeverity(contradictionType: string): ConflictSeverity {
    switch (contradictionType) {
      case 'status_contradiction':
        return 'high';
      case 'dosage_change':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Calculate overall consistency score
   */
  private calculateConsistencyScore(
    contradictions: Contradiction[],
    historyCount: number
  ): number {
    if (contradictions.length === 0) {
      return 1.0;
    }

    // Weight by severity
    const severityWeights: Record<ConflictSeverity, number> = {
      low: 0.05,
      medium: 0.15,
      high: 0.30,
      critical: 0.50,
    };

    const totalPenalty = contradictions.reduce((sum, c) =>
      sum + severityWeights[c.severity], 0
    );

    const score = Math.max(0, 1.0 - totalPenalty);
    return score;
  }

  /**
   * Generate warnings based on contradictions
   */
  private generateWarnings(contradictions: Contradiction[]): string[] {
    const warnings: string[] = [];

    const criticalCount = contradictions.filter(c => c.severity === 'critical').length;
    const highCount = contradictions.filter(c => c.severity === 'high').length;

    if (criticalCount > 0) {
      warnings.push(`${criticalCount} CRITICAL contradiction(s) detected - immediate review required`);
    }

    if (highCount > 0) {
      warnings.push(`${highCount} high-severity contradiction(s) detected`);
    }

    if (contradictions.length > 3) {
      warnings.push(`Multiple contradictions detected (${contradictions.length}) - verify patient record accuracy`);
    }

    return warnings;
  }

  /**
   * Store consistency checks to database
   */
  private async storeConsistencyChecks(
    conversationId: string,
    patientId: string,
    contradictions: Contradiction[]
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO consistency_checks (
          id,
          patient_id,
          current_conversation_id,
          previous_conversation_id,
          check_type,
          is_consistent,
          inconsistency_description,
          current_statement,
          previous_statement,
          conflict_severity,
          entity_type,
          entity_value,
          consistency_score,
          checked_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      `;

      for (const contradiction of contradictions) {
        const values = [
          uuidv4(),
          patientId,
          conversationId,
          contradiction.previous_conversation_id,
          this.determineCheckType(contradiction),
          false, // Not consistent if we're storing a contradiction
          contradiction.explanation,
          contradiction.current_statement,
          contradiction.previous_statement,
          contradiction.severity,
          contradiction.entity_type ?? null,
          contradiction.entity_value ?? null,
          0.0, // Individual check is inconsistent
        ];

        await client.query(query, values);
      }

      // Also store a summary record if fully consistent
      if (contradictions.length === 0) {
        const summaryValues = [
          uuidv4(),
          patientId,
          conversationId,
          null,
          'overall',
          true,
          'No contradictions detected',
          null,
          null,
          null,
          null,
          null,
          1.0,
        ];

        await client.query(query, summaryValues);
      }

      console.log(`[Consistency Checker] Stored ${contradictions.length} consistency check records`);
    } catch (error) {
      console.error('[Consistency Checker] Error storing consistency checks:', error);
      // Don't throw - consistency check failure shouldn't block the response
    } finally {
      client.release();
    }
  }

  /**
   * Determine check type from contradiction
   */
  private determineCheckType(contradiction: Contradiction): ConsistencyCheckType {
    if (contradiction.entity_type) {
      return 'entity_consistency';
    }
    if (contradiction.explanation.includes('discontinued') ||
        contradiction.explanation.includes('stopped')) {
      return 'temporal_consistency';
    }
    return 'semantic_consistency';
  }

  /**
   * Track entity changes over time
   */
  async trackEntityChanges(
    entityType: string,
    entityValue: string,
    patientId: string
  ): Promise<EntityHistory[]> {
    const client = await this.pool.connect();

    try {
      // Get all conversations mentioning this entity
      const query = `
        SELECT
          id,
          query,
          query_timestamp,
          short_answer,
          detailed_summary,
          extractions
        FROM conversation_history
        WHERE patient_id = $1
          AND (
            extractions::text ILIKE $2
            OR short_answer ILIKE $2
            OR detailed_summary ILIKE $2
          )
        ORDER BY query_timestamp ASC
      `;

      const searchPattern = `%${entityValue}%`;
      const result = await client.query(query, [patientId, searchPattern]);

      const history: EntityHistory[] = result.rows.map(row => ({
        entity_type: entityType,
        entity_value: entityValue,
        conversation_id: row.id,
        query: row.query,
        timestamp: new Date(row.query_timestamp),
        context: row.short_answer,
        status: this.determineEntityStatus(row.short_answer + ' ' + row.detailed_summary, entityValue),
      }));

      return history;
    } catch (error) {
      console.error('[Consistency Checker] Error tracking entity changes:', error);
      throw new Error(`Failed to track entity changes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Determine entity status from context
   */
  private determineEntityStatus(context: string, entity: string): 'active' | 'discontinued' | 'changed' | undefined {
    const contextLower = context.toLowerCase();
    const entityLower = entity.toLowerCase();

    if (!contextLower.includes(entityLower)) {
      return undefined;
    }

    if (contextLower.includes('discontinued') ||
        contextLower.includes('stopped') ||
        contextLower.includes('no longer')) {
      return 'discontinued';
    }

    if (contextLower.includes('changed') ||
        contextLower.includes('modified') ||
        contextLower.includes('adjusted')) {
      return 'changed';
    }

    return 'active';
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Consistency Checker] PostgreSQL pool closed');
  }
}

// Export singleton instance
const crossQueryConsistency = new CrossQueryConsistencyService();
export default crossQueryConsistency;
