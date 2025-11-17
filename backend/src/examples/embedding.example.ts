/**
 * Embedding Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Single text embedding generation
 * - Batch embedding generation
 * - Caching behavior
 * - Rate limiting
 * - Error handling
 */

import embeddingService from '../services/embedding-factory.service';

/**
 * Example 1: Generate single embedding
 */
export async function exampleSingleEmbedding() {
  console.log('Example 1: Generate Single Embedding');
  console.log('-'.repeat(80));

  const text = 'Patient diagnosed with Type 2 Diabetes, prescribed Metformin 500mg twice daily.';

  try {
    const startTime = Date.now();
    const embedding = await embeddingService.generateEmbedding(text);
    const duration = Date.now() - startTime;

    console.log('  Text:', text);
    console.log('  Embedding Dimensions:', embedding.length);
    console.log('  First 5 values:', embedding.slice(0, 5));
    console.log('  Duration:', `${duration}ms`);
    console.log('  ✅ Success\n');

    return embedding;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 2: Generate embedding with caching
 */
export async function exampleCaching() {
  console.log('Example 2: Caching Behavior');
  console.log('-'.repeat(80));

  const text = 'Follow-up appointment scheduled for next week.';

  try {
    // First call (cache miss)
    console.log('  First call (should be cache miss):');
    const start1 = Date.now();
    const embedding1 = await embeddingService.generateEmbedding(text);
    const duration1 = Date.now() - start1;
    console.log('    Duration:', `${duration1}ms`);

    // Second call (cache hit)
    console.log('  Second call (should be cache hit):');
    const start2 = Date.now();
    const embedding2 = await embeddingService.generateEmbedding(text);
    const duration2 = Date.now() - start2;
    console.log('    Duration:', `${duration2}ms`);

    // Verify embeddings are identical
    const identical = JSON.stringify(embedding1) === JSON.stringify(embedding2);
    console.log('  Embeddings identical:', identical ? '✅' : '❌');
    console.log('  Cache speedup:', `${Math.round(duration1 / Math.max(duration2, 1))}x faster\n`);

    return { embedding1, embedding2 };
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 3: Batch embedding generation
 */
export async function exampleBatchEmbeddings() {
  console.log('Example 3: Batch Embedding Generation');
  console.log('-'.repeat(80));

  const texts = [
    'Patient prescribed Lisinopril 10mg for hypertension.',
    'Blood pressure reading: 140/90 mmHg.',
    'Patient reports dizziness and fatigue.',
    'Scheduled follow-up appointment in 2 weeks.',
    'Lab results show elevated cholesterol levels.',
  ];

  try {
    const startTime = Date.now();
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);
    const duration = Date.now() - startTime;

    console.log('  Number of texts:', texts.length);
    console.log('  Number of embeddings:', embeddings.length);
    console.log('  Embedding dimensions:', embeddings[0].length);
    console.log('  Total duration:', `${duration}ms`);
    console.log('  Average per embedding:', `${Math.round(duration / embeddings.length)}ms`);
    console.log('  ✅ Success\n');

    return embeddings;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 4: Large batch processing (automatic chunking)
 */
export async function exampleLargeBatch() {
  console.log('Example 4: Large Batch Processing (Automatic Chunking)');
  console.log('-'.repeat(80));

  // Create 250 texts (will be split into batches of 100)
  const texts = Array.from({ length: 250 }, (_, i) => `Medical note ${i + 1}: Patient condition stable.`);

  try {
    const startTime = Date.now();
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);
    const duration = Date.now() - startTime;

    console.log('  Number of texts:', texts.length);
    console.log('  Number of embeddings:', embeddings.length);
    console.log('  Expected batches:', Math.ceil(texts.length / 100));
    console.log('  Total duration:', `${duration}ms`);
    console.log('  Average per embedding:', `${Math.round(duration / embeddings.length)}ms`);
    console.log('  ✅ Success\n');

    return embeddings;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 5: Empty text handling
 */
export async function exampleEmptyText() {
  console.log('Example 5: Empty Text Handling');
  console.log('-'.repeat(80));

  try {
    await embeddingService.generateEmbedding('');
    console.log('  ❌ Should have thrown error\n');
  } catch (error) {
    console.log('  ✅ Correctly rejected empty text');
    console.log('  Error:', error instanceof Error ? error.message : error);
    console.log('');
  }
}

/**
 * Example 6: Batch with mixed content
 */
export async function exampleMixedBatch() {
  console.log('Example 6: Batch with Mixed Content');
  console.log('-'.repeat(80));

  const texts = [
    'Short note.',
    'This is a medium-length clinical note describing patient symptoms and treatment plan.',
    'Very long clinical note with extensive details about the patient\'s medical history, current medications, lab results, physical examination findings, differential diagnosis, and comprehensive treatment plan including medication adjustments, lifestyle modifications, and follow-up scheduling.',
  ];

  try {
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);

    console.log('  Processed texts:');
    texts.forEach((text, i) => {
      console.log(`    ${i + 1}. Length: ${text.length} chars, Embedding dims: ${embeddings[i].length}`);
    });
    console.log('  ✅ Success\n');

    return embeddings;
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    console.log('');
    throw error;
  }
}

/**
 * Example 7: Cache statistics
 */
export async function exampleCacheStats() {
  console.log('Example 7: Cache Statistics');
  console.log('-'.repeat(80));

  // Generate some embeddings
  const texts = ['Text 1', 'Text 2', 'Text 3', 'Text 4', 'Text 5'];
  await embeddingService.generateBatchEmbeddings(texts);

  // Get cache stats
  const stats = embeddingService.getCacheStats();

  console.log('  Cache size:', stats.size);
  console.log('  Max cache size:', stats.maxSize);
  console.log('  ✅ Success\n');

  return stats;
}

/**
 * Example 8: Clear cache
 */
export async function exampleClearCache() {
  console.log('Example 8: Clear Cache');
  console.log('-'.repeat(80));

  // Generate embeddings
  await embeddingService.generateEmbedding('Test text for caching');

  console.log('  Before clear:', embeddingService.getCacheStats().size, 'entries');

  // Clear cache
  embeddingService.clearCache();

  console.log('  After clear:', embeddingService.getCacheStats().size, 'entries');
  console.log('  ✅ Success\n');
}

/**
 * Example 9: Service configuration
 */
export async function exampleConfiguration() {
  console.log('Example 9: Service Configuration');
  console.log('-'.repeat(80));

  const config = embeddingService.getConfig();

  console.log('  Model:', config.model);
  console.log('  Dimensions:', config.dimensions);
  console.log('  Max batch size:', config.maxBatchSize);
  console.log('  Cache size:', config.cacheSize);
  console.log('  Cache TTL:', `${config.cacheTTL / 1000 / 60 / 60}h`);
  console.log('  Rate limit window:', `${config.rateLimitWindow / 1000}s`);
  console.log('  Rate limit max requests:', config.rateLimitMaxRequests);
  console.log('  Retry attempts:', config.retryAttempts);
  console.log('  Retry delay:', `${config.retryDelay}ms`);
  console.log('  ✅ Success\n');

  return config;
}

/**
 * Example 10: Real-world usage - embedding patient notes
 */
export async function exampleRealWorldUsage() {
  console.log('Example 10: Real-World Usage - Embedding Patient Notes');
  console.log('-'.repeat(80));

  const patientNotes = [
    {
      id: 'note_1',
      text: 'Patient presents with chest pain and shortness of breath. ECG shows ST elevation. Immediate cardiology consult ordered.',
    },
    {
      id: 'note_2',
      text: 'Follow-up visit for diabetes management. A1C improved from 8.5 to 7.2. Continue current medication regimen.',
    },
    {
      id: 'note_3',
      text: 'Annual physical examination. Blood pressure 120/80, weight 75kg, height 175cm. All vitals within normal range.',
    },
    {
      id: 'note_4',
      text: 'Patient reports persistent headaches and dizziness. Ordered CT scan to rule out neurological causes.',
    },
    {
      id: 'note_5',
      text: 'Post-operative check after appendectomy. Incision healing well, no signs of infection. Cleared for light activity.',
    },
  ];

  try {
    const startTime = Date.now();

    // Extract texts
    const texts = patientNotes.map((note) => note.text);

    // Generate embeddings
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);

    const duration = Date.now() - startTime;

    // Create note-embedding pairs
    const embeddedNotes = patientNotes.map((note, i) => ({
      id: note.id,
      text: note.text,
      embedding: embeddings[i],
      embeddingDimensions: embeddings[i].length,
    }));

    console.log('  Processed notes:', embeddedNotes.length);
    console.log('  Total duration:', `${duration}ms`);
    console.log('  Average per note:', `${Math.round(duration / embeddedNotes.length)}ms`);

    console.log('\n  Sample embedded note:');
    console.log('    ID:', embeddedNotes[0].id);
    console.log('    Text:', embeddedNotes[0].text.substring(0, 60) + '...');
    console.log('    Embedding dimensions:', embeddedNotes[0].embeddingDimensions);
    console.log('    First 3 embedding values:', embeddedNotes[0].embedding.slice(0, 3));

    console.log('  ✅ Success\n');

    return embeddedNotes;
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
  console.log('EMBEDDING SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    await exampleSingleEmbedding();
    await exampleCaching();
    await exampleBatchEmbeddings();
    // await exampleLargeBatch(); // Commented out to avoid long execution time
    await exampleEmptyText();
    await exampleMixedBatch();
    await exampleCacheStats();
    await exampleClearCache();
    await exampleConfiguration();
    await exampleRealWorldUsage();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
