"use strict";
/**
 * Sentence Embedding Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Sentence segmentation with medical abbreviation handling
 * - Sentence-level embedding generation
 * - Storage in FAISS and metadata DB
 * - Two-pass retrieval for precise citations
 * - End-to-end chunk processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleSentenceSegmentation = exampleSentenceSegmentation;
exports.exampleEmbedSentences = exampleEmbedSentences;
exports.exampleStoreSentenceEmbeddings = exampleStoreSentenceEmbeddings;
exports.exampleProcessChunk = exampleProcessChunk;
exports.exampleTwoPassRetrieval = exampleTwoPassRetrieval;
exports.exampleLongSentences = exampleLongSentences;
exports.exampleProvenanceTracking = exampleProvenanceTracking;
exports.runAllExamples = runAllExamples;
const sentence_embedding_service_1 = __importDefault(require("../services/sentence-embedding.service"));
const embedding_factory_service_1 = __importDefault(require("../services/embedding-factory.service"));
const faiss_vector_store_service_1 = __importDefault(require("../services/faiss-vector-store.service"));
const metadata_db_service_1 = __importDefault(require("../services/metadata-db.service"));
const env_config_1 = __importDefault(require("../config/env.config"));
/**
 * Initialize services
 */
async function initializeServices() {
    console.log('Initializing services...');
    // Initialize FAISS (Ollama uses 768 dimensions for nomic-embed-text)
    await faiss_vector_store_service_1.default.initialize(env_config_1.default.ollama.embeddingDimensions);
    // Connect to PostgreSQL
    await metadata_db_service_1.default.connect({
        host: env_config_1.default.postgres.host,
        port: env_config_1.default.postgres.port,
        database: env_config_1.default.postgres.database,
        user: env_config_1.default.postgres.user,
        password: env_config_1.default.postgres.password,
    });
    console.log('✓ Services initialized\n');
}
/**
 * Example 1: Sentence segmentation with medical abbreviations
 */
async function exampleSentenceSegmentation() {
    console.log('Example 1: Sentence Segmentation with Medical Abbreviations');
    console.log('-'.repeat(80));
    try {
        // Sample clinical note with medical abbreviations
        const chunkText = `Patient presented to Dr. Smith's clinic on 01/15/2024. Blood pressure reading: 140/90 mmHg (stage 1 hypertension). Patient reports no chest pain vs. shortness of breath. Prescribed Metformin 500mg twice daily, i.e., 1000mg total per day. Follow-up appointment scheduled in 2 weeks, etc.`;
        const chunkId = 'chunk_001';
        const chunkAbsoluteOffset = 0;
        console.log('  Input text:');
        console.log(`  "${chunkText}"`);
        console.log('');
        // Segment into sentences
        const sentences = sentence_embedding_service_1.default.segmentIntoSentences(chunkText, chunkId, chunkAbsoluteOffset);
        console.log(`  Segmented into ${sentences.length} sentences:`);
        sentences.forEach((sentence, i) => {
            console.log(`\n    ${i + 1}. "${sentence.text}"`);
            console.log(`       Offsets: [${sentence.char_offsets[0]}, ${sentence.char_offsets[1]}]`);
            console.log(`       Length: ${sentence.text.length} chars`);
        });
        // Get segmentation statistics
        const stats = sentence_embedding_service_1.default.getSegmentationStats(sentences);
        console.log('\n  Segmentation statistics:');
        console.log(`    Total sentences: ${stats.totalSentences}`);
        console.log(`    Average length: ${stats.averageLength} chars`);
        console.log(`    Min length: ${stats.minLength} chars`);
        console.log(`    Max length: ${stats.maxLength} chars`);
        console.log(`    Sentences over limit (${200}): ${stats.sentencesOverLimit}`);
        console.log('  ✅ Success\n');
        return sentences;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 2: Generate sentence-level embeddings
 */
async function exampleEmbedSentences() {
    console.log('Example 2: Generate Sentence-Level Embeddings');
    console.log('-'.repeat(80));
    try {
        const chunkText = 'Patient diagnosed with Type 2 Diabetes mellitus. Blood glucose levels are elevated. Started on Metformin 500mg twice daily.';
        const chunkId = 'chunk_002';
        const artifactId = 'artifact_001';
        console.log('  Input text:');
        console.log(`  "${chunkText}"`);
        console.log('');
        // Segment into sentences
        const sentences = sentence_embedding_service_1.default.segmentIntoSentences(chunkText, chunkId, 0);
        console.log(`  Segmented into ${sentences.length} sentences`);
        // Generate embeddings
        const sentenceEmbeddings = await sentence_embedding_service_1.default.embedSentences(sentences, artifactId, {
            patient_id: 'patient_123',
            artifact_type: 'progress_note',
            occurred_at: '2024-01-15T10:30:00Z',
        });
        console.log('\n  Generated embeddings:');
        sentenceEmbeddings.forEach((embedding, i) => {
            console.log(`\n    ${i + 1}. Sentence ID: ${embedding.sentence_id}`);
            console.log(`       Text: "${embedding.text}"`);
            console.log(`       Embedding dims: ${embedding.embedding.length}`);
            console.log(`       Offsets: [${embedding.absolute_offsets[0]}, ${embedding.absolute_offsets[1]}]`);
        });
        console.log('  ✅ Success\n');
        return sentenceEmbeddings;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 3: Store sentence embeddings
 */
async function exampleStoreSentenceEmbeddings() {
    console.log('Example 3: Store Sentence Embeddings');
    console.log('-'.repeat(80));
    try {
        const chunkText = 'Patient reports improved energy levels. Blood glucose readings averaging 120 mg/dL. No hypoglycemic episodes reported.';
        const chunkId = 'chunk_003';
        const artifactId = 'artifact_002';
        // Segment and embed
        const sentences = sentence_embedding_service_1.default.segmentIntoSentences(chunkText, chunkId, 0);
        const sentenceEmbeddings = await sentence_embedding_service_1.default.embedSentences(sentences, artifactId, {
            patient_id: 'patient_123',
            artifact_type: 'progress_note',
            occurred_at: '2024-02-01T11:00:00Z',
        });
        console.log(`  Generated ${sentenceEmbeddings.length} sentence embeddings`);
        // Store in FAISS and metadata DB
        await sentence_embedding_service_1.default.storeSentenceEmbeddings(sentenceEmbeddings);
        console.log(`  Stored ${sentenceEmbeddings.length} embeddings in FAISS`);
        console.log('  ✅ Success\n');
        return sentenceEmbeddings;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 4: End-to-end chunk processing
 */
async function exampleProcessChunk() {
    console.log('Example 4: End-to-End Chunk Processing');
    console.log('-'.repeat(80));
    try {
        const chunkText = `Physical examination findings: Blood pressure 135/85 mmHg, heart rate 72 bpm, respiratory rate 16/min. Patient appears well-nourished and in no acute distress. Cardiovascular exam reveals regular rate and rhythm, no murmurs. Lungs clear to auscultation bilaterally. Abdomen soft, non-tender, non-distended.`;
        const chunkId = 'chunk_004';
        const artifactId = 'artifact_003';
        const chunkAbsoluteOffset = 150; // Assume this chunk starts at character 150 in the artifact
        console.log('  Processing chunk...');
        console.log(`  Chunk ID: ${chunkId}`);
        console.log(`  Artifact ID: ${artifactId}`);
        console.log(`  Text length: ${chunkText.length} chars`);
        console.log('');
        // Process entire chunk: segment, embed, and store
        const sentenceCount = await sentence_embedding_service_1.default.processChunk(chunkId, chunkText, artifactId, chunkAbsoluteOffset, {
            patient_id: 'patient_123',
            artifact_type: 'progress_note',
            occurred_at: '2024-03-01T14:30:00Z',
        });
        console.log(`  Processed ${sentenceCount} sentences`);
        console.log('  ✅ Success\n');
        return sentenceCount;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 5: Two-pass retrieval for precise citations
 */
async function exampleTwoPassRetrieval() {
    console.log('Example 5: Two-Pass Retrieval for Precise Citations');
    console.log('-'.repeat(80));
    try {
        // First, add some test data (chunks with sentence-level embeddings)
        const testChunks = [
            {
                id: 'chunk_005',
                artifactId: 'artifact_004',
                text: 'Patient diagnosed with Type 2 Diabetes mellitus in 2020. HbA1c levels have been trending upward over the past year. Currently on Metformin 1000mg twice daily.',
                offset: 0,
            },
            {
                id: 'chunk_006',
                artifactId: 'artifact_005',
                text: 'Blood pressure readings consistently elevated above 140/90 mmHg. Patient advised to reduce sodium intake and increase physical activity. Consider adding ACE inhibitor if BP remains high.',
                offset: 200,
            },
            {
                id: 'chunk_007',
                artifactId: 'artifact_006',
                text: 'Lab results show improved glucose control. Fasting glucose 115 mg/dL (previously 145 mg/dL). Patient reports good medication adherence and dietary compliance.',
                offset: 400,
            },
        ];
        console.log('  Adding test data with sentence-level embeddings...');
        for (const chunk of testChunks) {
            await sentence_embedding_service_1.default.processChunk(chunk.id, chunk.text, chunk.artifactId, chunk.offset, {
                patient_id: 'patient_123',
                artifact_type: 'progress_note',
                occurred_at: '2024-03-15T10:00:00Z',
            });
        }
        console.log('  Test data added\n');
        // Perform two-pass retrieval
        const query = 'diabetes glucose levels and medication';
        console.log(`  Query: "${query}"`);
        console.log('');
        // Generate query embedding
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        // Two-pass retrieval
        const results = await sentence_embedding_service_1.default.twoPassRetrieval(queryEmbedding, {
            chunkK: 3,
            sentenceK: 2,
            filters: {
                patientId: 'patient_123',
            },
        });
        console.log('  Results:');
        results.forEach((result, i) => {
            console.log(`\n    ${i + 1}. Score: ${result.score.toFixed(4)}`);
            console.log(`       Sentence ID: ${result.sentence_id}`);
            console.log(`       Chunk ID: ${result.chunk_id}`);
            console.log(`       Artifact ID: ${result.artifact_id}`);
            console.log(`       Offsets: [${result.absolute_offsets[0]}, ${result.absolute_offsets[1]}]`);
            console.log(`       Text: "${result.text.substring(0, 100)}..."`);
        });
        console.log('\n  ✅ Success\n');
        return results;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 6: Handling long sentences
 */
async function exampleLongSentences() {
    console.log('Example 6: Handling Long Sentences');
    console.log('-'.repeat(80));
    try {
        // Very long sentence that will be split
        const longText = `The patient, a 65-year-old male with a history of Type 2 Diabetes mellitus, hypertension, hyperlipidemia, and coronary artery disease status post percutaneous coronary intervention in 2018, presented to the emergency department with complaints of chest pain, shortness of breath, diaphoresis, and nausea, which started approximately 2 hours prior to arrival while he was at home watching television, and the pain was described as a pressure-like sensation in the center of his chest radiating to his left arm and jaw, associated with difficulty breathing and feeling lightheaded.`;
        const chunkId = 'chunk_008';
        console.log('  Input (very long sentence):');
        console.log(`  Length: ${longText.length} chars`);
        console.log('');
        // Segment (will split into multiple sentences)
        const sentences = sentence_embedding_service_1.default.segmentIntoSentences(longText, chunkId, 0);
        console.log(`  Split into ${sentences.length} sub-sentences:`);
        sentences.forEach((sentence, i) => {
            console.log(`\n    ${i + 1}. "${sentence.text.substring(0, 80)}..."`);
            console.log(`       Length: ${sentence.text.length} chars`);
            console.log(`       Offsets: [${sentence.char_offsets[0]}, ${sentence.char_offsets[1]}]`);
        });
        const stats = sentence_embedding_service_1.default.getSegmentationStats(sentences);
        console.log('\n  Statistics:');
        console.log(`    Average length: ${stats.averageLength} chars`);
        console.log(`    Max length: ${stats.maxLength} chars`);
        console.log('  ✅ Success\n');
        return sentences;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 7: Provenance tracking with absolute offsets
 */
async function exampleProvenanceTracking() {
    console.log('Example 7: Provenance Tracking with Absolute Offsets');
    console.log('-'.repeat(80));
    try {
        // Simulate a multi-chunk artifact
        const artifactText = `CLINICAL NOTE - 03/15/2024

Chief Complaint: Follow-up for diabetes management.

History of Present Illness: Patient is a 58-year-old male with Type 2 Diabetes mellitus, diagnosed in 2020. Reports good medication adherence with Metformin 1000mg twice daily. Recent home glucose readings range from 110-130 mg/dL fasting.

Assessment: Type 2 Diabetes mellitus, currently well-controlled. HbA1c target <7%.

Plan: Continue current medication regimen. Follow-up in 3 months with repeat HbA1c.`;
        // Split into chunks (simulated)
        const chunks = [
            {
                id: 'chunk_009',
                text: artifactText.substring(0, 150),
                offset: 0,
            },
            {
                id: 'chunk_010',
                text: artifactText.substring(150, 350),
                offset: 150,
            },
            {
                id: 'chunk_011',
                text: artifactText.substring(350),
                offset: 350,
            },
        ];
        const artifactId = 'artifact_007';
        console.log('  Artifact length: ${artifactText.length} chars');
        console.log(`  Split into ${chunks.length} chunks\n`);
        // Process each chunk with absolute offsets
        for (const chunk of chunks) {
            console.log(`  Processing ${chunk.id} (offset: ${chunk.offset})...`);
            const sentences = sentence_embedding_service_1.default.segmentIntoSentences(chunk.text, chunk.id, chunk.offset);
            console.log(`    Segmented into ${sentences.length} sentences`);
            // Show absolute offsets
            sentences.forEach((sentence, i) => {
                console.log(`      ${i + 1}. Absolute offsets: [${sentence.absolute_offsets[0]}, ${sentence.absolute_offsets[1]}]`);
                console.log(`         Text: "${sentence.text.substring(0, 60)}..."`);
            });
            // Embed and store
            const embeddings = await sentence_embedding_service_1.default.embedSentences(sentences, artifactId, {
                patient_id: 'patient_123',
                artifact_type: 'progress_note',
                occurred_at: '2024-03-15T10:00:00Z',
            });
            await sentence_embedding_service_1.default.storeSentenceEmbeddings(embeddings);
        }
        console.log('\n  ✅ All chunks processed with absolute offsets tracked\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('SENTENCE EMBEDDING SERVICE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await initializeServices();
        await exampleSentenceSegmentation();
        await exampleEmbedSentences();
        await exampleStoreSentenceEmbeddings();
        await exampleProcessChunk();
        await exampleTwoPassRetrieval();
        await exampleLongSentences();
        await exampleProvenanceTracking();
        // Clean up
        await metadata_db_service_1.default.disconnect();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
        await metadata_db_service_1.default.disconnect();
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=sentence-embedding.example.js.map