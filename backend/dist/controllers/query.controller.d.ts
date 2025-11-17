/**
 * Query Controller
 * Handles RAG query processing (placeholder implementation)
 */
import { Request, Response } from 'express';
import { QueryRequest, QueryResponse, RecentQueriesResponse, ErrorResponse } from '../types/api.types';
declare class QueryController {
    /**
     * POST /api/query
     * Process a natural language query against patient EMR data
     *
     * This is a PLACEHOLDER implementation. The full implementation will:
     * 1. Parse and understand the query (Query Understanding Agent)
     * 2. Retrieve relevant artifacts (Retriever Agent)
     * 3. Generate answer with provenance (Answer Generator Agent)
     * 4. Format and return response (Response Formatter)
     */
    search(req: Request<{}, {}, QueryRequest>, res: Response<QueryResponse | ErrorResponse>): Promise<void>;
    /**
     * GET /api/queries/recent
     * Get recent queries for a patient
     */
    getRecent(req: Request, res: Response<RecentQueriesResponse | ErrorResponse>): void;
    /**
     * POST /api/query/stream
     * Process query with Server-Sent Events for real-time progress updates
     *
     * Streams progress through 3 stages:
     * 1. query_understanding - Parse and understand the query
     * 2. retrieval - Retrieve relevant artifacts
     * 3. generation - Generate answer with citations
     */
    searchStream(req: Request<{}, {}, QueryRequest>, res: Response): Promise<void>;
    /**
     * Add query to history
     */
    private addToHistory;
}
export declare const queryController: QueryController;
export default queryController;
//# sourceMappingURL=query.controller.d.ts.map