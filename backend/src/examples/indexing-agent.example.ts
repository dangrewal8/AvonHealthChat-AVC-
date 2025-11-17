/**
 * Indexing Agent Service Usage Examples
 *
 * Demonstrates:
 * - Basic chunk indexing with progress tracking
 * - Batch indexing of multiple artifacts
 * - Reindexing artifacts
 * - Index statistics
 * - Error recovery
 * - Full pipeline integration
 */

import indexingAgent, {
  Chunk,
  IndexingProgress,
} from '../services/indexing-agent.service';
import faissVectorStore from '../services/faiss-vector-store.service';
import metadataDB from '../services/metadata-db.service';
import config from '../config/env.config';

/**
 * Initialize services
 */
async function initializeServices() {
  console.log('Initializing services...');

  // Initialize FAISS
  // Initialize FAISS (Ollama uses 768 dimensions for nomic-embed-text)
  await faissVectorStore.initialize(config.ollama.embeddingDimensions);

  // Connect to PostgreSQL
  await metadataDB.connect({
    host: config.postgres!.host,
    port: config.postgres!.port,
    database: config.postgres!.database,
    user: config.postgres!.user,
    password: config.postgres!.password,
  });

  // Initialize indexing agent
  await indexingAgent.initialize();

  console.log('✓ Services initialized\n');
}

/**
 * Example 1: Basic chunk indexing
 */
export async function exampleBasicIndexing() {
  console.log('Example 1: Basic Chunk Indexing');
  console.log('-'.repeat(80));

  try {
    // Sample chunks from a clinical note
    const chunks: Chunk[] = [
      {
        chunk_id: 'chunk_001',
        artifact_id: 'artifact_001',
        text: 'Patient presented to Dr. Smith\'s clinic on 01/15/2024. Chief complaint: Follow-up for Type 2 Diabetes mellitus. Patient reports good medication adherence with Metformin 1000mg twice daily.',
        chunk_index: 0,
        absolute_offset: 0,
        metadata: {
          patient_id: 'patient_123',
          artifact_type: 'progress_note',
          occurred_at: '2024-01-15T10:30:00Z',
          author: 'Dr. Smith',
        },
      },
      {
        chunk_id: 'chunk_002',
        artifact_id: 'artifact_001',
        text: 'Physical examination: Blood pressure 135/85 mmHg, heart rate 72 bpm. Patient appears well-nourished. No signs of acute distress.',
        chunk_index: 1,
        absolute_offset: 190,
        metadata: {
          patient_id: 'patient_123',
          artifact_type: 'progress_note',
          occurred_at: '2024-01-15T10:30:00Z',
          author: 'Dr. Smith',
        },
      },
      {
        chunk_id: 'chunk_003',
        artifact_id: 'artifact_001',
        text: 'Assessment: Type 2 Diabetes mellitus, currently well-controlled. HbA1c target < 7%. Plan: Continue current medication regimen. Follow-up in 3 months with repeat HbA1c.',
        chunk_index: 2,
        absolute_offset: 320,
        metadata: {
          patient_id: 'patient_123',
          artifact_type: 'progress_note',
          occurred_at: '2024-01-15T10:30:00Z',
          author: 'Dr. Smith',
        },
      },
    ];

    console.log(`  Indexing ${chunks.length} chunks...`);

    // Index chunks
    const result = await indexingAgent.indexChunks(chunks);

    console.log('\n  Results:');
    console.log(`    Success: ${result.success}`);
    console.log(`    Chunks indexed: ${result.chunksIndexed}`);
    console.log(`    Sentences indexed: ${result.sentencesIndexed}`);
    console.log(`    Chunk embeddings: ${result.chunkEmbeddingsGenerated}`);
    console.log(`    Sentence embeddings: ${result.sentenceEmbeddingsGenerated}`);
    console.log(`    Duration: ${result.duration}ms`);

    if (result.errors.length > 0) {
      console.log(`    Errors: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`      - ${error.chunk_id}: ${error.error}`);
      });
    }

    console.log('  ✅ Success\n');

    return result;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 2: Indexing with progress tracking
 */
export async function exampleProgressTracking() {
  console.log('Example 2: Indexing with Progress Tracking');
  console.log('-'.repeat(80));

  try {
    // Create larger batch of chunks
    const chunks: Chunk[] = [];
    for (let i = 0; i < 10; i++) {
      chunks.push({
        chunk_id: `chunk_${String(i).padStart(3, '0')}`,
        artifact_id: 'artifact_002',
        text: `This is chunk ${i} of the clinical note. It contains medical information about the patient's condition, treatment plan, and follow-up recommendations.`,
        chunk_index: i,
        absolute_offset: i * 150,
        metadata: {
          patient_id: 'patient_456',
          artifact_type: 'progress_note',
          occurred_at: '2024-02-01T14:00:00Z',
          author: 'Dr. Johnson',
        },
      });
    }

    console.log(`  Indexing ${chunks.length} chunks with progress tracking...`);
    console.log('');

    // Progress callback
    const progressCallback = (progress: IndexingProgress) => {
      const percent = progress.percentComplete.toFixed(0);
      const chunksProgress = `${progress.chunksProcessed}/${progress.chunksTotal}`;
      const sentencesProgress = `${progress.sentencesProcessed}/${progress.sentencesTotal}`;

      console.log(`  [${percent}%] Stage: ${progress.stage} | Chunks: ${chunksProgress} | Sentences: ${sentencesProgress}`);

      if (progress.currentChunk) {
        console.log(`    Processing: ${progress.currentChunk}`);
      }
    };

    // Index with progress tracking
    const result = await indexingAgent.indexChunks(chunks, progressCallback);

    console.log('');
    console.log('  Results:');
    console.log(`    Chunks indexed: ${result.chunksIndexed}`);
    console.log(`    Sentences indexed: ${result.sentencesIndexed}`);
    console.log(`    Total duration: ${result.duration}ms`);
    console.log('  ✅ Success\n');

    return result;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 3: Batch indexing multiple artifacts
 */
export async function exampleBatchIndexing() {
  console.log('Example 3: Batch Indexing Multiple Artifacts');
  console.log('-'.repeat(80));

  try {
    // Create chunks from multiple artifacts
    const artifacts = [
      {
        id: 'artifact_003',
        patientId: 'patient_789',
        type: 'lab_result',
        occurredAt: '2024-03-01T09:00:00Z',
        text: 'Lab Results: HbA1c 6.5%, Fasting Glucose 120 mg/dL, Total Cholesterol 180 mg/dL.',
      },
      {
        id: 'artifact_004',
        patientId: 'patient_789',
        type: 'medication_order',
        occurredAt: '2024-03-01T10:00:00Z',
        text: 'Medication Order: Metformin 1000mg PO BID, Atorvastatin 20mg PO QHS.',
      },
      {
        id: 'artifact_005',
        patientId: 'patient_789',
        type: 'progress_note',
        occurredAt: '2024-03-01T11:00:00Z',
        text: 'Patient follow-up visit. Reports good medication adherence. Blood pressure well-controlled at 125/80 mmHg.',
      },
    ];

    const allChunks: Chunk[] = artifacts.map((artifact, i) => ({
      chunk_id: `chunk_batch_${i}`,
      artifact_id: artifact.id,
      text: artifact.text,
      chunk_index: 0,
      absolute_offset: 0,
      metadata: {
        patient_id: artifact.patientId,
        artifact_type: artifact.type,
        occurred_at: artifact.occurredAt,
      },
    }));

    console.log(`  Indexing ${artifacts.length} artifacts (${allChunks.length} chunks)...`);

    const result = await indexingAgent.indexChunks(allChunks);

    console.log('\n  Results:');
    console.log(`    Artifacts indexed: ${artifacts.length}`);
    console.log(`    Chunks indexed: ${result.chunksIndexed}`);
    console.log(`    Sentences indexed: ${result.sentencesIndexed}`);
    console.log(`    Duration: ${result.duration}ms`);
    console.log('  ✅ Success\n');

    return result;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 4: Reindexing an artifact
 */
export async function exampleReindexing() {
  console.log('Example 4: Reindexing an Artifact');
  console.log('-'.repeat(80));

  try {
    const artifactId = 'artifact_001';

    console.log(`  Reindexing artifact: ${artifactId}...`);

    const result = await indexingAgent.reindexArtifact(artifactId);

    console.log('\n  Results:');
    console.log(`    Success: ${result.success}`);
    console.log(`    Chunks reindexed: ${result.chunksIndexed}`);
    console.log(`    Sentences reindexed: ${result.sentencesIndexed}`);
    console.log(`    Duration: ${result.duration}ms`);

    if (!result.success) {
      console.log(`    Errors:`);
      result.errors.forEach(error => {
        console.log(`      - ${error.chunk_id}: ${error.error}`);
      });
    }

    console.log('  ✅ Success\n');

    return result;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 5: Getting index statistics
 */
export async function exampleIndexStats() {
  console.log('Example 5: Index Statistics');
  console.log('-'.repeat(80));

  try {
    console.log('  Retrieving index statistics...');

    const stats = await indexingAgent.getIndexStats();

    console.log('\n  Index Statistics:');
    console.log('  ─────────────────');
    console.log(`    Total Chunks: ${stats.totalChunks}`);
    console.log(`    Total Sentences: ${stats.totalSentences}`);
    console.log(`    Chunk Embeddings: ${stats.totalChunkEmbeddings}`);
    console.log(`    Sentence Embeddings: ${stats.totalSentenceEmbeddings}`);
    console.log(`    Unique Patients: ${stats.patients}`);
    console.log(`    Unique Artifacts: ${stats.artifacts}`);
    console.log(`    Artifact Types: ${stats.artifactTypes.join(', ')}`);
    console.log(`    Date Range: ${stats.dateRange.earliest} to ${stats.dateRange.latest}`);
    console.log('\n  Storage:');
    console.log(`    Vector Store: ${stats.indexSize.vectorStore}`);
    console.log(`    Metadata: ${stats.indexSize.metadata}`);

    console.log('\n  ✅ Success\n');

    return stats;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 6: Error recovery
 */
export async function exampleErrorRecovery() {
  console.log('Example 6: Error Recovery');
  console.log('-'.repeat(80));

  try {
    // Include some invalid chunks to test error handling
    const chunks: Chunk[] = [
      {
        chunk_id: 'chunk_valid_001',
        artifact_id: 'artifact_006',
        text: 'This is a valid chunk with proper content.',
        chunk_index: 0,
        absolute_offset: 0,
        metadata: {
          patient_id: 'patient_999',
          artifact_type: 'progress_note',
          occurred_at: '2024-04-01T10:00:00Z',
        },
      },
      {
        chunk_id: 'chunk_invalid_001',
        artifact_id: 'artifact_006',
        text: '', // Empty text - will be filtered out
        chunk_index: 1,
        absolute_offset: 50,
        metadata: {
          patient_id: 'patient_999',
          artifact_type: 'progress_note',
          occurred_at: '2024-04-01T10:00:00Z',
        },
      },
      {
        chunk_id: 'chunk_valid_002',
        artifact_id: 'artifact_006',
        text: 'Another valid chunk that should be indexed successfully.',
        chunk_index: 2,
        absolute_offset: 100,
        metadata: {
          patient_id: 'patient_999',
          artifact_type: 'progress_note',
          occurred_at: '2024-04-01T10:00:00Z',
        },
      },
    ];

    console.log(`  Indexing ${chunks.length} chunks (including invalid ones)...`);

    const result = await indexingAgent.indexChunks(chunks);

    console.log('\n  Results:');
    console.log(`    Total chunks submitted: ${chunks.length}`);
    console.log(`    Chunks indexed: ${result.chunksIndexed}`);
    console.log(`    Success: ${result.success}`);

    if (result.errors.length > 0) {
      console.log(`\n  Errors encountered: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`    - ${error.chunk_id}: ${error.error}`);
      });
      console.log('\n  ℹ️  Pipeline continued despite errors (error recovery working)');
    }

    console.log('\n  ✅ Success\n');

    return result;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 7: Full pipeline integration
 */
export async function exampleFullPipeline() {
  console.log('Example 7: Full Pipeline Integration');
  console.log('-'.repeat(80));

  try {
    console.log('  Simulating full document processing pipeline...\n');

    // Step 1: Document ingestion
    console.log('  [1/5] Document Ingestion');
    const document = {
      id: 'artifact_007',
      patientId: 'patient_555',
      type: 'discharge_summary',
      occurredAt: '2024-05-01T16:00:00Z',
      author: 'Dr. Williams',
      content: `
DISCHARGE SUMMARY

Patient: John Doe (MRN: 12345)
Admission Date: 05/01/2024
Discharge Date: 05/05/2024

CHIEF COMPLAINT: Chest pain and shortness of breath

HISTORY OF PRESENT ILLNESS:
58-year-old male with history of Type 2 Diabetes mellitus and hypertension presented to ED with acute onset chest pain radiating to left arm. Patient reports pain started while climbing stairs.

HOSPITAL COURSE:
Patient was admitted for cardiac workup. EKG showed ST elevations. Troponin elevated at 0.8 ng/mL. Cardiac catheterization revealed 80% stenosis of LAD. Stent placed successfully.

DISCHARGE MEDICATIONS:
1. Aspirin 81mg daily
2. Clopidogrel 75mg daily
3. Metformin 1000mg twice daily
4. Lisinopril 10mg daily
5. Atorvastatin 40mg at bedtime

FOLLOW-UP:
Cardiology clinic in 2 weeks. PCP in 1 week. Repeat cardiac enzymes in 3 months.
      `.trim(),
    };

    console.log(`    Document ID: ${document.id}`);
    console.log(`    Type: ${document.type}`);
    console.log(`    Length: ${document.content.length} characters\n`);

    // Step 2: Chunking
    console.log('  [2/5] Chunking');
    const chunkSize = 200;
    const chunks: Chunk[] = [];
    let offset = 0;
    let chunkIndex = 0;

    while (offset < document.content.length) {
      const chunkText = document.content.slice(offset, offset + chunkSize);
      chunks.push({
        chunk_id: `${document.id}_chunk_${chunkIndex}`,
        artifact_id: document.id,
        text: chunkText,
        chunk_index: chunkIndex,
        absolute_offset: offset,
        metadata: {
          patient_id: document.patientId,
          artifact_type: document.type,
          occurred_at: document.occurredAt,
          author: document.author,
        },
      });

      offset += chunkSize;
      chunkIndex++;
    }

    console.log(`    Created ${chunks.length} chunks\n`);

    // Step 3: Indexing
    console.log('  [3/5] Indexing (Embeddings + Storage)');
    const progressCallback = (progress: IndexingProgress) => {
      if (progress.stage === 'complete') {
        console.log(`    ✓ Indexing complete (${progress.percentComplete}%)\n`);
      }
    };

    const result = await indexingAgent.indexChunks(chunks, progressCallback);

    console.log('  [4/5] Index Statistics');
    const stats = await indexingAgent.getIndexStats();
    console.log(`    Total chunks in index: ${stats.totalChunks}`);
    console.log(`    Total sentences in index: ${stats.totalSentences}\n`);

    // Step 5: Summary
    console.log('  [5/5] Pipeline Summary');
    console.log('  ────────────────────');
    console.log(`    Document processed: ${document.id}`);
    console.log(`    Chunks indexed: ${result.chunksIndexed}`);
    console.log(`    Sentences indexed: ${result.sentencesIndexed}`);
    console.log(`    Chunk embeddings: ${result.chunkEmbeddingsGenerated}`);
    console.log(`    Sentence embeddings: ${result.sentenceEmbeddingsGenerated}`);
    console.log(`    Total duration: ${result.duration}ms`);
    console.log(`    Success: ${result.success}`);

    console.log('\n  ✅ Full pipeline complete\n');

    return {
      document,
      chunks,
      result,
      stats,
    };
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('INDEXING AGENT SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    await initializeServices();
    await exampleBasicIndexing();
    await exampleProgressTracking();
    await exampleBatchIndexing();
    await exampleReindexing();
    await exampleIndexStats();
    await exampleErrorRecovery();
    await exampleFullPipeline();

    // Clean up
    await metadataDB.disconnect();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
    await metadataDB.disconnect();
  }
}

// Uncomment to run examples
// runAllExamples();
