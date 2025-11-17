/**
 * Indexing Controller
 * Handles patient data indexing operations
 *
 * Tech Stack: Node.js 18+, Express.js, TypeScript (strict mode)
 * AI Processing: Ollama (local - HIPAA compliant)
 * Vector Storage: FAISS (local disk)
 */

import { Request, Response } from 'express';
import {
  IndexPatientRequest,
  IndexPatientResponse,
  ClearIndexResponse,
  ErrorResponse,
} from '../types/api.types';
import emrNormalizedService from '../services/emr-normalized.service';
import textChunker, { Chunk as TextChunk } from '../services/text-chunker.service';
import indexingAgent, { Chunk as IndexChunk } from '../services/indexing-agent.service';

class IndexingController {
  /**
   * Convert text-chunker Chunk format to indexing-agent Chunk format
   *
   * Tech Stack: Pure TypeScript transformation (no ORMs, no external libraries)
   */
  private convertToIndexChunks(textChunks: TextChunk[]): IndexChunk[] {
    return textChunks.map((chunk, index) => ({
      chunk_id: chunk.chunk_id,
      artifact_id: chunk.artifact_id,
      text: chunk.chunk_text,
      chunk_index: index,
      absolute_offset: chunk.char_offsets[0],
      metadata: {
        patient_id: chunk.patient_id,
        artifact_type: chunk.artifact_type,
        occurred_at: chunk.occurred_at,
        author: chunk.author,
        source_url: chunk.source,
      },
    }));
  }
  /**
   * POST /api/index/patient/:patientId
   * Index all EMR data for a patient
   *
   * Full RAG Pipeline:
   * 1. Fetch all patient EMR data (care plans, medications, notes)
   * 2. Chunk the text content (200-300 words, 50-word overlap)
   * 3. Generate embeddings via Ollama (768-dimensional vectors)
   * 4. Store embeddings in FAISS vector database
   * 5. Store metadata in memory
   */
  async indexPatient(
    req: Request<{ patientId: string }, {}, IndexPatientRequest>,
    res: Response<IndexPatientResponse | ErrorResponse>
  ): Promise<void> {
    const startTime = Date.now();
    const { patientId } = req.params;
    const { force_reindex } = req.body;

    try {
      console.log(
        `[Indexing] Starting indexing for patient ${patientId} (force_reindex: ${force_reindex || false})`
      );

      // ================================================================
      // STAGE 1: Fetch EMR Data
      // ================================================================
      const fetchStart = Date.now();
      const emrData = await emrNormalizedService.fetchAll(patientId);
      const fetchTime = Date.now() - fetchStart;

      const notesCount = emrData.byType.notes.length;
      const documentsCount = emrData.byType.documents.length;
      const medicationsCount = emrData.byType.medications.length;
      const conditionsCount = emrData.byType.conditions.length;
      const allergiesCount = emrData.byType.allergies.length;
      const carePlansCount = emrData.byType.carePlans.length;
      const formResponsesCount = emrData.byType.formResponses.length;
      const messagesCount = emrData.byType.messages.length;
      const labObservationsCount = emrData.byType.labObservations.length;
      const vitalsCount = emrData.byType.vitals.length;
      const appointmentsCount = emrData.byType.appointments.length;
      const superbillsCount = emrData.byType.superbills.length;
      const insurancePoliciesCount = emrData.byType.insurancePolicies.length;
      const tasksCount = emrData.byType.tasks.length;
      const familyHistoriesCount = emrData.byType.familyHistories.length;
      const intakeFlowsCount = emrData.byType.intakeFlows.length;
      const formsCount = emrData.byType.forms.length;
      const totalArtifacts = emrData.totalCount;

      console.log(
        `[Indexing] ✓ Fetched ${totalArtifacts} Tier 1+2+3+4 artifacts (${fetchTime}ms):`,
        `${notesCount} notes, ${documentsCount} documents, ${medicationsCount} medications, ` +
        `${conditionsCount} conditions, ${allergiesCount} allergies, ${carePlansCount} care plans, ` +
        `${formResponsesCount} form responses, ${messagesCount} messages, ${labObservationsCount} labs, ${vitalsCount} vitals, ` +
        `${appointmentsCount} appointments, ${superbillsCount} superbills, ${insurancePoliciesCount} insurance policies, ` +
        `${tasksCount} tasks, ${familyHistoriesCount} family histories, ${intakeFlowsCount} intake flows, ${formsCount} forms`
      );

      // Handle empty data case
      if (totalArtifacts === 0) {
        console.log(`[Indexing] No data to index for patient ${patientId}`);
        res.json({
          success: true,
          patient_id: patientId,
          indexed_count: 0,
          byType: {
            notes: 0,
            documents: 0,
            medications: 0,
            conditions: 0,
            allergies: 0,
            care_plans: 0,
            form_responses: 0,
            messages: 0,
            lab_observations: 0,
            vitals: 0,
            appointments: 0,
            superbills: 0,
            insurance_policies: 0,
            tasks: 0,
            family_histories: 0,
            intake_flows: 0,
            forms: 0,
          },
          chunks_created: 0,
          processing_time_ms: Date.now() - startTime,
          message: `No EMR data found for patient ${patientId}`,
        });
        return;
      }

      // ================================================================
      // STAGE 2: Text Chunking
      // ================================================================
      const chunkStart = Date.now();
      const textChunks: TextChunk[] = [];

      for (const artifact of emrData.artifacts) {
        try {
          const chunks = textChunker.chunk(artifact);
          textChunks.push(...chunks);
        } catch (error) {
          console.error(
            `[Indexing] Failed to chunk artifact ${artifact.id}:`,
            error instanceof Error ? error.message : error
          );
          // Continue with other artifacts even if one fails
        }
      }

      const chunkTime = Date.now() - chunkStart;
      const avgChunksPerArtifact = (textChunks.length / totalArtifacts).toFixed(1);

      console.log(
        `[Indexing] ✓ Generated ${textChunks.length} chunks from ${totalArtifacts} artifacts (${chunkTime}ms)`,
        `(avg: ${avgChunksPerArtifact} chunks/artifact)`
      );

      // Handle case where no chunks were generated
      if (textChunks.length === 0) {
        console.warn(`[Indexing] No chunks generated from ${totalArtifacts} artifacts`);
        res.status(207).json({
          success: false,
          patient_id: patientId,
          indexed_count: 0,
          byType: {
            notes: notesCount,
            documents: documentsCount,
            medications: medicationsCount,
            conditions: conditionsCount,
            allergies: allergiesCount,
            care_plans: carePlansCount,
            form_responses: formResponsesCount,
            messages: messagesCount,
            lab_observations: labObservationsCount,
            vitals: vitalsCount,
            appointments: appointmentsCount,
            superbills: superbillsCount,
            insurance_policies: insurancePoliciesCount,
            tasks: tasksCount,
            family_histories: familyHistoriesCount,
            intake_flows: intakeFlowsCount,
            forms: formsCount,
          },
          chunks_created: 0,
          processing_time_ms: Date.now() - startTime,
          message: `Failed to generate chunks from ${totalArtifacts} artifacts`,
        });
        return;
      }

      // ================================================================
      // STAGE 3-6: Embedding Generation & Vector Storage
      // ================================================================
      const indexStart = Date.now();

      // Convert text-chunker chunks to indexing-agent chunk format
      const indexChunks = this.convertToIndexChunks(textChunks);

      // Progress callback for logging
      const progressCallback = (progress: any) => {
        console.log(
          `[Indexing] Stage ${progress.stage}: ${progress.percentComplete.toFixed(0)}% - ` +
          `Processed ${progress.chunksProcessed}/${progress.chunksTotal} chunks`
        );
      };

      // Call indexing agent with converted chunks
      const indexingResult = await indexingAgent.indexChunks(indexChunks, progressCallback);
      const indexTime = Date.now() - indexStart;

      console.log(
        `[Indexing] ✓ Indexed ${indexingResult.chunksIndexed} chunks, ${indexingResult.sentencesIndexed} sentences (${indexTime}ms)`
      );

      // ================================================================
      // STAGE 7: Format Response
      // ================================================================
      const totalTime = Date.now() - startTime;

      // Determine success status
      const allSuccessful = indexingResult.success && indexingResult.errors.length === 0;
      const statusCode = allSuccessful ? 200 : 207; // 207 = Multi-Status (partial success)

      const response: IndexPatientResponse = {
        success: allSuccessful,
        patient_id: patientId,
        indexed_count: totalArtifacts,
        byType: {
          notes: notesCount,
          documents: documentsCount,
          medications: medicationsCount,
          conditions: conditionsCount,
          allergies: allergiesCount,
          care_plans: carePlansCount,
          form_responses: formResponsesCount,
          messages: messagesCount,
          lab_observations: labObservationsCount,
          vitals: vitalsCount,
          appointments: appointmentsCount,
          superbills: superbillsCount,
          insurance_policies: insurancePoliciesCount,
          tasks: tasksCount,
          family_histories: familyHistoriesCount,
          intake_flows: intakeFlowsCount,
          forms: formsCount,
        },
        chunks_created: textChunks.length,
        processing_time_ms: totalTime,
        message: allSuccessful
          ? `Successfully indexed ${textChunks.length} chunks (${indexingResult.sentencesIndexed} sentences) from ${totalArtifacts} artifacts for patient ${patientId}`
          : `Partially indexed ${indexingResult.chunksIndexed}/${textChunks.length} chunks (${indexingResult.errors.length} errors)`,
      };

      // Add detailed statistics
      (response as any).statistics = {
        artifacts: {
          notes: notesCount,
          documents: documentsCount,
          medications: medicationsCount,
          conditions: conditionsCount,
          allergies: allergiesCount,
          care_plans: carePlansCount,
          total: totalArtifacts,
        },
        chunks: {
          generated: textChunks.length,
          indexed: indexingResult.chunksIndexed,
          failed: indexingResult.errors.length,
        },
        embeddings: {
          chunkEmbeddings: indexingResult.chunkEmbeddingsGenerated,
          sentenceEmbeddings: indexingResult.sentenceEmbeddingsGenerated,
          totalSentences: indexingResult.sentencesIndexed,
        },
        vectors: {
          stored: indexingResult.chunksIndexed + indexingResult.sentencesIndexed,
          dimensions: 768, // nomic-embed-text
        },
        timing: {
          fetchTime,
          chunkTime,
          indexingTime: indexingResult.duration,
          totalTime,
        },
      };

      // Include errors if any
      if (indexingResult.errors.length > 0) {
        (response as any).errors = indexingResult.errors;
      }

      res.status(statusCode).json(response);
    } catch (error) {
      console.error(`[Indexing] Error indexing patient ${patientId}:`, error);

      // Check for specific error types
      let errorMessage = 'Failed to index patient data';
      let errorCode = 'INDEXING_ERROR';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Provide helpful error messages for common issues
        if (errorMessage.includes('Ollama') || errorMessage.includes('embedding')) {
          errorCode = 'OLLAMA_CONNECTION_ERROR';
          errorMessage = `Ollama AI service not available. ${errorMessage}\n\nPlease ensure:\n1. Ollama is running: ollama serve\n2. Model is installed: ollama pull nomic-embed-text\n3. Service is accessible: curl http://localhost:11434/api/tags`;
        } else if (errorMessage.includes('FAISS') || errorMessage.includes('vector')) {
          errorCode = 'VECTOR_STORE_ERROR';
          errorMessage = `FAISS vector store error: ${errorMessage}`;
        }
      }

      res.status(500).json({
        success: false,
        error: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * DELETE /api/index/patient/:patientId
   * Clear all indexed data for a patient
   *
   * This is a PLACEHOLDER implementation. The full implementation will:
   * 1. Remove all embeddings from vector database
   * 2. Remove all metadata from database
   * 3. Clear any caches
   */
  async clearPatient(
    req: Request<{ patientId: string }>,
    res: Response<ClearIndexResponse | ErrorResponse>
  ): Promise<void> {
    const { patientId } = req.params;

    try {
      console.log(`[Indexing] Clearing index for patient ${patientId}`);

      // TODO: Implement actual index clearing
      // 1. Delete from vector store
      // 2. Delete from metadata database
      // 3. Clear caches

      // For now, just clear the EMR service cache
      const emrService = require('../services/emr.service').default;
      emrService.clearPatientCache(patientId);

      const response: ClearIndexResponse = {
        success: true,
        patient_id: patientId,
        message: `Cleared cache for patient ${patientId}. Full index clearing not yet implemented.`,
      };

      res.json(response);
    } catch (error) {
      console.error(`[Indexing] Error clearing patient ${patientId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to clear patient index',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const indexingController = new IndexingController();
export default indexingController;
