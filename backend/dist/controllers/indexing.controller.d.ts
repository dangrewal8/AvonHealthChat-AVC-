/**
 * Indexing Controller
 * Handles patient data indexing operations
 *
 * Tech Stack: Node.js 18+, Express.js, TypeScript (strict mode)
 * AI Processing: Ollama (local - HIPAA compliant)
 * Vector Storage: FAISS (local disk)
 */
import { Request, Response } from 'express';
import { IndexPatientRequest, IndexPatientResponse, ClearIndexResponse, ErrorResponse } from '../types/api.types';
declare class IndexingController {
    /**
     * Convert text-chunker Chunk format to indexing-agent Chunk format
     *
     * Tech Stack: Pure TypeScript transformation (no ORMs, no external libraries)
     */
    private convertToIndexChunks;
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
    indexPatient(req: Request<{
        patientId: string;
    }, {}, IndexPatientRequest>, res: Response<IndexPatientResponse | ErrorResponse>): Promise<void>;
    /**
     * DELETE /api/index/patient/:patientId
     * Clear all indexed data for a patient
     *
     * This is a PLACEHOLDER implementation. The full implementation will:
     * 1. Remove all embeddings from vector database
     * 2. Remove all metadata from database
     * 3. Clear any caches
     */
    clearPatient(req: Request<{
        patientId: string;
    }>, res: Response<ClearIndexResponse | ErrorResponse>): Promise<void>;
}
export declare const indexingController: IndexingController;
export default indexingController;
//# sourceMappingURL=indexing.controller.d.ts.map