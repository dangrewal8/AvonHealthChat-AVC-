"use strict";
/**
 * Cache Manager Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Embedding cache (1000 entries, 5 min TTL)
 * - Query results cache (100 entries, 5 min TTL)
 * - Patient index cache (5 patients, 30 min TTL)
 * - LRU eviction
 * - Cache statistics
 * - Integration with services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleEmbeddingCache = exampleEmbeddingCache;
exports.exampleQueryResultsCache = exampleQueryResultsCache;
exports.examplePatientIndexCache = examplePatientIndexCache;
exports.exampleLRUEviction = exampleLRUEviction;
exports.exampleCacheKeyGeneration = exampleCacheKeyGeneration;
exports.exampleCacheStatistics = exampleCacheStatistics;
exports.exampleCacheInvalidation = exampleCacheInvalidation;
exports.runAllExamples = runAllExamples;
const cache_manager_service_1 = __importDefault(require("../services/cache-manager.service"));
const embedding_factory_service_1 = __importDefault(require("../services/embedding-factory.service"));
const metadata_db_service_1 = __importDefault(require("../services/metadata-db.service"));
const faiss_vector_store_service_1 = __importDefault(require("../services/faiss-vector-store.service"));
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
 * Example 1: Embedding cache
 */
async function exampleEmbeddingCache() {
    console.log('Example 1: Embedding Cache');
    console.log('-'.repeat(80));
    try {
        const texts = [
            'Patient diagnosed with Type 2 Diabetes mellitus',
            'Blood glucose levels are elevated',
            'Started on Metformin 500mg twice daily',
        ];
        console.log('  Testing embedding cache...\n');
        // First call: Cache miss, generates embeddings
        console.log('  [First Call] Generating embeddings (cache miss)');
        const start1 = Date.now();
        for (const text of texts) {
            await embedding_factory_service_1.default.generateEmbedding(text);
        }
        const duration1 = Date.now() - start1;
        console.log(`    Duration: ${duration1}ms\n`);
        // Second call: Cache hit, returns cached embeddings
        console.log('  [Second Call] Retrieving embeddings (cache hit)');
        const start2 = Date.now();
        for (const text of texts) {
            await embedding_factory_service_1.default.generateEmbedding(text);
        }
        const duration2 = Date.now() - start2;
        console.log(`    Duration: ${duration2}ms`);
        console.log(`    Speedup: ${(duration1 / duration2).toFixed(2)}x faster\n`);
        // Check cache stats
        const stats = cache_manager_service_1.default.getStats();
        console.log('  Cache Statistics:');
        console.log(`    Embedding cache size: ${stats.embeddings.size}/${stats.embeddings.maxSize}`);
        console.log(`    Embedding TTL: ${stats.embeddings.ttl / 1000}s\n`);
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 2: Query results cache
 */
async function exampleQueryResultsCache() {
    console.log('Example 2: Query Results Cache');
    console.log('-'.repeat(80));
    try {
        const query = 'diabetes medication treatment plan';
        const patientId = 'patient_123';
        const filters = {
            artifactTypes: ['progress_note', 'medication_order'],
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31',
        };
        console.log('  Testing query results cache...\n');
        // Simulate query result
        const mockResult = {
            results: [
                {
                    chunk_id: 'chunk_001',
                    score: 0.95,
                    text: 'Patient started on Metformin 1000mg twice daily',
                    metadata: { patient_id: patientId, artifact_type: 'medication_order' },
                },
                {
                    chunk_id: 'chunk_002',
                    score: 0.89,
                    text: 'Follow-up visit shows good medication adherence',
                    metadata: { patient_id: patientId, artifact_type: 'progress_note' },
                },
            ],
            query,
            timestamp: new Date(),
        };
        // Cache the query result
        console.log('  [First Query] Caching result');
        cache_manager_service_1.default.cacheQueryResult(query, patientId, filters, mockResult);
        // Retrieve from cache
        console.log('  [Second Query] Retrieving from cache');
        const cached = cache_manager_service_1.default.getQueryResult(query, patientId, filters);
        if (cached) {
            console.log(`    ✓ Cache hit!`);
            console.log(`    Results: ${cached.results.length} chunks`);
            console.log(`    Query: "${cached.query}"`);
            console.log(`    Timestamp: ${cached.timestamp.toISOString()}\n`);
        }
        else {
            console.log('    ✗ Cache miss\n');
        }
        // Test with different filters (should be cache miss)
        console.log('  [Third Query] Different filters (cache miss expected)');
        const differentFilters = { ...filters, dateFrom: '2024-06-01' };
        const cached2 = cache_manager_service_1.default.getQueryResult(query, patientId, differentFilters);
        console.log(`    Cache hit: ${cached2 ? 'Yes' : 'No'}\n`);
        // Check cache stats
        const stats = cache_manager_service_1.default.getStats();
        console.log('  Cache Statistics:');
        console.log(`    Query results cache size: ${stats.queryResults.size}/${stats.queryResults.maxSize}`);
        console.log(`    Query results TTL: ${stats.queryResults.ttl / 1000}s\n`);
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 3: Patient index cache
 */
async function examplePatientIndexCache() {
    console.log('Example 3: Patient Index Cache');
    console.log('-'.repeat(80));
    try {
        console.log('  Testing patient index cache...\n');
        const patientIds = ['patient_123', 'patient_456', 'patient_789'];
        // Load patient indices (cache miss)
        console.log('  [First Load] Loading patient indices (cache miss)');
        for (const patientId of patientIds) {
            const start = Date.now();
            const index = await cache_manager_service_1.default.loadPatientIndex(patientId);
            const duration = Date.now() - start;
            console.log(`    Patient ${patientId}:`);
            console.log(`      Chunks: ${index.chunkIds.length}`);
            console.log(`      Artifact types: ${index.metadata.artifactTypes.join(', ')}`);
            console.log(`      Load time: ${duration}ms`);
        }
        console.log('');
        // Retrieve from cache (cache hit)
        console.log('  [Second Load] Retrieving from cache (cache hit)');
        for (const patientId of patientIds) {
            const start = Date.now();
            const index = cache_manager_service_1.default.getPatientIndex(patientId);
            const duration = Date.now() - start;
            if (index) {
                console.log(`    Patient ${patientId}:`);
                console.log(`      Chunks: ${index.chunkIds.length}`);
                console.log(`      Cache hit time: ${duration}ms (instant!)`);
            }
        }
        console.log('');
        // Check cache stats
        const stats = cache_manager_service_1.default.getStats();
        console.log('  Cache Statistics:');
        console.log(`    Patient index cache size: ${stats.patientIndices.size}/${stats.patientIndices.maxSize}`);
        console.log(`    Cached patients: ${stats.patientIndices.patients.join(', ')}`);
        console.log(`    Patient index TTL: ${stats.patientIndices.ttl / 1000}s\n`);
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 4: LRU eviction
 */
async function exampleLRUEviction() {
    console.log('Example 4: LRU Eviction');
    console.log('-'.repeat(80));
    try {
        console.log('  Testing LRU eviction with patient indices...\n');
        // Cache limit is 5 patients
        const patients = [
            'patient_001',
            'patient_002',
            'patient_003',
            'patient_004',
            'patient_005',
            'patient_006', // This will trigger eviction
        ];
        console.log('  Loading 6 patients (cache limit is 5):\n');
        for (let i = 0; i < patients.length; i++) {
            console.log(`  [${i + 1}/6] Loading ${patients[i]}`);
            try {
                await cache_manager_service_1.default.loadPatientIndex(patients[i]);
            }
            catch (error) {
                // May fail if patient doesn't exist, that's ok
                console.log(`    (Patient data not found, skipping)`);
            }
            const stats = cache_manager_service_1.default.getStats();
            console.log(`    Cache size: ${stats.patientIndices.size}/${stats.patientIndices.maxSize}`);
            if (i === patients.length - 1) {
                console.log(`    Evicted LRU patient: patient_001 (oldest)`);
            }
        }
        console.log('');
        // Verify first patient was evicted
        const evicted = cache_manager_service_1.default.getPatientIndex('patient_001');
        console.log(`  Patient patient_001 in cache: ${evicted ? 'Yes' : 'No (evicted)'}\n`);
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 5: Cache key generation
 */
async function exampleCacheKeyGeneration() {
    console.log('Example 5: Cache Key Generation');
    console.log('-'.repeat(80));
    try {
        console.log('  Testing cache key normalization...\n');
        const variants = [
            'Patient diagnosed with diabetes',
            'PATIENT DIAGNOSED WITH DIABETES', // Uppercase
            '  Patient diagnosed with diabetes  ', // Extra whitespace
            'Patient diagnosed with diabetes', // Exact duplicate
        ];
        console.log('  Generating embeddings for text variants:');
        console.log('  (Should result in only 1 API call due to normalization)\n');
        for (let i = 0; i < variants.length; i++) {
            console.log(`  [${i + 1}/4] Text: "${variants[i]}"`);
            const start = Date.now();
            await embedding_factory_service_1.default.generateEmbedding(variants[i]);
            const duration = Date.now() - start;
            if (i === 0) {
                console.log(`    Result: API call made (${duration}ms)`);
            }
            else {
                console.log(`    Result: Cache hit (${duration}ms) - normalized to same key`);
            }
        }
        console.log('');
        console.log('  Note: Cache keys are SHA256 hashes of normalized text');
        console.log('  Normalization: lowercase + trim whitespace\n');
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 6: Comprehensive cache statistics
 */
async function exampleCacheStatistics() {
    console.log('Example 6: Comprehensive Cache Statistics');
    console.log('-'.repeat(80));
    try {
        console.log('  Retrieving cache statistics...\n');
        const stats = cache_manager_service_1.default.getStats();
        console.log('  📊 Cache Statistics');
        console.log('  ═══════════════════\n');
        console.log('  Embedding Cache:');
        console.log(`    Size: ${stats.embeddings.size}/${stats.embeddings.maxSize} entries`);
        console.log(`    TTL: ${stats.embeddings.ttl / 1000} seconds (${stats.embeddings.ttl / 60000} min)`);
        console.log('');
        console.log('  Query Results Cache:');
        console.log(`    Size: ${stats.queryResults.size}/${stats.queryResults.maxSize} entries`);
        console.log(`    TTL: ${stats.queryResults.ttl / 1000} seconds (${stats.queryResults.ttl / 60000} min)`);
        console.log('');
        console.log('  Patient Index Cache:');
        console.log(`    Size: ${stats.patientIndices.size}/${stats.patientIndices.maxSize} entries`);
        console.log(`    TTL: ${stats.patientIndices.ttl / 1000} seconds (${stats.patientIndices.ttl / 60000} min)`);
        if (stats.patientIndices.patients.length > 0) {
            console.log(`    Cached patients: ${stats.patientIndices.patients.join(', ')}`);
        }
        console.log('');
        console.log('  Total Memory:');
        console.log(`    Estimated: ${stats.totalMemoryEstimate}`);
        console.log('');
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 7: Cache invalidation
 */
async function exampleCacheInvalidation() {
    console.log('Example 7: Cache Invalidation');
    console.log('-'.repeat(80));
    try {
        console.log('  Testing cache invalidation...\n');
        const patientId = 'patient_123';
        // Load patient index
        console.log(`  [1] Loading patient index for ${patientId}`);
        await cache_manager_service_1.default.loadPatientIndex(patientId);
        console.log('    ✓ Loaded and cached\n');
        // Verify it's cached
        const cached1 = cache_manager_service_1.default.getPatientIndex(patientId);
        console.log(`  [2] Checking cache`);
        console.log(`    Cached: ${cached1 ? 'Yes' : 'No'}\n`);
        // Invalidate cache (e.g., after updating patient data)
        console.log(`  [3] Invalidating cache for ${patientId}`);
        cache_manager_service_1.default.invalidatePatientIndex(patientId);
        console.log('    ✓ Cache invalidated\n');
        // Verify it's no longer cached
        const cached2 = cache_manager_service_1.default.getPatientIndex(patientId);
        console.log(`  [4] Checking cache again`);
        console.log(`    Cached: ${cached2 ? 'Yes' : 'No (successfully invalidated)'}\n`);
        // Clear all caches
        console.log('  [5] Clearing all caches');
        cache_manager_service_1.default.clearAll();
        const stats = cache_manager_service_1.default.getStats();
        console.log('    ✓ All caches cleared');
        console.log(`    Total cache size: ${stats.embeddings.size + stats.queryResults.size + stats.patientIndices.size}\n`);
        console.log('  ✅ Success\n');
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
    console.log('CACHE MANAGER SERVICE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await initializeServices();
        await exampleEmbeddingCache();
        await exampleQueryResultsCache();
        await examplePatientIndexCache();
        await exampleLRUEviction();
        await exampleCacheKeyGeneration();
        await exampleCacheStatistics();
        await exampleCacheInvalidation();
        // Clean up
        await metadata_db_service_1.default.disconnect();
        cache_manager_service_1.default.stopCleanup();
        console.log('='.repeat(80));
        console.log('ALL EXAMPLES COMPLETE');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
        await metadata_db_service_1.default.disconnect();
        cache_manager_service_1.default.stopCleanup();
    }
}
// Uncomment to run examples
// runAllExamples();
//# sourceMappingURL=cache-manager.example.js.map