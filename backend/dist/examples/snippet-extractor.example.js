"use strict";
/**
 * Snippet Extractor Usage Examples
 *
 * Demonstrates:
 * - Basic snippet extraction
 * - Sentence boundary detection
 * - Ellipsis handling
 * - Max length enforcement
 * - Highlight extraction
 * - Multiple snippets
 * - Custom configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleBasicExtraction = exampleBasicExtraction;
exports.exampleSentenceBoundaries = exampleSentenceBoundaries;
exports.exampleMaxLength = exampleMaxLength;
exports.exampleEllipsis = exampleEllipsis;
exports.exampleHighlight = exampleHighlight;
exports.exampleMultipleSnippets = exampleMultipleSnippets;
exports.exampleCustomConfig = exampleCustomConfig;
exports.exampleSnippetInfo = exampleSnippetInfo;
exports.exampleDocumentStart = exampleDocumentStart;
exports.exampleDocumentEnd = exampleDocumentEnd;
exports.exampleShortText = exampleShortText;
exports.exampleProvenanceIntegration = exampleProvenanceIntegration;
exports.exampleValidation = exampleValidation;
exports.exampleMedicalRecord = exampleMedicalRecord;
exports.exampleExplain = exampleExplain;
exports.runAllExamples = runAllExamples;
const snippet_extractor_service_1 = __importDefault(require("../services/snippet-extractor.service"));
/**
 * Example 1: Basic snippet extraction (ChatGPT spec)
 */
function exampleBasicExtraction() {
    console.log('Example 1: Basic Snippet Extraction (50 chars context)');
    console.log('-'.repeat(80));
    const text = `
The patient was prescribed ibuprofen 400 mg q6h PRN for pain. This medication
should be taken with food to minimize gastric irritation. Monitor for signs of
bleeding or stomach upset. Follow up in 2 weeks if pain persists.
  `.trim();
    // Extract snippet around "ibuprofen 400 mg q6h PRN"
    const charOffsets = [27, 51]; // "ibuprofen 400 mg q6h PRN"
    const snippet = snippet_extractor_service_1.default.extract(text, charOffsets);
    console.log('  Full text:');
    console.log(`    "${text}"\n`);
    console.log('  Cited text:');
    console.log(`    "${text.substring(charOffsets[0], charOffsets[1])}"\n`);
    console.log('  Extracted snippet (50 chars before/after):');
    console.log(`    "${snippet}"\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 2: Sentence boundary detection
 */
function exampleSentenceBoundaries() {
    console.log('Example 2: Sentence Boundary Detection');
    console.log('-'.repeat(80));
    const text = `
Patient reports mild headache. Started ibuprofen 400 mg. Pain improved significantly.
No adverse effects noted. Continue current regimen.
  `.trim();
    const charOffsets = [38, 58]; // "ibuprofen 400 mg"
    // With sentence boundaries (default)
    const withSentences = snippet_extractor_service_1.default.extract(text, charOffsets, {
        preferSentences: true,
    });
    // Without sentence boundaries
    const withoutSentences = snippet_extractor_service_1.default.extract(text, charOffsets, {
        preferSentences: false,
    });
    console.log('  Cited text:');
    console.log(`    "${text.substring(charOffsets[0], charOffsets[1])}"\n`);
    console.log('  With sentence boundaries:');
    console.log(`    "${withSentences}"\n`);
    console.log('  Without sentence boundaries:');
    console.log(`    "${withoutSentences}"\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 3: Max length enforcement (200 chars)
 */
function exampleMaxLength() {
    console.log('Example 3: Max Length Enforcement (200 chars)');
    console.log('-'.repeat(80));
    const longText = `
The patient has a complex medical history including hypertension, type 2 diabetes,
and chronic kidney disease. Current medications include lisinopril 10 mg daily,
metformin 1000 mg twice daily, insulin glargine 20 units at bedtime, atorvastatin
40 mg daily, aspirin 81 mg daily, and metoprolol 50 mg twice daily. Recent lab work
shows HbA1c of 7.2%, creatinine 1.4 mg/dL, and LDL cholesterol 95 mg/dL.
  `.trim();
    // Extract snippet around "metformin 1000 mg twice daily"
    const charOffsets = [159, 187];
    const snippet = snippet_extractor_service_1.default.extract(longText, charOffsets);
    console.log('  Full text length:', longText.length, 'chars\n');
    console.log('  Cited text:');
    console.log(`    "${longText.substring(charOffsets[0], charOffsets[1])}"\n`);
    console.log('  Extracted snippet (max 200 chars):');
    console.log(`    "${snippet}"`);
    console.log(`    Length: ${snippet.length} chars\n`);
    console.log('  ✅ Success (enforced max length)\n');
}
/**
 * Example 4: Ellipsis handling
 */
function exampleEllipsis() {
    console.log('Example 4: Ellipsis Handling');
    console.log('-'.repeat(80));
    const text = `
This is the beginning of a document. The patient was prescribed ibuprofen 400 mg
for pain management. This is the end of the document.
  `.trim();
    const charOffsets = [66, 82]; // "ibuprofen 400 mg"
    // With ellipsis (default)
    const withEllipsis = snippet_extractor_service_1.default.extract(text, charOffsets, {
        addEllipsis: true,
    });
    // Without ellipsis
    const withoutEllipsis = snippet_extractor_service_1.default.extract(text, charOffsets, {
        addEllipsis: false,
    });
    console.log('  With ellipsis:');
    console.log(`    "${withEllipsis}"\n`);
    console.log('  Without ellipsis:');
    console.log(`    "${withoutEllipsis}"\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 5: Highlight extraction
 */
function exampleHighlight() {
    console.log('Example 5: Highlight Extraction');
    console.log('-'.repeat(80));
    const text = `
The patient was prescribed ibuprofen 400 mg q6h PRN for pain. This medication
should be taken with food to minimize gastric irritation.
  `.trim();
    const charOffsets = [27, 51]; // "ibuprofen 400 mg q6h PRN"
    // Default highlight (markdown bold)
    const markdown = snippet_extractor_service_1.default.extractWithHighlight(text, charOffsets);
    // HTML highlight
    const html = snippet_extractor_service_1.default.extractWithHighlight(text, charOffsets, {}, ['<mark>', '</mark>']);
    console.log('  Markdown highlight:');
    console.log(`    ${markdown}\n`);
    console.log('  HTML highlight:');
    console.log(`    ${html}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 6: Multiple snippets
 */
function exampleMultipleSnippets() {
    console.log('Example 6: Multiple Snippets from Same Text');
    console.log('-'.repeat(80));
    const text = `
Current medications: lisinopril 10 mg daily, metformin 1000 mg twice daily,
atorvastatin 40 mg daily. All medications should be taken as prescribed.
  `.trim();
    const offsetsList = [
        [21, 41], // "lisinopril 10 mg daily"
        [43, 71], // "metformin 1000 mg twice daily"
        [73, 97], // "atorvastatin 40 mg daily"
    ];
    const snippets = snippet_extractor_service_1.default.extractMultiple(text, offsetsList, {
        contextChars: 30,
    });
    console.log('  Extracted snippets:\n');
    snippets.forEach((snippet, i) => {
        console.log(`    ${i + 1}. "${snippet}"\n`);
    });
    console.log('  ✅ Success\n');
}
/**
 * Example 7: Custom configuration
 */
function exampleCustomConfig() {
    console.log('Example 7: Custom Configuration');
    console.log('-'.repeat(80));
    const text = `
The patient was prescribed ibuprofen 400 mg q6h PRN for pain. This medication
should be taken with food to minimize gastric irritation.
  `.trim();
    const charOffsets = [27, 51];
    // Minimal context (20 chars)
    const minimal = snippet_extractor_service_1.default.extract(text, charOffsets, {
        contextChars: 20,
        maxLength: 100,
        preferSentences: false,
        addEllipsis: true,
    });
    // Generous context (80 chars)
    const generous = snippet_extractor_service_1.default.extract(text, charOffsets, {
        contextChars: 80,
        maxLength: 250,
        preferSentences: true,
        addEllipsis: true,
    });
    console.log('  Minimal context (20 chars):');
    console.log(`    "${minimal}"\n`);
    console.log('  Generous context (80 chars):');
    console.log(`    "${generous}"\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 8: Snippet info (debugging)
 */
function exampleSnippetInfo() {
    console.log('Example 8: Snippet Info (Debugging)');
    console.log('-'.repeat(80));
    const text = `
The patient was prescribed ibuprofen 400 mg q6h PRN for pain. This medication
should be taken with food to minimize gastric irritation.
  `.trim();
    const charOffsets = [27, 51];
    const info = snippet_extractor_service_1.default.getSnippetInfo(text, charOffsets);
    console.log('  Snippet info:\n');
    console.log(`    Snippet: "${info.snippet}"`);
    console.log(`    Snippet length: ${info.snippetLength} chars`);
    console.log(`    Cited length: ${info.citedLength} chars`);
    console.log(`    Snippet start: ${info.snippetStart}`);
    console.log(`    Snippet end: ${info.snippetEnd}`);
    console.log(`    Cited start: ${info.citedStart}`);
    console.log(`    Cited end: ${info.citedEnd}`);
    console.log(`    Has start ellipsis: ${info.hasStartEllipsis}`);
    console.log(`    Has end ellipsis: ${info.hasEndEllipsis}`);
    console.log(`    Used sentence boundaries: ${info.usedSentenceBoundaries}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 9: Snippet at document start
 */
function exampleDocumentStart() {
    console.log('Example 9: Snippet at Document Start');
    console.log('-'.repeat(80));
    const text = `
Ibuprofen 400 mg q6h PRN for pain. This medication should be taken with food.
Additional instructions follow.
  `.trim();
    const charOffsets = [1, 25]; // "Ibuprofen 400 mg q6h PRN"
    const snippet = snippet_extractor_service_1.default.extract(text, charOffsets);
    console.log('  Snippet (at document start):');
    console.log(`    "${snippet}"\n`);
    console.log('  Note: No leading ellipsis since at start\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 10: Snippet at document end
 */
function exampleDocumentEnd() {
    console.log('Example 10: Snippet at Document End');
    console.log('-'.repeat(80));
    const text = `
Follow up in 2 weeks. Continue current regimen including ibuprofen 400 mg PRN.
  `.trim();
    const charOffsets = [59, 79]; // "ibuprofen 400 mg PRN"
    const snippet = snippet_extractor_service_1.default.extract(text, charOffsets);
    console.log('  Snippet (at document end):');
    console.log(`    "${snippet}"\n`);
    console.log('  Note: No trailing ellipsis since at end\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 11: Short text (no truncation needed)
 */
function exampleShortText() {
    console.log('Example 11: Short Text (No Truncation)');
    console.log('-'.repeat(80));
    const text = 'Prescribed ibuprofen 400 mg.';
    const charOffsets = [11, 27]; // "ibuprofen 400 mg"
    const snippet = snippet_extractor_service_1.default.extract(text, charOffsets);
    console.log('  Full text:', `"${text}"`);
    console.log('  Snippet:', `"${snippet}"\n`);
    console.log('  Note: No ellipsis since text is short\n');
    console.log('  ✅ Success\n');
}
/**
 * Example 12: Integration with provenance
 */
function exampleProvenanceIntegration() {
    console.log('Example 12: Integration with Provenance');
    console.log('-'.repeat(80));
    // Simulated chunk from retrieval
    const chunk = {
        chunk_id: 'chunk_123',
        chunk_text: `
Assessment: Patient presents with moderate pain (6/10) in lower back. Started on
ibuprofen 400 mg q6h PRN for pain management. Patient reports good relief with
previous NSAID use. No contraindications noted. Will monitor for GI side effects.
    `.trim(),
        artifact_id: 'note_456',
    };
    // Simulated provenance from LLM extraction
    const provenance = {
        artifact_id: 'note_456',
        char_offsets: [82, 106], // "ibuprofen 400 mg q6h PRN"
    };
    // Extract snippet for UI display (per ChatGPT spec)
    const snippet = snippet_extractor_service_1.default.extract(chunk.chunk_text, provenance.char_offsets, {
        contextChars: 50, // per spec
        maxLength: 200, // per spec
        preferSentences: true,
        addEllipsis: true,
    });
    console.log('  Chunk text:');
    console.log(`    ${chunk.chunk_text}\n`);
    console.log('  Cited text (from LLM):');
    console.log(`    "${chunk.chunk_text.substring(provenance.char_offsets[0], provenance.char_offsets[1])}"\n`);
    console.log('  Snippet for UI:');
    console.log(`    "${snippet}"\n`);
    console.log('  ✅ Success (ready for UI display)\n');
}
/**
 * Example 13: Validation
 */
function exampleValidation() {
    console.log('Example 13: Snippet Validation');
    console.log('-'.repeat(80));
    const text = `
The patient was prescribed ibuprofen 400 mg q6h PRN for pain. Monitor for side effects.
  `.trim();
    const charOffsets = [27, 51];
    const isValid = snippet_extractor_service_1.default.validateSnippet(text, charOffsets);
    console.log('  Cited text:');
    console.log(`    "${text.substring(charOffsets[0], charOffsets[1])}"\n`);
    console.log('  Snippet validation:');
    console.log(`    ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`    (Snippet contains cited text)\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 14: Medical record snippet
 */
function exampleMedicalRecord() {
    console.log('Example 14: Medical Record Snippet');
    console.log('-'.repeat(80));
    const record = `
PROGRESS NOTE - 2025-01-24

Chief Complaint: Lower back pain

Assessment & Plan:
1. Lower back pain - likely muscular strain
   - Start ibuprofen 400 mg PO q6h PRN for pain
   - Apply heat therapy
   - Physical therapy referral
   - Follow up in 2 weeks

2. Hypertension - well controlled
   - Continue lisinopril 10 mg daily
   - Recheck BP at next visit
  `.trim();
    const charOffsets = [132, 165]; // "ibuprofen 400 mg PO q6h PRN"
    const snippet = snippet_extractor_service_1.default.extract(record, charOffsets);
    const highlighted = snippet_extractor_service_1.default.extractWithHighlight(record, charOffsets);
    console.log('  Snippet:');
    console.log(`    ${snippet}\n`);
    console.log('  Highlighted:');
    console.log(`    ${highlighted}\n`);
    console.log('  ✅ Success\n');
}
/**
 * Example 15: Explain snippet extractor
 */
function exampleExplain() {
    console.log('Example 15: Explain Snippet Extractor');
    console.log('-'.repeat(80));
    const explanation = snippet_extractor_service_1.default.explain();
    console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('\n  ✅ Success\n');
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('SNIPPET EXTRACTOR EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        exampleBasicExtraction();
        exampleSentenceBoundaries();
        exampleMaxLength();
        exampleEllipsis();
        exampleHighlight();
        exampleMultipleSnippets();
        exampleCustomConfig();
        exampleSnippetInfo();
        exampleDocumentStart();
        exampleDocumentEnd();
        exampleShortText();
        exampleProvenanceIntegration();
        exampleValidation();
        exampleMedicalRecord();
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
//# sourceMappingURL=snippet-extractor.example.js.map