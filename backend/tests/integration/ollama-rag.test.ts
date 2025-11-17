/**
 * Ollama RAG Integration Test Suite
 *
 * Comprehensive integration tests for the Ollama-powered RAG system.
 * Tests embedding generation, LLM generation, vector search, and end-to-end RAG pipeline.
 *
 * Prerequisites:
 *   - Ollama running: ollama serve
 *   - Models installed: ollama pull meditron && ollama pull nomic-embed-text
 *   - Environment: EMBEDDING_PROVIDER=ollama, LLM_PROVIDER=ollama
 *
 * Run: npm test -- ollama-rag.test.ts
 */

import embeddingService, { getProviderInfo as getEmbeddingProviderInfo } from '../../src/services/embedding-factory.service';
import llmService, { getProviderInfo as getLLMProviderInfo } from '../../src/services/llm-factory.service';
import faissVectorStore from '../../src/services/faiss-vector-store.service';
import medicalPromptTemplates from '../../src/services/medical-prompt-templates.service';
import { ClinicalEntityType } from '../../src/services/medical-prompt-templates.service';

// Test timeout (2 minutes for entire suite)
jest.setTimeout(120000);

/**
 * Sample medical records for testing
 */
const SAMPLE_MEDICAL_RECORDS = [
  {
    id: 'record_001',
    type: 'medication',
    patient_id: 'patient_test_001',
    text: 'Metformin 500mg PO BID - Started 2024-01-15 for Type 2 Diabetes Mellitus. Patient tolerating well, no GI side effects reported. HbA1c target <7%.',
    occurred_at: '2024-01-15T10:00:00Z',
    title: 'Metformin Prescription'
  },
  {
    id: 'record_002',
    type: 'care_plan',
    patient_id: 'patient_test_001',
    text: 'Diabetes Management Plan: Patient is a 55-year-old male with newly diagnosed Type 2 DM. Baseline HbA1c 8.2%. Plan: (1) Start metformin 500mg BID, titrate to 1000mg BID over 4 weeks. (2) Diabetes education scheduled. (3) Home glucose monitoring QID initially. (4) Follow-up in 2 weeks for medication tolerance, then monthly x3 for glycemic control assessment. (5) Baseline labs: Cr 0.9, eGFR >60, normal LFTs. (6) Referral to ophthalmology for diabetic retinopathy screening.',
    occurred_at: '2024-01-15T11:00:00Z',
    title: 'Diabetes Care Plan'
  },
  {
    id: 'record_003',
    type: 'note',
    patient_id: 'patient_test_001',
    text: 'Follow-up Visit - 2024-02-15: Patient reports good medication compliance with metformin 500mg BID. No hypoglycemic episodes. Fasting glucose logs show improvement, average 140 mg/dL (down from 180s). Mild GI upset first week, now resolved. No lower extremity edema. Blood pressure 128/82. Weight stable. Plan: Continue current dose for 2 more weeks, then increase to 1000mg BID. Repeat HbA1c in 6 weeks.',
    occurred_at: '2024-02-15T14:30:00Z',
    title: 'Follow-up Note'
  },
  {
    id: 'record_004',
    type: 'medication',
    patient_id: 'patient_test_001',
    text: 'Lisinopril 10mg PO daily - Started 2024-03-01 for hypertension (Stage 1). Blood pressure readings consistently 135-140/85-90. Patient has no history of ACE inhibitor use. Baseline Cr 0.9, K+ 4.1. Follow-up BP check in 2 weeks. Target BP <130/80.',
    occurred_at: '2024-03-01T09:00:00Z',
    title: 'Lisinopril Prescription'
  },
  {
    id: 'record_005',
    type: 'note',
    patient_id: 'patient_test_001',
    text: 'Lab Results - 2024-03-15: HbA1c 7.1% (improved from 8.2%). Fasting glucose 128 mg/dL. Creatinine 0.9, eGFR >60. Lipid panel: Total cholesterol 195, LDL 118, HDL 42, Triglycerides 175. Liver function tests normal. Urinalysis: trace protein, no glucose. Assessment: Excellent glycemic improvement with metformin monotherapy. Blood pressure control improving on lisinopril. Continue current regimen.',
    occurred_at: '2024-03-15T08:00:00Z',
    title: 'Lab Results Review'
  }
];

/**
 * Sample queries for testing
 */
const SAMPLE_QUERIES = {
  simple: {
    query: "What medications is the patient currently taking?",
    expectedKeywords: ['metformin', 'lisinopril'],
    expectedCitations: true
  },
  complex: {
    query: "Summarize the patient's diabetes management progress and treatment response",
    expectedKeywords: ['HbA1c', 'metformin', 'improved', 'glucose'],
    expectedCitations: true
  },
  temporal: {
    query: "What changes were made to the patient's treatment in the last month?",
    expectedKeywords: ['lisinopril', 'hypertension', 'March'],
    expectedCitations: true
  },
  multiDocument: {
    query: "What are the current medication doses and indications?",
    expectedKeywords: ['metformin', '500mg', 'diabetes', 'lisinopril', '10mg', 'hypertension'],
    expectedCitations: true
  }
};

describe('Ollama RAG Integration Tests', () => {
  let embeddingDimension: number;
  let testVectorIds: string[] = [];

  // Setup: Check Ollama availability before running tests
  beforeAll(async () => {
    try {
      // Verify embedding provider
      const embeddingInfo = await getEmbeddingProviderInfo();
      expect(embeddingInfo.provider).toBe('ollama');
      embeddingDimension = embeddingInfo.dimensions;

      // Verify LLM provider
      const llmInfo = await getLLMProviderInfo();
      expect(llmInfo.provider).toBe('ollama');

      // Initialize FAISS for testing
      await faissVectorStore.initialize(embeddingDimension);

      console.log('\n✅ Ollama Integration Test Setup Complete');
      console.log(`   Embedding Model: ${embeddingInfo.model} (${embeddingDimension}D)`);
      console.log(`   LLM Model: ${llmInfo.model}`);
    } catch (error) {
      console.error('\n❌ Ollama Setup Failed:', error);
      throw new Error(
        'Ollama not available. Please ensure: (1) Ollama is running (ollama serve), ' +
        '(2) Models are installed (ollama pull meditron && ollama pull nomic-embed-text), ' +
        '(3) Environment variables are set (EMBEDDING_PROVIDER=ollama, LLM_PROVIDER=ollama)'
      );
    }
  });

  // Cleanup: Remove test vectors
  afterAll(async () => {
    // FAISS is in-memory for tests, no cleanup needed
    console.log('\n✅ Ollama Integration Tests Complete');
  });

  describe('1. Embedding Generation', () => {
    test('should generate single embedding with correct dimensions', async () => {
      const text = 'Patient has Type 2 Diabetes Mellitus';
      const startTime = Date.now();

      const embedding = await embeddingService.generateEmbedding(text);
      const duration = Date.now() - startTime;

      // Assertions
      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(embeddingDimension);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);

      // Performance check
      expect(duration).toBeLessThan(2000); // < 2s for single embedding

      console.log(`   ✓ Single embedding: ${embedding.length}D in ${duration}ms`);
    });

    test('should generate batch embeddings efficiently', async () => {
      const texts = SAMPLE_MEDICAL_RECORDS.map(record => record.text);
      const startTime = Date.now();

      const embeddings = await embeddingService.generateBatchEmbeddings(texts);
      const duration = Date.now() - startTime;

      // Assertions
      expect(embeddings).toBeDefined();
      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBe(texts.length);
      expect(embeddings.every(emb => emb.length === embeddingDimension)).toBe(true);

      // Performance check
      const avgTimePerEmbedding = duration / texts.length;
      expect(avgTimePerEmbedding).toBeLessThan(1000); // < 1s per embedding on average

      console.log(`   ✓ Batch embeddings: ${embeddings.length} x ${embeddingDimension}D in ${duration}ms (${avgTimePerEmbedding.toFixed(0)}ms avg)`);
    });

    test('should generate consistent embeddings for same text', async () => {
      const text = 'Metformin 500mg twice daily';

      const embedding1 = await embeddingService.generateEmbedding(text);
      const embedding2 = await embeddingService.generateEmbedding(text);

      // Calculate cosine similarity
      const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
      const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
      const similarity = dotProduct / (magnitude1 * magnitude2);

      // Should be nearly identical (> 0.99 similarity)
      expect(similarity).toBeGreaterThan(0.99);

      console.log(`   ✓ Embedding consistency: ${similarity.toFixed(6)} similarity`);
    });

    test('should handle empty or invalid text gracefully', async () => {
      // Empty string should still generate embedding
      const emptyEmbedding = await embeddingService.generateEmbedding('');
      expect(emptyEmbedding.length).toBe(embeddingDimension);

      // Very long text should be truncated/handled
      const longText = 'medical text '.repeat(1000);
      const longEmbedding = await embeddingService.generateEmbedding(longText);
      expect(longEmbedding.length).toBe(embeddingDimension);

      console.log(`   ✓ Edge case handling: empty and long text`);
    });
  });

  describe('2. LLM Generation', () => {
    test('should generate medical Q&A response with citations', async () => {
      const context = SAMPLE_MEDICAL_RECORDS.slice(0, 3).map((record, idx) =>
        `[record_${idx + 1}]\n${record.text}`
      );

      const prompt = medicalPromptTemplates.medicalQA(
        "What medications is the patient taking?",
        context,
        { requireCitations: true, requireConfidenceLevel: true }
      );

      const startTime = Date.now();
      const response = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 300 });
      const duration = Date.now() - startTime;

      // Assertions
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(50);
      expect(response.toLowerCase()).toContain('metformin');

      // Check for citations (should reference records)
      const hasCitation = /\[record_\d+\]/.test(response) || /record_\d+/.test(response);
      expect(hasCitation).toBe(true);

      // Performance check
      expect(duration).toBeLessThan(5000); // < 5s for LLM response

      console.log(`   ✓ Medical Q&A: ${response.length} chars in ${duration}ms`);
      console.log(`   ✓ Citations present: ${hasCitation}`);
    });

    test('should extract clinical entities in JSON format', async () => {
      const medicalText = SAMPLE_MEDICAL_RECORDS[0].text;

      const prompt = medicalPromptTemplates.extractClinicalEntities(
        medicalText,
        [ClinicalEntityType.MEDICATION, ClinicalEntityType.DIAGNOSIS]
      );

      const response = await llmService.generate(prompt, { temperature: 0.0, maxTokens: 500 });

      // Should be valid JSON
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch {
        // Sometimes LLM adds extra text, try to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      expect(parsed).toBeDefined();
      expect(parsed.medications || parsed.entities).toBeDefined();

      console.log(`   ✓ Entity extraction: JSON format validated`);
    });

    test('should handle various temperature settings', async () => {
      const context = [SAMPLE_MEDICAL_RECORDS[1].text];
      const prompt = medicalPromptTemplates.medicalQA(
        "Summarize the care plan",
        context,
        { requireCitations: false }
      );

      // Temperature 0.0 (deterministic)
      const response1 = await llmService.generate(prompt, { temperature: 0.0, maxTokens: 200 });
      const response2 = await llmService.generate(prompt, { temperature: 0.0, maxTokens: 200 });

      // Should be very similar (deterministic at temp=0)
      const similarity = response1.substring(0, 100) === response2.substring(0, 100);
      expect(similarity).toBe(true);

      // Temperature 0.3 (more creative)
      const response3 = await llmService.generate(prompt, { temperature: 0.3, maxTokens: 200 });
      expect(response3.length).toBeGreaterThan(50);

      console.log(`   ✓ Temperature control: temp=0.0 deterministic, temp=0.3 creative`);
    });

    test('should handle max token limits', async () => {
      const context = SAMPLE_MEDICAL_RECORDS.map((record, idx) =>
        `[record_${idx + 1}]\n${record.text}`
      );

      const prompt = medicalPromptTemplates.medicalQA(
        "Provide a comprehensive summary of all medical records",
        context
      );

      // Generate with small token limit
      const shortResponse = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 100 });
      expect(shortResponse.length).toBeLessThan(600); // Rough char estimate

      // Generate with larger token limit
      const longResponse = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 500 });
      expect(longResponse.length).toBeGreaterThan(shortResponse.length);

      console.log(`   ✓ Token limits: short=${shortResponse.length} chars, long=${longResponse.length} chars`);
    });
  });

  describe('3. Vector Search with Ollama Embeddings', () => {
    beforeAll(async () => {
      // Index all sample medical records
      const texts = SAMPLE_MEDICAL_RECORDS.map(r => r.text);
      const ids = SAMPLE_MEDICAL_RECORDS.map(r => r.id);
      const metadata = SAMPLE_MEDICAL_RECORDS.map(r => ({
        type: r.type,
        patient_id: r.patient_id,
        title: r.title
      }));

      const embeddings = await embeddingService.generateBatchEmbeddings(texts);
      await faissVectorStore.addVectors(embeddings, ids, metadata);

      testVectorIds = ids;
      console.log(`\n   ✓ Indexed ${ids.length} medical records for search tests`);
    });

    test('should find relevant documents for medication query', async () => {
      const query = "What diabetes medications is the patient on?";
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const startTime = Date.now();
      const results = await faissVectorStore.search(queryEmbedding, 3);
      const duration = Date.now() - startTime;

      // Assertions
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);

      // Top result should be medication-related
      const topResult = results[0];
      expect(topResult.metadata?.type).toMatch(/medication|care_plan/);

      // Performance check
      expect(duration).toBeLessThan(100); // < 100ms for vector search

      console.log(`   ✓ Medication query: ${results.length} results in ${duration}ms`);
      console.log(`   ✓ Top result: ${topResult.id} (score: ${topResult.score.toFixed(4)})`);
    });

    test('should rank results by relevance', async () => {
      const query = "HbA1c and lab results";
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await faissVectorStore.search(queryEmbedding, 5);

      // Scores should be descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }

      // Top result should be record_005 (lab results)
      expect(results[0].id).toBe('record_005');

      console.log(`   ✓ Result ranking: scores descending from ${results[0].score.toFixed(4)} to ${results[results.length - 1].score.toFixed(4)}`);
    });

    test('should handle queries with no good matches', async () => {
      const query = "Patient's history of appendectomy and surgical complications";
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await faissVectorStore.search(queryEmbedding, 3);

      // Should still return results, but with lower scores
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThan(0.8); // Lower similarity

      console.log(`   ✓ Low-match query: best score ${results[0].score.toFixed(4)}`);
    });

    test('should filter by metadata', async () => {
      const query = "medications";
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const results = await faissVectorStore.search(queryEmbedding, 5);

      // Check that medication records are prioritized
      const medicationResults = results.filter(r => r.metadata?.type === 'medication');
      expect(medicationResults.length).toBeGreaterThan(0);

      console.log(`   ✓ Metadata filtering: ${medicationResults.length}/${results.length} medication records`);
    });
  });

  describe('4. End-to-End RAG Pipeline', () => {
    test('should answer simple factual query', async () => {
      const { query, expectedKeywords } = SAMPLE_QUERIES.simple;

      // Step 1: Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Step 2: Retrieve relevant documents
      const searchResults = await faissVectorStore.search(queryEmbedding, 3);
      expect(searchResults.length).toBeGreaterThan(0);

      // Step 3: Prepare context
      const context = searchResults.map((result, idx) => {
        const record = SAMPLE_MEDICAL_RECORDS.find(r => r.id === result.id);
        return `[${record?.id}]\n${record?.text}`;
      });

      // Step 4: Generate response with LLM
      const prompt = medicalPromptTemplates.medicalQA(query, context, {
        requireCitations: true,
        requireConfidenceLevel: true
      });

      const startTime = Date.now();
      const response = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 300 });
      const totalDuration = Date.now() - startTime;

      // Assertions
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(50);

      // Check for expected keywords
      const lowerResponse = response.toLowerCase();
      const foundKeywords = expectedKeywords.filter(kw => lowerResponse.includes(kw.toLowerCase()));
      expect(foundKeywords.length).toBeGreaterThanOrEqual(expectedKeywords.length * 0.5); // At least 50% of keywords

      // Performance check
      expect(totalDuration).toBeLessThan(3000); // < 3s for full pipeline

      console.log(`   ✓ Simple query: ${foundKeywords.length}/${expectedKeywords.length} keywords found in ${totalDuration}ms`);
    });

    test('should answer complex medical query', async () => {
      const { query, expectedKeywords } = SAMPLE_QUERIES.complex;

      // Full RAG pipeline
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const searchResults = await faissVectorStore.search(queryEmbedding, 5);

      const context = searchResults.map((result, idx) => {
        const record = SAMPLE_MEDICAL_RECORDS.find(r => r.id === result.id);
        return `[${record?.id}]\n${record?.text}`;
      });

      const prompt = medicalPromptTemplates.medicalQA(query, context, {
        requireCitations: true,
        requireConfidenceLevel: true
      });

      const startTime = Date.now();
      const response = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 500 });
      const totalDuration = Date.now() - startTime;

      // Assertions
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(100);

      const lowerResponse = response.toLowerCase();
      const foundKeywords = expectedKeywords.filter(kw => lowerResponse.includes(kw.toLowerCase()));
      expect(foundKeywords.length).toBeGreaterThanOrEqual(2); // At least 2 medical terms

      // Should synthesize information from multiple documents
      const hasSynthesis = lowerResponse.includes('improved') || lowerResponse.includes('progress') || lowerResponse.includes('treatment');
      expect(hasSynthesis).toBe(true);

      console.log(`   ✓ Complex query: ${foundKeywords.length}/${expectedKeywords.length} keywords, synthesis present in ${totalDuration}ms`);
    });

    test('should handle temporal query', async () => {
      const { query, expectedKeywords } = SAMPLE_QUERIES.temporal;

      // Full RAG pipeline
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const searchResults = await faissVectorStore.search(queryEmbedding, 4);

      const context = searchResults.map((result, idx) => {
        const record = SAMPLE_MEDICAL_RECORDS.find(r => r.id === result.id);
        return `[${record?.id}] Date: ${record?.occurred_at}\n${record?.text}`;
      });

      const prompt = medicalPromptTemplates.medicalQA(query, context, {
        requireCitations: true
      });

      const response = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 400 });

      // Should mention recent changes (lisinopril in March)
      const lowerResponse = response.toLowerCase();
      const mentionsRecent = lowerResponse.includes('lisinopril') || lowerResponse.includes('blood pressure') || lowerResponse.includes('march');
      expect(mentionsRecent).toBe(true);

      console.log(`   ✓ Temporal query: mentions recent changes`);
    });

    test('should synthesize multi-document information', async () => {
      const { query, expectedKeywords } = SAMPLE_QUERIES.multiDocument;

      // Use all documents
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const searchResults = await faissVectorStore.search(queryEmbedding, 5);

      const context = searchResults.map((result, idx) => {
        const record = SAMPLE_MEDICAL_RECORDS.find(r => r.id === result.id);
        return `[${record?.id}]\n${record?.text}`;
      });

      const prompt = medicalPromptTemplates.medicalQA(query, context, {
        requireCitations: true
      });

      const startTime = Date.now();
      const response = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 500 });
      const totalDuration = Date.now() - startTime;

      // Should mention both medications
      const lowerResponse = response.toLowerCase();
      const mentionsMetformin = lowerResponse.includes('metformin');
      const mentionsLisinopril = lowerResponse.includes('lisinopril');
      expect(mentionsMetformin && mentionsLisinopril).toBe(true);

      // Should mention doses and indications
      const mentionsDoses = lowerResponse.includes('500') || lowerResponse.includes('10mg');
      const mentionsIndications = (lowerResponse.includes('diabetes') || lowerResponse.includes('hypertension'));
      expect(mentionsDoses || mentionsIndications).toBe(true);

      console.log(`   ✓ Multi-document: both medications mentioned in ${totalDuration}ms`);
    });

    test('should maintain performance for concurrent queries', async () => {
      const queries = [
        "What medications is the patient taking?",
        "What is the patient's HbA1c?",
        "Is the patient's blood pressure controlled?"
      ];

      const startTime = Date.now();

      // Run queries in parallel
      const results = await Promise.all(
        queries.map(async (query) => {
          const queryEmbedding = await embeddingService.generateEmbedding(query);
          const searchResults = await faissVectorStore.search(queryEmbedding, 3);

          const context = searchResults.map((result) => {
            const record = SAMPLE_MEDICAL_RECORDS.find(r => r.id === result.id);
            return `[${record?.id}]\n${record?.text}`;
          });

          const prompt = medicalPromptTemplates.medicalQA(query, context);
          return await llmService.generate(prompt, { temperature: 0.1, maxTokens: 200 });
        })
      );

      const totalDuration = Date.now() - startTime;
      const avgDuration = totalDuration / queries.length;

      expect(results.length).toBe(queries.length);
      expect(results.every(r => r.length > 30)).toBe(true);

      // Average should be reasonable (queries run sequentially due to Ollama)
      expect(avgDuration).toBeLessThan(5000);

      console.log(`   ✓ Concurrent queries: ${queries.length} queries in ${totalDuration}ms (${avgDuration.toFixed(0)}ms avg)`);
    });
  });

  describe('5. Error Handling', () => {
    test('should handle missing context gracefully', async () => {
      const prompt = medicalPromptTemplates.medicalQA(
        "What is the patient's diagnosis?",
        [], // Empty context
        { requireCitations: false }
      );

      const response = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 200 });

      // Should respond even with no context
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(20);

      console.log(`   ✓ Empty context: response generated`);
    });

    test('should handle very long context', async () => {
      const longContext = SAMPLE_MEDICAL_RECORDS.map((record, idx) =>
        `[record_${idx}]\n${record.text}\n`.repeat(5) // Repeat each 5x
      );

      const prompt = medicalPromptTemplates.medicalQA(
        "Summarize the patient's medications",
        longContext
      );

      // Should handle truncation if needed
      const response = await llmService.generate(prompt, { temperature: 0.1, maxTokens: 300 });
      expect(response).toBeDefined();

      console.log(`   ✓ Long context: handled without errors`);
    });

    test('should validate embedding dimensions match', async () => {
      // Generate embedding
      const embedding = await embeddingService.generateEmbedding("test text");

      // Dimension should match FAISS index
      expect(embedding.length).toBe(embeddingDimension);

      console.log(`   ✓ Dimension validation: ${embedding.length} = ${embeddingDimension}`);
    });

    test('should handle special characters in queries', async () => {
      const specialQueries = [
        "What's the patient's current HbA1c level?",
        "Medications: metformin & lisinopril?",
        "Blood pressure < 130/80 mmHg?"
      ];

      for (const query of specialQueries) {
        const queryEmbedding = await embeddingService.generateEmbedding(query);
        expect(queryEmbedding.length).toBe(embeddingDimension);

        const results = await faissVectorStore.search(queryEmbedding, 2);
        expect(results.length).toBeGreaterThan(0);
      }

      console.log(`   ✓ Special characters: ${specialQueries.length} queries handled`);
    });
  });

  describe('6. Performance Benchmarks', () => {
    test('should meet embedding performance targets', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await embeddingService.generateEmbedding("Sample medical text for benchmarking");
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(avgTime).toBeLessThan(1500); // < 1.5s average
      expect(maxTime).toBeLessThan(3000); // < 3s max

      console.log(`   ✓ Embedding performance: avg ${avgTime.toFixed(0)}ms, max ${maxTime}ms`);
    });

    test('should meet LLM performance targets', async () => {
      const iterations = 5;
      const times: number[] = [];

      const context = [SAMPLE_MEDICAL_RECORDS[0].text];
      const prompt = medicalPromptTemplates.medicalQA(
        "What medication is mentioned?",
        context
      );

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await llmService.generate(prompt, { temperature: 0.1, maxTokens: 100 });
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(avgTime).toBeLessThan(3000); // < 3s average
      expect(maxTime).toBeLessThan(5000); // < 5s max

      console.log(`   ✓ LLM performance: avg ${avgTime.toFixed(0)}ms, max ${maxTime}ms`);
    });

    test('should meet end-to-end RAG performance targets', async () => {
      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        // Full pipeline
        const queryEmbedding = await embeddingService.generateEmbedding("Patient medications");
        const searchResults = await faissVectorStore.search(queryEmbedding, 3);
        const context = searchResults.map(r => {
          const record = SAMPLE_MEDICAL_RECORDS.find(rec => rec.id === r.id);
          return `[${record?.id}]\n${record?.text}`;
        });
        const prompt = medicalPromptTemplates.medicalQA("List medications", context);
        await llmService.generate(prompt, { temperature: 0.1, maxTokens: 200 });

        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

      expect(avgTime).toBeLessThan(5000); // < 5s average for full pipeline

      console.log(`   ✓ E2E RAG performance: avg ${avgTime.toFixed(0)}ms`);
    });
  });
});
