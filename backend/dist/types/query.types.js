"use strict";
/**
 * Query Processing Types
 *
 * Type definitions for query understanding, intent classification, and entity extraction.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryIntent = void 0;
/**
 * Query Intent Classification
 */
var QueryIntent;
(function (QueryIntent) {
    QueryIntent["RETRIEVE_MEDICATIONS"] = "retrieve_medications";
    QueryIntent["RETRIEVE_CARE_PLANS"] = "retrieve_care_plans";
    QueryIntent["RETRIEVE_NOTES"] = "retrieve_notes";
    QueryIntent["RETRIEVE_RECENT"] = "retrieve_recent";
    QueryIntent["SEARCH"] = "search";
    QueryIntent["SUMMARIZE"] = "summarize";
    QueryIntent["UNKNOWN"] = "unknown";
})(QueryIntent || (exports.QueryIntent = QueryIntent = {}));
//# sourceMappingURL=query.types.js.map