"use strict";
/**
 * Metadata Database Usage Examples
 *
 * Demonstrates:
 * - Database connection with pooling
 * - Batch chunk insertion
 * - Date range filtering
 * - Artifact type filtering
 * - Combined filtering
 * - Chunk retrieval
 * - Statistics queries
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleConnect = exampleConnect;
exports.exampleInsertChunks = exampleInsertChunks;
exports.exampleFilterByDateRange = exampleFilterByDateRange;
exports.exampleFilterByType = exampleFilterByType;
exports.exampleCombinedFiltering = exampleCombinedFiltering;
exports.exampleGetChunkById = exampleGetChunkById;
exports.exampleGetChunksByIds = exampleGetChunksByIds;
exports.exampleGetStats = exampleGetStats;
exports.exampleRAGPipeline = exampleRAGPipeline;
exports.exampleDeleteChunks = exampleDeleteChunks;
exports.runAllExamples = runAllExamples;
const metadata_db_service_1 = __importDefault(require("../services/metadata-db.service"));
const env_config_1 = __importDefault(require("../config/env.config"));
/**
 * Example 1: Connect to PostgreSQL database
 */
async function exampleConnect() {
    console.log('Example 1: Connect to PostgreSQL Database');
    console.log('-'.repeat(80));
    try {
        await metadata_db_service_1.default.connect({
            host: env_config_1.default.postgres.host,
            port: env_config_1.default.postgres.port,
            database: env_config_1.default.postgres.database,
            user: env_config_1.default.postgres.user,
            password: env_config_1.default.postgres.password,
            max: 20, // Connection pool size
            idleTimeoutMillis: 30000, // 30 seconds
            connectionTimeoutMillis: 10000, // 10 seconds
        });
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 2: Insert chunks (batch operation)
 */
async function exampleInsertChunks() {
    console.log('Example 2: Insert Chunks (Batch Operation)');
    console.log('-'.repeat(80));
    try {
        // Create sample chunks
        const chunks = [
            {
                chunk_id: 'chunk_001',
                artifact_id: 'artifact_001',
                patient_id: 'patient_123',
                artifact_type: 'progress_note',
                occurred_at: '2024-01-15T10:30:00Z',
                author: 'Dr. Smith',
                chunk_text: 'Patient diagnosed with Type 2 Diabetes mellitus. Started on Metformin 500mg twice daily.',
                char_offsets: [0, 91],
                source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_001',
            },
            {
                chunk_id: 'chunk_002',
                artifact_id: 'artifact_002',
                patient_id: 'patient_123',
                artifact_type: 'lab_result',
                occurred_at: '2024-01-20T14:00:00Z',
                author: 'Lab Tech',
                chunk_text: 'Hemoglobin A1C: 7.2% (elevated). Fasting glucose: 145 mg/dL.',
                char_offsets: [0, 61],
                source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_002',
            },
            {
                chunk_id: 'chunk_003',
                artifact_id: 'artifact_003',
                patient_id: 'patient_123',
                artifact_type: 'medication_order',
                occurred_at: '2024-02-01T09:00:00Z',
                author: 'Dr. Johnson',
                chunk_text: 'Increased Metformin dosage to 1000mg twice daily. Continue monitoring blood glucose.',
                char_offsets: [0, 85],
                source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_003',
            },
            {
                chunk_id: 'chunk_004',
                artifact_id: 'artifact_004',
                patient_id: 'patient_123',
                artifact_type: 'progress_note',
                occurred_at: '2024-02-15T11:30:00Z',
                author: 'Dr. Smith',
                chunk_text: 'Patient reports improved energy levels. Blood glucose readings averaging 120 mg/dL.',
                char_offsets: [0, 82],
                source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_004',
            },
            {
                chunk_id: 'chunk_005',
                artifact_id: 'artifact_005',
                patient_id: 'patient_456',
                artifact_type: 'progress_note',
                occurred_at: '2024-01-10T13:00:00Z',
                author: 'Dr. Lee',
                chunk_text: 'Annual physical examination. Blood pressure: 140/90 mmHg (stage 1 hypertension).',
                char_offsets: [0, 81],
                source_url: 'https://demo-api.avonhealth.com/artifacts/artifact_005',
            },
        ];
        await metadata_db_service_1.default.insertChunks(chunks);
        console.log('  ✅ Success\n');
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 3: Filter chunks by date range
 */
async function exampleFilterByDateRange() {
    console.log('Example 3: Filter Chunks by Date Range');
    console.log('-'.repeat(80));
    try {
        const patientId = 'patient_123';
        const fromDate = '2024-01-01T00:00:00Z';
        const toDate = '2024-01-31T23:59:59Z';
        const chunkIds = await metadata_db_service_1.default.filterByDateRange(patientId, fromDate, toDate);
        console.log('  Results:');
        console.log(`    Patient: ${patientId}`);
        console.log(`    Date range: ${fromDate} to ${toDate}`);
        console.log(`    Found: ${chunkIds.length} chunks`);
        console.log(`    Chunk IDs: ${chunkIds.join(', ')}`);
        console.log('  ✅ Success\n');
        return chunkIds;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 4: Filter chunks by artifact type
 */
async function exampleFilterByType() {
    console.log('Example 4: Filter Chunks by Artifact Type');
    console.log('-'.repeat(80));
    try {
        const patientId = 'patient_123';
        const types = ['progress_note', 'medication_order'];
        const chunkIds = await metadata_db_service_1.default.filterByType(patientId, types);
        console.log('  Results:');
        console.log(`    Patient: ${patientId}`);
        console.log(`    Types: ${types.join(', ')}`);
        console.log(`    Found: ${chunkIds.length} chunks`);
        console.log(`    Chunk IDs: ${chunkIds.join(', ')}`);
        console.log('  ✅ Success\n');
        return chunkIds;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 5: Combined filtering (date range + type)
 */
async function exampleCombinedFiltering() {
    console.log('Example 5: Combined Filtering (Date + Type)');
    console.log('-'.repeat(80));
    try {
        const chunkIds = await metadata_db_service_1.default.filterChunks({
            patientId: 'patient_123',
            fromDate: '2024-01-01T00:00:00Z',
            toDate: '2024-02-28T23:59:59Z',
            types: ['progress_note'],
            limit: 10,
        });
        console.log('  Results:');
        console.log(`    Found: ${chunkIds.length} chunks`);
        console.log(`    Chunk IDs: ${chunkIds.join(', ')}`);
        console.log('  ✅ Success\n');
        return chunkIds;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 6: Get chunk by ID
 */
async function exampleGetChunkById() {
    console.log('Example 6: Get Chunk by ID');
    console.log('-'.repeat(80));
    try {
        const chunkId = 'chunk_001';
        const chunk = await metadata_db_service_1.default.getChunkById(chunkId);
        if (chunk) {
            console.log('  Chunk found:');
            console.log(`    ID: ${chunk.chunk_id}`);
            console.log(`    Patient: ${chunk.patient_id}`);
            console.log(`    Type: ${chunk.artifact_type}`);
            console.log(`    Date: ${chunk.occurred_at}`);
            console.log(`    Author: ${chunk.author}`);
            console.log(`    Text: ${chunk.chunk_text.substring(0, 60)}...`);
        }
        else {
            console.log('  Chunk not found');
        }
        console.log('  ✅ Success\n');
        return chunk;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 7: Get multiple chunks by IDs (batch retrieval)
 */
async function exampleGetChunksByIds() {
    console.log('Example 7: Get Multiple Chunks by IDs (Batch)');
    console.log('-'.repeat(80));
    try {
        const chunkIds = ['chunk_001', 'chunk_002', 'chunk_003'];
        const chunks = await metadata_db_service_1.default.getChunksByIds(chunkIds);
        console.log('  Results:');
        console.log(`    Requested: ${chunkIds.length} chunks`);
        console.log(`    Retrieved: ${chunks.length} chunks`);
        chunks.forEach((chunk, i) => {
            console.log(`    ${i + 1}. ${chunk.chunk_id} - ${chunk.artifact_type} (${chunk.occurred_at})`);
        });
        console.log('  ✅ Success\n');
        return chunks;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 8: Get database statistics
 */
async function exampleGetStats() {
    console.log('Example 8: Get Database Statistics');
    console.log('-'.repeat(80));
    try {
        const stats = await metadata_db_service_1.default.getStats();
        console.log('  Statistics:');
        console.log(`    Total chunks: ${stats.totalChunks}`);
        console.log(`    Unique patients: ${stats.uniquePatients}`);
        console.log(`    Unique artifacts: ${stats.uniqueArtifacts}`);
        console.log('    Artifact types:');
        stats.artifactTypes.forEach((type) => {
            console.log(`      - ${type.type}: ${type.count}`);
        });
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
 * Example 9: RAG pipeline integration
 */
async function exampleRAGPipeline() {
    console.log('Example 9: RAG Pipeline Integration');
    console.log('-'.repeat(80));
    try {
        const patientId = 'patient_123';
        // Step 1: Filter chunks by date range and type
        console.log('  Step 1: Filter by metadata');
        const filteredChunkIds = await metadata_db_service_1.default.filterChunks({
            patientId,
            fromDate: '2024-01-01T00:00:00Z',
            toDate: '2024-12-31T23:59:59Z',
            types: ['progress_note', 'lab_result'],
        });
        console.log(`    Filtered to ${filteredChunkIds.length} chunks`);
        // Step 2: (Would normally) Perform vector search on filtered chunks
        console.log('  Step 2: Vector search (simulated)');
        console.log('    Query: "diabetes treatment"');
        console.log('    Vector search on filtered chunks only');
        // Simulate vector search returning top matches
        const topChunkIds = filteredChunkIds.slice(0, 3);
        console.log(`    Top ${topChunkIds.length} matches: ${topChunkIds.join(', ')}`);
        // Step 3: Retrieve full chunk data for top matches
        console.log('  Step 3: Retrieve full chunk data');
        const chunks = await metadata_db_service_1.default.getChunksByIds(topChunkIds);
        console.log('    Retrieved chunks for RAG context:');
        chunks.forEach((chunk, i) => {
            console.log(`      ${i + 1}. ${chunk.artifact_type} - ${chunk.occurred_at}`);
            console.log(`         "${chunk.chunk_text.substring(0, 70)}..."`);
        });
        console.log('  ✅ Success\n');
        return chunks;
    }
    catch (error) {
        console.error('  ❌ Error:', error instanceof Error ? error.message : error);
        console.log('');
        throw error;
    }
}
/**
 * Example 10: Delete chunks
 */
async function exampleDeleteChunks() {
    console.log('Example 10: Delete Chunks');
    console.log('-'.repeat(80));
    try {
        const chunkIds = ['chunk_001', 'chunk_002'];
        const deletedCount = await metadata_db_service_1.default.deleteChunks(chunkIds);
        console.log('  Results:');
        console.log(`    Requested deletion: ${chunkIds.length} chunks`);
        console.log(`    Deleted: ${deletedCount} chunks`);
        console.log('  ✅ Success\n');
        return deletedCount;
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
    console.log('METADATA DATABASE EXAMPLES');
    console.log('='.repeat(80));
    console.log('\n');
    try {
        await exampleConnect();
        await exampleInsertChunks();
        await exampleFilterByDateRange();
        await exampleFilterByType();
        await exampleCombinedFiltering();
        await exampleGetChunkById();
        await exampleGetChunksByIds();
        await exampleGetStats();
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
//# sourceMappingURL=metadata-db.example.js.map