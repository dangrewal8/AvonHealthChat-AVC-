"use strict";
/**
 * Provenance Formatter Usage Examples
 *
 * Demonstrates:
 * - Formatting extractions for UI
 * - Snippet extraction with context
 * - Date formatting (relative/absolute)
 * - Source URL construction
 * - Grouping and sorting
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleFormatExtractions = exampleFormatExtractions;
exports.exampleExtractSnippet = exampleExtractSnippet;
exports.exampleFormatDate = exampleFormatDate;
exports.exampleBuildSourceURL = exampleBuildSourceURL;
exports.exampleGroupByArtifact = exampleGroupByArtifact;
exports.exampleGetUniqueArtifacts = exampleGetUniqueArtifacts;
exports.exampleSortByDate = exampleSortByDate;
exports.exampleSortByRelevance = exampleSortByRelevance;
exports.exampleFormatAsCitationList = exampleFormatAsCitationList;
exports.exampleSnippetSentenceBoundaries = exampleSnippetSentenceBoundaries;
exports.exampleLongTextTruncation = exampleLongTextTruncation;
exports.exampleEdgeCases = exampleEdgeCases;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const provenance_formatter_service_1 = __importDefault(require("../services/provenance-formatter.service"));
/**
 * Generate sample candidates
 */
function generateSampleCandidates() {
    const chunks = [
        {
            chunk_id: 'chunk_001',
            artifact_id: 'note_123',
            patient_id: 'patient_456',
            content: 'Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management. Blood glucose levels improving with current regimen. Continue monitoring blood sugar levels and adjust dosage if needed.',
            metadata: {
                artifact_type: 'clinical_note',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                author: 'Dr. Smith',
            },
        },
        {
            chunk_id: 'chunk_002',
            artifact_id: 'note_124',
            patient_id: 'patient_456',
            content: 'Follow up scheduled in 2 weeks for blood pressure monitoring. Continue Metformin as prescribed. Monitor for hypoglycemia and report any symptoms immediately.',
            metadata: {
                artifact_type: 'care_plan',
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
                author: 'Dr. Johnson',
            },
        },
    ];
    return chunks.map((chunk, index) => ({
        chunk,
        score: 0.9 - index * 0.1,
        snippet: chunk.content.substring(0, 50),
        highlights: [],
        metadata: chunk.metadata,
        rank: index + 1,
    }));
}
/**
 * Generate sample extractions
 */
function generateSampleExtractions() {
    return [
        {
            type: 'medication_recommendation',
            content: {
                medication: 'Metformin',
                dosage: '500mg',
                frequency: 'twice daily',
            },
            provenance: {
                artifact_id: 'note_123',
                chunk_id: 'chunk_001',
                char_offsets: [18, 47],
                supporting_text: 'Metformin 500mg twice daily',
            },
        },
        {
            type: 'care_plan_note',
            content: {
                follow_up: '2 weeks',
                purpose: 'blood pressure monitoring',
            },
            provenance: {
                artifact_id: 'note_124',
                chunk_id: 'chunk_002',
                char_offsets: [0, 62],
                supporting_text: 'Follow up scheduled in 2 weeks for blood pressure monitoring',
            },
        },
    ];
}
/**
 * Example 1: Format extractions for UI
 */
function exampleFormatExtractions() {
    console.log('Example 1: Format Extractions for UI');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extractions = generateSampleExtractions();
    const formatted = provenance_formatter_service_1.default.format(extractions, candidates);
    console.log('  Formatted Provenances:\n');
    formatted.forEach((provenance, index) => {
        console.log(`    ${index + 1}. ${provenance.artifact_id} (${provenance.artifact_type})`);
        console.log(`       Date: ${provenance.note_date}`);
        console.log(`       Author: ${provenance.author || 'Unknown'}`);
        console.log(`       Snippet: "${provenance.snippet.substring(0, 60)}..."`);
        console.log(`       Relevance: ${(provenance.relevance_score * 100).toFixed(0)}%`);
        console.log(`       URL: ${provenance.source_url}\n`);
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Extract snippet with context
 */
function exampleExtractSnippet() {
    console.log('Example 2: Extract Snippet with Context');
    console.log('-'.repeat(80));
    const text = 'Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management. Blood glucose levels improving with current regimen.';
    console.log('  Original text:');
    console.log(`    "${text}"\n`);
    // Extract with context
    const snippet1 = provenance_formatter_service_1.default.extractSnippet(text, [18, 47]);
    console.log('  Snippet with context [18, 47]:');
    console.log(`    "${snippet1}"\n`);
    // Extract at start of text
    const snippet2 = provenance_formatter_service_1.default.extractSnippet(text, [0, 7]);
    console.log('  Snippet at start [0, 7]:');
    console.log(`    "${snippet2}"\n`);
    // Extract at end of text
    const snippet3 = provenance_formatter_service_1.default.extractSnippet(text, [120, 127]);
    console.log('  Snippet at end [120, 127]:');
    console.log(`    "${snippet3}"\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Format dates
 */
function exampleFormatDate() {
    console.log('Example 3: Format Dates');
    console.log('-'.repeat(80));
    console.log('  Testing date formatting:\n');
    // Today
    const today = new Date().toISOString();
    console.log(`    Today: ${provenance_formatter_service_1.default.formatDate(today)}`);
    // Yesterday
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`    Yesterday: ${provenance_formatter_service_1.default.formatDate(yesterday)}`);
    // 3 days ago
    const threeDays = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`    3 days ago: ${provenance_formatter_service_1.default.formatDate(threeDays)}`);
    // 10 days ago (absolute)
    const tenDays = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`    10 days ago: ${provenance_formatter_service_1.default.formatDate(tenDays)}`);
    // 30 days ago (absolute)
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`    30 days ago: ${provenance_formatter_service_1.default.formatDate(thirtyDays)}`);
    // Missing date
    console.log(`    Missing date: ${provenance_formatter_service_1.default.formatDate(undefined)}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 4: Build source URLs
 */
function exampleBuildSourceURL() {
    console.log('Example 4: Build Source URLs');
    console.log('-'.repeat(80));
    console.log('  Testing source URL construction:\n');
    console.log(`    Clinical note: ${provenance_formatter_service_1.default.buildSourceURL('note_123', 'clinical_note')}`);
    console.log(`    Care plan: ${provenance_formatter_service_1.default.buildSourceURL('plan_456', 'care_plan')}`);
    console.log(`    Medication: ${provenance_formatter_service_1.default.buildSourceURL('med_789', 'medication')}`);
    console.log(`    Lab result: ${provenance_formatter_service_1.default.buildSourceURL('lab_101', 'lab_result')}`);
    console.log(`    Unknown type: ${provenance_formatter_service_1.default.buildSourceURL('art_202', 'unknown')}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Group by artifact
 */
function exampleGroupByArtifact() {
    console.log('Example 5: Group by Artifact');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extractions = generateSampleExtractions();
    const formatted = provenance_formatter_service_1.default.format(extractions, candidates);
    const grouped = provenance_formatter_service_1.default.groupByArtifact(formatted);
    console.log('  Grouped provenances:\n');
    grouped.forEach((provenances, artifactId) => {
        console.log(`    ${artifactId}: ${provenances.length} citations`);
        provenances.forEach((p, i) => {
            console.log(`      ${i + 1}. "${p.snippet.substring(0, 40)}..."`);
        });
        console.log('');
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Get unique artifacts
 */
function exampleGetUniqueArtifacts() {
    console.log('Example 6: Get Unique Artifacts');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extractions = generateSampleExtractions();
    const formatted = provenance_formatter_service_1.default.format(extractions, candidates);
    const unique = provenance_formatter_service_1.default.getUniqueArtifacts(formatted);
    console.log('  Unique artifacts:\n');
    unique.forEach(artifactId => {
        console.log(`    - ${artifactId}`);
    });
    console.log(`\n    Total: ${unique.length} unique artifacts\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Sort by date
 */
function exampleSortByDate() {
    console.log('Example 7: Sort by Date');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extractions = generateSampleExtractions();
    const formatted = provenance_formatter_service_1.default.format(extractions, candidates);
    const sorted = provenance_formatter_service_1.default.sortByDate(formatted);
    console.log('  Provenances sorted by date (most recent first):\n');
    sorted.forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.artifact_id} - ${p.note_date}`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 8: Sort by relevance
 */
function exampleSortByRelevance() {
    console.log('Example 8: Sort by Relevance');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extractions = generateSampleExtractions();
    const formatted = provenance_formatter_service_1.default.format(extractions, candidates);
    const sorted = provenance_formatter_service_1.default.sortByRelevance(formatted);
    console.log('  Provenances sorted by relevance (highest first):\n');
    sorted.forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.artifact_id} - ${(p.relevance_score * 100).toFixed(0)}%`);
    });
    console.log('\n  ✅ Success\n');
}
/**
 * Example 9: Format as citation list
 */
function exampleFormatAsCitationList() {
    console.log('Example 9: Format as Citation List');
    console.log('-'.repeat(80));
    const candidates = generateSampleCandidates();
    const extractions = generateSampleExtractions();
    const formatted = provenance_formatter_service_1.default.format(extractions, candidates);
    const citationList = provenance_formatter_service_1.default.formatAsCitationList(formatted);
    console.log('  Citation List:\n');
    console.log(citationList.split('\n').map(line => `    ${line}`).join('\n'));
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Snippet with sentence boundaries
 */
function exampleSnippetSentenceBoundaries() {
    console.log('Example 10: Snippet with Sentence Boundaries');
    console.log('-'.repeat(80));
    const text = 'This is the first sentence. Patient prescribed Metformin 500mg twice daily. This is the third sentence. And the fourth sentence continues here.';
    console.log('  Original text:');
    console.log(`    "${text}"\n`);
    // Extract with sentence boundaries
    const snippet = provenance_formatter_service_1.default.extractSnippet(text, [28, 57]);
    console.log('  Snippet with sentence boundaries:');
    console.log(`    "${snippet}"\n`);
    console.log('  Note: Extended to complete sentences when possible\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Long text truncation
 */
function exampleLongTextTruncation() {
    console.log('Example 11: Long Text Truncation');
    console.log('-'.repeat(80));
    const longText = 'This is a very long text with many words and sentences. ' +
        'Patient prescribed Metformin 500mg twice daily for Type 2 Diabetes management. ' +
        'Blood glucose levels improving with current regimen. ' +
        'Continue monitoring blood sugar levels and adjust dosage if needed. ' +
        'Follow up scheduled in 2 weeks for blood pressure monitoring.';
    console.log('  Long text snippet (max 200 chars):\n');
    const snippet = provenance_formatter_service_1.default.extractSnippet(longText, [58, 87]);
    console.log(`    "${snippet}"`);
    console.log(`\n    Length: ${snippet.length} chars (max 200)\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Edge cases
 */
function exampleEdgeCases() {
    console.log('Example 12: Edge Cases');
    console.log('-'.repeat(80));
    console.log('  Testing edge cases:\n');
    // Very short text
    const shortText = 'Short text.';
    const snippet1 = provenance_formatter_service_1.default.extractSnippet(shortText, [0, 5]);
    console.log(`    Short text snippet: "${snippet1}"`);
    // Citation at start
    const startText = 'Metformin prescribed for diabetes management.';
    const snippet2 = provenance_formatter_service_1.default.extractSnippet(startText, [0, 9]);
    console.log(`    Citation at start: "${snippet2}"`);
    // Citation at end
    const endText = 'Patient is taking Metformin.';
    const snippet3 = provenance_formatter_service_1.default.extractSnippet(endText, [18, 27]);
    console.log(`    Citation at end: "${snippet3}"`);
    // Empty extraction
    const emptyExtractions = [];
    const emptyCandidates = generateSampleCandidates();
    const emptyFormatted = provenance_formatter_service_1.default.format(emptyExtractions, emptyCandidates);
    console.log(`\n    Empty extractions: ${emptyFormatted.length} formatted`);
    console.log('\n  ✅ Success\n');
}
/**
 * Example 13: Explain formatting process
 */
function exampleExplain() {
    console.log('Example 13: Explain Formatting Process');
    console.log('-'.repeat(80));
    const explanation = provenance_formatter_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('PROVENANCE FORMATTER EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleFormatExtractions();
        exampleExtractSnippet();
        exampleFormatDate();
        exampleBuildSourceURL();
        exampleGroupByArtifact();
        exampleGetUniqueArtifacts();
        exampleSortByDate();
        exampleSortByRelevance();
        exampleFormatAsCitationList();
        exampleSnippetSentenceBoundaries();
        exampleLongTextTruncation();
        exampleEdgeCases();
        exampleExplain();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=provenance-formatter.example.js.map