/**
 * Query Expansion Service
 *
 * Expands queries with medical synonyms and related terms to improve retrieval coverage
 *
 * Features:
 * - Medical synonym dictionary
 * - Entity-based query expansion
 * - Expanded term generation
 * - Synonym mapping
 *
 */
import { Entity } from './entity-extractor.service';
/**
 * Expanded query result
 */
export interface ExpandedQuery {
    original: string;
    expanded_terms: string[];
    synonym_map: Record<string, string[]>;
}
/**
 * Query Expander Class
 *
 * Dictionary-based query expansion using medical synonyms
 */
declare class QueryExpander {
    /**
     * Medical synonym dictionary
     * Maps medical terms to their synonyms, abbreviations, and related terms
     */
    private readonly MEDICAL_SYNONYMS;
    /**
     * Expand query with medical synonyms
     *
     * @param query - Original query
     * @param entities - Extracted entities from query
     * @returns Expanded query with synonyms
     *
     * @example
     * expandQuery("Patient with hypertension on lisinopril", entities)
     * // Returns: {
     * //   original: "Patient with hypertension on lisinopril",
     * //   expanded_terms: [
     * //     "Patient with hypertension on lisinopril",
     * //     "Patient with high blood pressure on lisinopril",
     * //     "Patient with htn on lisinopril",
     * //     "Patient with hypertension on zestril",
     * //     "Patient with hypertension on ace inhibitor"
     * //   ],
     * //   synonym_map: {
     * //     "hypertension": ["high blood pressure", "htn"],
     * //     "lisinopril": ["zestril", "prinivil", "ace inhibitor"]
     * //   }
     * // }
     */
    expandQuery(query: string, entities: Entity[]): ExpandedQuery;
    /**
     * Get medical synonyms for a term
     *
     * @param term - Term to find synonyms for
     * @returns List of synonyms
     *
     * @example
     * getMedicalSynonyms("hypertension")
     * // Returns: ["high blood pressure", "htn", "elevated blood pressure", "bp"]
     */
    getMedicalSynonyms(term: string): string[];
    /**
     * Build expanded search terms from original and synonyms
     *
     * @param original - Original term
     * @param synonyms - List of synonyms
     * @returns Combined search terms with original boosted
     *
     * @example
     * buildExpandedSearchTerms("hypertension", ["high blood pressure", "htn"])
     * // Returns: ["hypertension^2", "high blood pressure", "htn"]
     */
    buildExpandedSearchTerms(original: string, synonyms: string[]): string[];
    /**
     * Replace entity in query with synonym
     *
     * @param query - Original query
     * @param entity - Entity text to replace
     * @param synonym - Synonym to use
     * @returns Expanded query
     */
    private replaceEntityInQuery;
    /**
     * Escape special regex characters
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    private escapeRegex;
    /**
     * Get all available medical terms in dictionary
     *
     * @returns List of all terms
     */
    getAllMedicalTerms(): string[];
    /**
     * Check if term has synonyms
     *
     * @param term - Term to check
     * @returns True if synonyms exist
     */
    hasSynonyms(term: string): boolean;
    /**
     * Get synonym count for term
     *
     * @param term - Term to check
     * @returns Number of synonyms
     */
    getSynonymCount(term: string): number;
    /**
     * Expand multiple queries in batch
     *
     * @param queries - Array of queries with entities
     * @returns Array of expanded queries
     */
    expandBatch(queries: Array<{
        query: string;
        entities: Entity[];
    }>): ExpandedQuery[];
}
declare const queryExpander: QueryExpander;
export default queryExpander;
//# sourceMappingURL=query-expander.service.d.ts.map