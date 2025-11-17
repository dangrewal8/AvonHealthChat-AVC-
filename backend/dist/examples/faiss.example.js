"use strict";
/**
 * FAISS Vector Store Usage Examples
 *
 * Demonstrates:
 * - Index initialization (IndexFlatIP/IndexIVFFlat)
 * - Vector addition with normalization
 * - Similarity search
 * - Save/Load persistence
 * - Integration with embedding service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleInitializeSmall = exampleInitializeSmall;
exports.exampleGetStats = exampleGetStats;
exports.exampleAddVectors = exampleAddVectors;
exports.exampleSearch = exampleSearch;
exports.exampleSaveLoad = exampleSaveLoad;
exports.exampleEmbeddingIntegration = exampleEmbeddingIntegration;
exports.exampleBatchOperations = exampleBatchOperations;
exports.examplePerformanceBenchmark = examplePerformanceBenchmark;
exports.runAllExamples = runAllExamples;
const faiss_vector_store_service_1 = __importDefault(require("../services/faiss-vector-store.service"));
// import embeddingService from '../services/embedding-factory.service'; // Uncomment to use real embeddings (HIPAA-compliant)
/**
 * Example 1: Initialize FAISS index (small dataset)
 */
async function exampleInitializeSmall() {
    console.log('Example 1: Initialize FAISS Index (Small Dataset < 10K)');
    console.log('-'.repeat(80));
    try {
        // IndexFlatIP for exact search (< 10K vectors)
        await faiss_vector_store_service_1.default.initialize(1536);
        const stats = faiss_vector_store_service_1.default.getStats();
        console.log('  Index initialized:');
        console.log('    Type:', stats.indexType);
        console.log('    Dimension:', stats.dimension);
        console.log('    Total vectors:', stats.totalVectors);
        console.log('  ✅ Success\n');
        return stats;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 2: Get index statistics
 */
async function exampleGetStats() {
    console.log('Example 2: Get Index Statistics');
    console.log('-'.repeat(80));
    try {
        // Initialize index first
        await faiss_vector_store_service_1.default.reset(1536);
        const stats = faiss_vector_store_service_1.default.getStats();
        console.log('  Index statistics:');
        console.log('    Type:', stats.indexType);
        console.log('    Dimension:', stats.dimension);
        console.log('    Total vectors:', stats.totalVectors);
        console.log('    Initialized:', stats.isInitialized);
        console.log('  ✅ Success\n');
        return stats;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 3: Add vectors with metadata
 */
async function exampleAddVectors() {
    console.log('Example 3: Add Vectors with Metadata');
    console.log('-'.repeat(80));
    try {
        // Initialize index
        await faiss_vector_store_service_1.default.reset(1536);
        // Create sample vectors (random for demo)
        const vectors = [
            Array.from({ length: 1536 }, () => Math.random() - 0.5),
            Array.from({ length: 1536 }, () => Math.random() - 0.5),
            Array.from({ length: 1536 }, () => Math.random() - 0.5),
        ];
        const ids = ['doc_1', 'doc_2', 'doc_3'];
        const metadata = [
            { text: 'Patient diagnosed with Type 2 Diabetes', type: 'diagnosis' },
            { text: 'Blood pressure reading: 140/90 mmHg', type: 'vital_sign' },
            { text: 'Prescribed Metformin 500mg twice daily', type: 'medication' },
        ];
        // Add vectors
        await faiss_vector_store_service_1.default.addVectors(vectors, ids, metadata);
        const stats = faiss_vector_store_service_1.default.getStats();
        console.log('  Vectors added:');
        console.log('    Total vectors:', stats.totalVectors);
        console.log('    ID mappings:', stats.idMappings);
        console.log('    Metadata entries:', stats.metadataEntries);
        console.log('  ✅ Success\n');
        return stats;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 4: Search for similar vectors
 */
async function exampleSearch() {
    console.log('Example 4: Search for Similar Vectors');
    console.log('-'.repeat(80));
    try {
        // First add some vectors
        await faiss_vector_store_service_1.default.reset(1536);
        const vectors = Array.from({ length: 5 }, () => Array.from({ length: 1536 }, () => Math.random() - 0.5));
        const ids = ['note_1', 'note_2', 'note_3', 'note_4', 'note_5'];
        const metadata = [
            { text: 'Diabetes diagnosis and treatment', category: 'endocrine' },
            { text: 'Hypertension management', category: 'cardiovascular' },
            { text: 'Follow-up appointment scheduled', category: 'administrative' },
            { text: 'Blood sugar levels improved', category: 'endocrine' },
            { text: 'Medication dosage adjustment', category: 'pharmacy' },
        ];
        await faiss_vector_store_service_1.default.addVectors(vectors, ids, metadata);
        // Search using first vector as query (should return itself as top result)
        const queryVector = vectors[0];
        const results = await faiss_vector_store_service_1.default.search(queryVector, 3);
        console.log('  Search results (top 3):');
        results.forEach((result, i) => {
            console.log(`    ${i + 1}. ID: ${result.id}`);
            console.log(`       Score: ${result.score.toFixed(4)}`);
            console.log(`       Category: ${result.metadata?.category}`);
            console.log(`       Text: ${result.metadata?.text}`);
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
 * Example 5: Save and load index
 */
async function exampleSaveLoad() {
    console.log('Example 5: Save and Load Index');
    console.log('-'.repeat(80));
    try {
        // Create and populate index
        await faiss_vector_store_service_1.default.reset(1536);
        faiss_vector_store_service_1.default.setIndexPath('./data/faiss-test');
        const vectors = Array.from({ length: 3 }, () => Array.from({ length: 1536 }, () => Math.random() - 0.5));
        const ids = ['save_1', 'save_2', 'save_3'];
        const metadata = [
            { text: 'Test document 1' },
            { text: 'Test document 2' },
            { text: 'Test document 3' },
        ];
        await faiss_vector_store_service_1.default.addVectors(vectors, ids, metadata);
        console.log('  Before save:');
        const statsBefore = faiss_vector_store_service_1.default.getStats();
        console.log('    Total vectors:', statsBefore.totalVectors);
        // Save index
        await faiss_vector_store_service_1.default.save();
        // Reset and load
        await faiss_vector_store_service_1.default.reset();
        await faiss_vector_store_service_1.default.load();
        console.log('  After load:');
        const statsAfter = faiss_vector_store_service_1.default.getStats();
        console.log('    Total vectors:', statsAfter.totalVectors);
        console.log('    ID mappings:', statsAfter.idMappings);
        console.log('  ✅ Success\n');
        return { statsBefore, statsAfter };
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 6: Integration with embedding service
 */
async function exampleEmbeddingIntegration() {
    console.log('Example 6: Integration with Embedding Service');
    console.log('-'.repeat(80));
    try {
        // Initialize FAISS
        await faiss_vector_store_service_1.default.reset(1536);
        // Sample texts
        const texts = [
            'Patient diagnosed with Type 2 Diabetes mellitus',
            'Blood pressure reading shows hypertension',
            'Prescribed Metformin 500mg for diabetes management',
            'Follow-up appointment scheduled for next month',
            'Lab results indicate improved A1C levels',
        ];
        console.log('  Generating embeddings...');
        // NOTE: This requires valid OPENAI_KEY in .env
        // const embeddings = await embeddingService.generateBatchEmbeddings(texts);
        // For demo purposes, use random vectors
        const embeddings = texts.map(() => Array.from({ length: 1536 }, () => Math.random() - 0.5));
        console.log('  Adding vectors to FAISS...');
        const ids = texts.map((_, i) => `note_${i + 1}`);
        const metadata = texts.map((text, i) => ({
            text,
            index: i,
            timestamp: new Date().toISOString(),
        }));
        await faiss_vector_store_service_1.default.addVectors(embeddings, ids, metadata);
        // Search with query
        const query = 'diabetes treatment and medication';
        console.log('  Query:', query);
        console.log('  Generating query embedding...');
        // const queryEmbedding = await embeddingService.generateEmbedding(query);
        const queryEmbedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);
        const results = await faiss_vector_store_service_1.default.search(queryEmbedding, 3);
        console.log('  Top 3 results:');
        results.forEach((result, i) => {
            console.log(`    ${i + 1}. ${result.metadata.text}`);
            console.log(`       Score: ${result.score.toFixed(4)}`);
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
 * Example 7: Batch operations
 */
async function exampleBatchOperations() {
    console.log('Example 7: Batch Operations (Large Dataset)');
    console.log('-'.repeat(80));
    try {
        // Initialize index
        await faiss_vector_store_service_1.default.reset(1536);
        // Create 500 random vectors
        const batchSize = 100;
        const totalVectors = 500;
        console.log(`  Adding ${totalVectors} vectors in batches of ${batchSize}...`);
        for (let batch = 0; batch < totalVectors / batchSize; batch++) {
            const vectors = Array.from({ length: batchSize }, () => Array.from({ length: 1536 }, () => Math.random() - 0.5));
            const ids = Array.from({ length: batchSize }, (_, i) => `batch_${batch}_doc_${i + 1}`);
            const metadata = Array.from({ length: batchSize }, (_, i) => ({
                batch,
                index: i,
                text: `Document ${batch * batchSize + i + 1}`,
            }));
            await faiss_vector_store_service_1.default.addVectors(vectors, ids, metadata);
            console.log(`    Batch ${batch + 1}/${totalVectors / batchSize} complete`);
        }
        const stats = faiss_vector_store_service_1.default.getStats();
        console.log('  Final statistics:');
        console.log('    Total vectors:', stats.totalVectors);
        console.log('  ✅ Success\n');
        return stats;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 8: Performance benchmark
 */
async function examplePerformanceBenchmark() {
    console.log('Example 8: Performance Benchmark');
    console.log('-'.repeat(80));
    const numVectors = 1000;
    const vectors = Array.from({ length: numVectors }, () => Array.from({ length: 1536 }, () => Math.random() - 0.5));
    const ids = Array.from({ length: numVectors }, (_, i) => `perf_${i + 1}`);
    const queryVector = vectors[0];
    try {
        // Initialize and populate index
        console.log(`  Adding ${numVectors} vectors...`);
        await faiss_vector_store_service_1.default.reset(1536);
        await faiss_vector_store_service_1.default.addVectors(vectors, ids);
        // Benchmark search performance
        console.log('  Running search benchmarks...');
        const iterations = 100;
        const durations = [];
        for (let i = 0; i < iterations; i++) {
            const start = Date.now();
            await faiss_vector_store_service_1.default.search(queryVector, 10);
            durations.push(Date.now() - start);
        }
        const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        console.log('  Benchmark results:');
        console.log(`    Iterations: ${iterations}`);
        console.log(`    Average search time: ${avgDuration.toFixed(2)}ms`);
        console.log(`    Min search time: ${minDuration}ms`);
        console.log(`    Max search time: ${maxDuration}ms`);
        console.log('  ✅ Success\n');
        return { avgDuration, minDuration, maxDuration };
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
    console.log('FAISS VECTOR STORE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await exampleInitializeSmall();
        await exampleGetStats();
        await exampleAddVectors();
        await exampleSearch();
        await exampleSaveLoad();
        await exampleEmbeddingIntegration();
        // await exampleBatchOperations(); // Commented out - takes time
        // await examplePerformanceComparison(); // Commented out - requires many vectors
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
//# sourceMappingURL=faiss.example.js.map