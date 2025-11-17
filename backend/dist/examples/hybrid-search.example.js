"use strict";
/**
 * Hybrid Search Engine Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Adding documents with embeddings
 * - Semantic-only search (alpha=1.0)
 * - Keyword-only search (alpha=0.0)
 * - Balanced hybrid search (alpha=0.5)
 * - Metadata filtering (date, type, patient)
 * - Recency boosting
 * - Batch document insertion
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleAddDocuments = exampleAddDocuments;
exports.exampleSemanticSearch = exampleSemanticSearch;
exports.exampleKeywordSearch = exampleKeywordSearch;
exports.exampleBalancedSearch = exampleBalancedSearch;
exports.exampleFilteredSearch = exampleFilteredSearch;
exports.exampleRecencyBoost = exampleRecencyBoost;
exports.exampleAlphaComparison = exampleAlphaComparison;
exports.exampleRAGPipeline = exampleRAGPipeline;
exports.runAllExamples = runAllExamples;
const hybrid_search_service_1 = __importDefault(require("../services/hybrid-search.service"));
const embedding_factory_service_1 = __importDefault(require("../services/embedding-factory.service"));
const faiss_vector_store_service_1 = __importDefault(require("../services/faiss-vector-store.service"));
const metadata_db_service_1 = __importDefault(require("../services/metadata-db.service"));
const env_config_1 = __importDefault(require("../config/env.config"));
/**
 * Initialize all services
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
 * Example 1: Add documents to hybrid search index
 */
async function exampleAddDocuments() {
    console.log('Example 1: Add Documents to Hybrid Search Index');
    console.log('-'.repeat(80));
    try {
        // Sample clinical notes
        const clinicalNotes = [
            {
                chunk_id: 'chunk_hs_001',
                chunk_text: 'Patient diagnosed with Type 2 Diabetes mellitus. Started on Metformin 500mg twice daily. Blood glucose levels to be monitored weekly.',
                metadata: {
                    artifact_id: 'artifact_001',
                    patient_id: 'patient_123',
                    artifact_type: 'progress_note',
                    occurred_at: '2024-01-15T10:30:00Z',
                    author: 'Dr. Smith',
                    source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_001',
                },
            },
            {
                chunk_id: 'chunk_hs_002',
                chunk_text: 'Hemoglobin A1C: 7.2% (elevated, target <7%). Fasting glucose: 145 mg/dL. Patient adherence to medication regimen is good.',
                metadata: {
                    artifact_id: 'artifact_002',
                    patient_id: 'patient_123',
                    artifact_type: 'lab_result',
                    occurred_at: '2024-01-20T14:00:00Z',
                    author: 'Lab Tech Johnson',
                    source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_002',
                },
            },
            {
                chunk_id: 'chunk_hs_003',
                chunk_text: 'Blood pressure reading: 140/90 mmHg (stage 1 hypertension). Recommended lifestyle modifications including reduced sodium intake.',
                metadata: {
                    artifact_id: 'artifact_003',
                    patient_id: 'patient_123',
                    artifact_type: 'progress_note',
                    occurred_at: '2024-02-01T09:00:00Z',
                    author: 'Dr. Lee',
                    source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_003',
                },
            },
            {
                chunk_id: 'chunk_hs_004',
                chunk_text: 'Increased Metformin dosage to 1000mg twice daily due to suboptimal glucose control. Continue monitoring blood sugar levels.',
                metadata: {
                    artifact_id: 'artifact_004',
                    patient_id: 'patient_123',
                    artifact_type: 'medication_order',
                    occurred_at: '2024-02-15T11:30:00Z',
                    author: 'Dr. Smith',
                    source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_004',
                },
            },
            {
                chunk_id: 'chunk_hs_005',
                chunk_text: 'Patient reports improved energy levels and no hypoglycemic episodes. Blood glucose readings averaging 120 mg/dL over past two weeks.',
                metadata: {
                    artifact_id: 'artifact_005',
                    patient_id: 'patient_123',
                    artifact_type: 'progress_note',
                    occurred_at: '2024-03-01T13:00:00Z',
                    author: 'Dr. Smith',
                    source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_005',
                },
            },
        ];
        console.log(`  Generating embeddings for ${clinicalNotes.length} documents...`);
        // Generate embeddings
        const texts = clinicalNotes.map((note) => note.chunk_text);
        const embeddings = await embedding_factory_service_1.default.generateBatchEmbeddings(texts);
        // Create documents with embeddings
        const documents = clinicalNotes.map((note, i) => ({
            ...note,
            embedding: embeddings[i],
        }));
        console.log(`  Adding documents to hybrid search index...`);
        // Add to hybrid search engine
        await hybrid_search_service_1.default.addDocuments(documents);
        const stats = hybrid_search_service_1.default.getStats();
        console.log('  Index statistics:');
        console.log(`    Total documents: ${stats.totalDocuments}`);
        console.log(`    Total terms: ${stats.totalTerms}`);
        console.log(`    Avg document length: ${stats.averageDocLength.toFixed(1)} tokens`);
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 2: Semantic-only search (alpha=1.0)
 */
async function exampleSemanticSearch() {
    console.log('Example 2: Semantic-Only Search (alpha=1.0)');
    console.log('-'.repeat(80));
    try {
        const query = 'diabetes management and blood sugar control';
        console.log(`  Query: "${query}"`);
        // Generate query embedding
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        // Search with alpha=1.0 (100% semantic, 0% keyword)
        const options = {
            k: 3,
            alpha: 1.0,
            filters: {
                patientId: 'patient_123',
            },
            recencyBoost: false, // Disable for this example
        };
        const results = await hybrid_search_service_1.default.search(query, queryEmbedding, options);
        console.log('  Top 3 results:');
        results.forEach((result, i) => {
            console.log(`    ${i + 1}. Score: ${result.score.toFixed(4)}`);
            console.log(`       Semantic: ${result.semanticScore.toFixed(4)}, Keyword: ${result.keywordScore.toFixed(4)}`);
            console.log(`       Type: ${result.metadata.artifact_type}`);
            console.log(`       Date: ${result.metadata.occurred_at}`);
            console.log(`       Snippet: "${result.snippet}"`);
        });
        console.log('  ✅ Success\n');
        return results;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 3: Keyword-only search (alpha=0.0)
 */
async function exampleKeywordSearch() {
    console.log('Example 3: Keyword-Only Search (alpha=0.0)');
    console.log('-'.repeat(80));
    try {
        const query = 'Metformin 1000mg twice daily';
        console.log(`  Query: "${query}"`);
        // Generate query embedding (still needed for API)
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        // Search with alpha=0.0 (0% semantic, 100% keyword)
        const options = {
            k: 3,
            alpha: 0.0,
            filters: {
                patientId: 'patient_123',
            },
            recencyBoost: false,
        };
        const results = await hybrid_search_service_1.default.search(query, queryEmbedding, options);
        console.log('  Top 3 results:');
        results.forEach((result, i) => {
            console.log(`    ${i + 1}. Score: ${result.score.toFixed(4)}`);
            console.log(`       Semantic: ${result.semanticScore.toFixed(4)}, Keyword: ${result.keywordScore.toFixed(4)}`);
            console.log(`       Type: ${result.metadata.artifact_type}`);
            console.log(`       Date: ${result.metadata.occurred_at}`);
            console.log(`       Snippet: "${result.snippet}"`);
        });
        console.log('  ✅ Success\n');
        return results;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 4: Balanced hybrid search (alpha=0.5)
 */
async function exampleBalancedSearch() {
    console.log('Example 4: Balanced Hybrid Search (alpha=0.5)');
    console.log('-'.repeat(80));
    try {
        const query = 'patient glucose levels and medication';
        console.log(`  Query: "${query}"`);
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        // Balanced: 50% semantic, 50% keyword
        const options = {
            k: 5,
            alpha: 0.5,
            filters: {
                patientId: 'patient_123',
            },
            recencyBoost: false,
        };
        const results = await hybrid_search_service_1.default.search(query, queryEmbedding, options);
        console.log('  Top 5 results:');
        results.forEach((result, i) => {
            console.log(`    ${i + 1}. Score: ${result.score.toFixed(4)}`);
            console.log(`       Semantic: ${result.semanticScore.toFixed(4)}, Keyword: ${result.keywordScore.toFixed(4)}`);
            console.log(`       Type: ${result.metadata.artifact_type}`);
            console.log(`       Date: ${result.metadata.occurred_at}`);
            console.log(`       Snippet: "${result.snippet}"`);
        });
        console.log('  ✅ Success\n');
        return results;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 5: Search with metadata filters (date range + type)
 */
async function exampleFilteredSearch() {
    console.log('Example 5: Search with Metadata Filters');
    console.log('-'.repeat(80));
    try {
        const query = 'blood pressure hypertension';
        console.log(`  Query: "${query}"`);
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        const options = {
            k: 3,
            alpha: 0.7, // Favor semantic
            filters: {
                patientId: 'patient_123',
                dateFrom: '2024-01-01T00:00:00Z',
                dateTo: '2024-02-28T23:59:59Z',
                artifactTypes: ['progress_note', 'lab_result'],
            },
            recencyBoost: false,
        };
        console.log('  Filters:');
        console.log(`    Date range: ${options.filters?.dateFrom} to ${options.filters?.dateTo}`);
        console.log(`    Types: ${options.filters?.artifactTypes?.join(', ')}`);
        const results = await hybrid_search_service_1.default.search(query, queryEmbedding, options);
        console.log('  Results:');
        results.forEach((result, i) => {
            console.log(`    ${i + 1}. Score: ${result.score.toFixed(4)}`);
            console.log(`       Type: ${result.metadata.artifact_type}`);
            console.log(`       Date: ${result.metadata.occurred_at}`);
            console.log(`       Snippet: "${result.snippet}"`);
        });
        console.log('  ✅ Success\n');
        return results;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 6: Search with recency boosting
 */
async function exampleRecencyBoost() {
    console.log('Example 6: Search with Recency Boosting');
    console.log('-'.repeat(80));
    try {
        const query = 'patient condition and treatment';
        console.log(`  Query: "${query}"`);
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        // Search WITHOUT recency boost
        const optionsNoBoost = {
            k: 5,
            alpha: 0.6,
            filters: { patientId: 'patient_123' },
            recencyBoost: false,
        };
        const resultsNoBoost = await hybrid_search_service_1.default.search(query, queryEmbedding, optionsNoBoost);
        console.log('  Without recency boost:');
        resultsNoBoost.forEach((result, i) => {
            console.log(`    ${i + 1}. Score: ${result.score.toFixed(4)}, Date: ${result.metadata.occurred_at}`);
        });
        // Search WITH recency boost
        const optionsWithBoost = {
            k: 5,
            alpha: 0.6,
            filters: { patientId: 'patient_123' },
            recencyBoost: true,
        };
        const resultsWithBoost = await hybrid_search_service_1.default.search(query, queryEmbedding, optionsWithBoost);
        console.log('\n  With recency boost:');
        resultsWithBoost.forEach((result, i) => {
            console.log(`    ${i + 1}. Score: ${result.score.toFixed(4)}, Boost: ${result.recencyBoost.toFixed(3)}, Date: ${result.metadata.occurred_at}`);
        });
        console.log('  ✅ Success\n');
        return { resultsNoBoost, resultsWithBoost };
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 7: Compare different alpha values
 */
async function exampleAlphaComparison() {
    console.log('Example 7: Compare Different Alpha Values');
    console.log('-'.repeat(80));
    try {
        const query = 'diabetes medication treatment';
        console.log(`  Query: "${query}"`);
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        const alphas = [0.0, 0.3, 0.5, 0.7, 1.0];
        for (const alpha of alphas) {
            const options = {
                k: 3,
                alpha,
                filters: { patientId: 'patient_123' },
                recencyBoost: false,
            };
            const results = await hybrid_search_service_1.default.search(query, queryEmbedding, options);
            console.log(`\n  Alpha = ${alpha.toFixed(1)} (${Math.round(alpha * 100)}% semantic, ${Math.round((1 - alpha) * 100)}% keyword):`);
            results.forEach((result, i) => {
                console.log(`    ${i + 1}. Score: ${result.score.toFixed(4)}`);
                console.log(`       ID: ${result.chunk_id}`);
                console.log(`       Semantic: ${result.semanticScore.toFixed(4)}, Keyword: ${result.keywordScore.toFixed(4)}`);
            });
        }
        console.log('\n  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 8: Full RAG pipeline with hybrid search
 */
async function exampleRAGPipeline() {
    console.log('Example 8: Full RAG Pipeline with Hybrid Search');
    console.log('-'.repeat(80));
    try {
        const query = 'What is the current diabetes treatment plan for this patient?';
        console.log(`  Query: "${query}"`);
        // Step 1: Generate query embedding
        console.log('  Step 1: Generating query embedding...');
        const queryEmbedding = await embedding_factory_service_1.default.generateEmbedding(query);
        // Step 2: Hybrid search
        console.log('  Step 2: Performing hybrid search...');
        const options = {
            k: 5,
            alpha: 0.7, // Favor semantic understanding
            filters: {
                patientId: 'patient_123',
                artifactTypes: ['progress_note', 'medication_order', 'lab_result'],
            },
            recencyBoost: true, // Prioritize recent information
            snippetLength: 200,
        };
        const results = await hybrid_search_service_1.default.search(query, queryEmbedding, options);
        // Step 3: Build context for LLM
        console.log('  Step 3: Building RAG context...');
        const context = results
            .map((result, i) => {
            return `[${i + 1}] ${result.metadata.artifact_type} (${result.metadata.occurred_at})\n${result.snippet}`;
        })
            .join('\n\n---\n\n');
        console.log('\n  RAG Context:');
        console.log('  ' + '='.repeat(76));
        console.log(context
            .split('\n')
            .map((line) => '  ' + line)
            .join('\n'));
        console.log('  ' + '='.repeat(76));
        console.log('\n  Step 4: Context ready for LLM');
        console.log(`  Total chunks: ${results.length}`);
        console.log(`  Context length: ${context.length} characters`);
        console.log('  ✅ Success\n');
        return { results, context };
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
    console.log('HYBRID SEARCH ENGINE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await initializeServices();
        await exampleAddDocuments();
        await exampleSemanticSearch();
        await exampleKeywordSearch();
        await exampleBalancedSearch();
        await exampleFilteredSearch();
        await exampleRecencyBoost();
        await exampleAlphaComparison();
        await exampleRAGPipeline();
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
//# sourceMappingURL=hybrid-search.example.js.map