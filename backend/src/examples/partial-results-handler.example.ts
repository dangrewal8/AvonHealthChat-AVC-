/**
 * Partial Results Handler Usage Examples
 *
 * Demonstrates:
 * - Handling timeout with partial results
 * - Different scenarios (retrieval success, generation timeout)
 * - Formatting partial responses
 * - Integration with orchestrator
 * - User-friendly messages
 */

import partialResultsHandler, {
  PipelineContext,
  UIResponse,
} from '../services/partial-results-handler.service';

/**
 * Example 1: Retrieval succeeded, generation timed out
 */
export function exampleRetrievalSuccessGenerationTimeout() {
  console.log('Example 1: Retrieval Succeeded, Generation Timed Out');
  console.log('-'.repeat(80));

  // Simulate pipeline context where retrieval succeeded but generation timed out
  const context: PipelineContext = {
    stage: 'generation',
    data: {
      structured_query: {
        patient_id: 'patient_123',
        intent: 'retrieve_medications',
        entities: [{ type: 'medication', value: 'aspirin' }],
      },
      retrieval_results: {
        candidates: [
          {
            artifact_id: 'med_001',
            snippet: 'Patient prescribed aspirin 81mg daily for cardiac protection.',
            score: 0.95,
          },
          {
            artifact_id: 'med_002',
            snippet: 'Aspirin 81mg started on 2024-01-15 for cardiovascular risk reduction.',
            score: 0.89,
          },
          {
            artifact_id: 'med_003',
            snippet: 'Continue aspirin 81mg daily. No adverse reactions noted.',
            score: 0.82,
          },
        ],
      },
    },
    start_time: Date.now() - 6500, // 6.5 seconds ago (timeout at 6s)
    timeout_ms: 6000,
  };

  console.log('  Scenario: Generation timed out after retrieval succeeded\n');

  // Handle partial result
  const error = new Error('TIMEOUT');
  const partial = partialResultsHandler.handlePartialResult(error, context);

  console.log('  Partial Result:');
  console.log('    Type:', partial.type);
  console.log('    Completed stages:', partial.completed_stages.join(', '));
  console.log('    Failed stage:', partial.failed_stage);
  console.log('    User message:', partial.user_message);
  console.log();

  // Format for UI
  const uiResponse = partialResultsHandler.formatPartialResponse(partial);

  console.log('  UI Response:');
  console.log('    Short answer:', uiResponse.short_answer);
  console.log('    Detailed summary preview:');
  console.log('      ', uiResponse.detailed_summary.substring(0, 100), '...');
  console.log('    Confidence:', uiResponse.confidence.label);
  console.log('    Partial:', uiResponse.metadata.partial);
  console.log('    Provenance entries:', uiResponse.provenance.length);

  console.log('\n  ✅ Success (partial results with snippets)\n');
}

/**
 * Example 2: Only query understanding succeeded
 */
export function exampleOnlyQueryUnderstanding() {
  console.log('Example 2: Only Query Understanding Succeeded');
  console.log('-'.repeat(80));

  const context: PipelineContext = {
    stage: 'retrieval',
    data: {
      structured_query: {
        patient_id: 'patient_456',
        intent: 'retrieve_lab_results',
        entities: [{ type: 'lab_test', value: 'cholesterol' }],
      },
    },
    start_time: Date.now() - 6100,
    timeout_ms: 6000,
  };

  console.log('  Scenario: Retrieval timed out, only query understanding completed\n');

  const error = new Error('TIMEOUT');
  const partial = partialResultsHandler.handlePartialResult(error, context);

  console.log('  Partial Result:');
  console.log('    Completed stages:', partial.completed_stages.join(', '));
  console.log('    Failed stage:', partial.failed_stage);
  console.log('    User message:', partial.user_message);
  console.log();

  const uiResponse = partialResultsHandler.formatPartialResponse(partial);

  console.log('  UI Response:');
  console.log('    Short answer:', uiResponse.short_answer);
  console.log('    Detailed summary:', uiResponse.detailed_summary || '(empty)');
  console.log('    Confidence:', uiResponse.confidence.label);

  console.log('\n  ✅ Success (minimal partial results)\n');
}

/**
 * Example 3: Nothing succeeded
 */
export function exampleNothingSucceeded() {
  console.log('Example 3: Nothing Succeeded');
  console.log('-'.repeat(80));

  const context: PipelineContext = {
    stage: 'query_understanding',
    data: {},
    start_time: Date.now() - 6200,
    timeout_ms: 6000,
  };

  console.log('  Scenario: Timeout during query understanding\n');

  const error = new Error('TIMEOUT');
  const partial = partialResultsHandler.handlePartialResult(error, context);

  console.log('  Partial Result:');
  console.log('    Completed stages:', partial.completed_stages.length === 0 ? '(none)' : partial.completed_stages.join(', '));
  console.log('    Failed stage:', partial.failed_stage);
  console.log('    User message:', partial.user_message);

  console.log('\n  ✅ Success (complete failure handling)\n');
}

/**
 * Example 4: Extraction succeeded, generation timed out
 */
export function exampleExtractionSuccessGenerationTimeout() {
  console.log('Example 4: Extraction Succeeded, Generation Timed Out');
  console.log('-'.repeat(80));

  const context: PipelineContext = {
    stage: 'generation',
    data: {
      structured_query: {
        patient_id: 'patient_789',
        intent: 'retrieve_medications',
      },
      retrieval_results: {
        candidates: [
          { artifact_id: 'med_001', snippet: 'Aspirin 81mg daily', score: 0.95 },
        ],
      },
      extractions: [
        {
          medication_name: 'Aspirin',
          dosage: '81mg',
          frequency: 'daily',
          start_date: '2024-01-15',
        },
      ],
    },
    start_time: Date.now() - 6300,
    timeout_ms: 6000,
  };

  console.log('  Scenario: Generation timed out after extraction succeeded\n');

  const error = new Error('TIMEOUT');
  const partial = partialResultsHandler.handlePartialResult(error, context);

  console.log('  Partial Result:');
  console.log('    Completed stages:', partial.completed_stages.join(', '));
  console.log('    Failed stage:', partial.failed_stage);
  console.log('    Available data:', Object.keys(partial.available_data).join(', '));

  // Determine fallback
  const fallback = partialResultsHandler.determineFallback(
    partial.completed_stages,
    context
  );

  console.log('\n  Fallback Strategy:');
  console.log('    Type:', fallback.type);
  console.log('    Data available:', fallback.data ? 'Yes' : 'No');

  console.log('\n  ✅ Success (structured extractions available)\n');
}

/**
 * Example 5: Integration with orchestrator (Promise.race)
 */
export async function exampleOrchestratorIntegration() {
  console.log('Example 5: Integration with Orchestrator (Promise.race)');
  console.log('-'.repeat(80));

  console.log('  Simulating RAG pipeline with timeout:\n');

  // Simulate async pipeline
  async function processQueryWithTimeout(
    _query: string,
    patientId: string
  ): Promise<UIResponse> {
    const context: PipelineContext = {
      stage: 'query_understanding',
      data: {},
      start_time: Date.now(),
      timeout_ms: 100, // 100ms timeout for demo
    };

    try {
      // Set timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), context.timeout_ms)
      );

      // Work promise
      const workPromise = async () => {
        // Stage 1: Query Understanding (fast)
        await new Promise(resolve => setTimeout(resolve, 20));
        context.data.structured_query = {
          patient_id: patientId,
          intent: 'retrieve_medications',
        };
        console.log('    ✓ Query Understanding completed');
        context.stage = 'retrieval';

        // Stage 2: Retrieval (medium)
        await new Promise(resolve => setTimeout(resolve, 40));
        context.data.retrieval_results = {
          candidates: [
            { artifact_id: 'med_001', snippet: 'Aspirin 81mg', score: 0.95 },
          ],
        };
        console.log('    ✓ Retrieval completed');
        context.stage = 'extraction';

        // Stage 3: Extraction (slow - will timeout)
        await new Promise(resolve => setTimeout(resolve, 200));
        context.data.extractions = [{ medication_name: 'Aspirin' }];
        console.log('    ✓ Extraction completed');
        context.stage = 'generation';

        return { success: true };
      };

      // Race between work and timeout
      await Promise.race([workPromise(), timeoutPromise]);

      // If we get here, no timeout
      return {
        query_id: '123',
        short_answer: 'Complete answer',
        detailed_summary: '',
        structured_extractions: [],
        provenance: [],
        confidence: { score: 0.9, label: 'high', reason: 'Complete' },
        metadata: {},
      };
    } catch (error: any) {
      if (error.message === 'TIMEOUT') {
        console.log('\n    ✗ Timeout occurred at stage:', context.stage);

        const partial = partialResultsHandler.handlePartialResult(error, context);
        return partialResultsHandler.formatPartialResponse(partial);
      }

      throw error;
    }
  }

  // Process query
  const result = await processQueryWithTimeout('What medications?', 'patient_123');

  console.log('\n  Result:');
  console.log('    Type:', result.metadata.partial ? 'PARTIAL' : 'COMPLETE');
  console.log('    Short answer:', result.short_answer);
  console.log('    Completed stages:', result.metadata.completed_stages?.join(', ') || 'all');

  console.log('\n  ✅ Success (orchestrator integration)\n');
}

/**
 * Example 6: Completion percentage
 */
export function exampleCompletionPercentage() {
  console.log('Example 6: Completion Percentage');
  console.log('-'.repeat(80));

  const scenarios = [
    { stages: [], expected: 0 },
    { stages: ['query_understanding'], expected: 25 },
    { stages: ['query_understanding', 'retrieval'], expected: 50 },
    { stages: ['query_understanding', 'retrieval', 'extraction'], expected: 75 },
    { stages: ['query_understanding', 'retrieval', 'extraction', 'generation'], expected: 100 },
  ];

  console.log('  Completion percentages:\n');

  scenarios.forEach(scenario => {
    const percentage = partialResultsHandler.getCompletionPercentage(scenario.stages);
    console.log(`    ${scenario.stages.length} stages: ${percentage}%`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 7: Check if partial results available
 */
export function exampleHasPartialResults() {
  console.log('Example 7: Check if Partial Results Available');
  console.log('-'.repeat(80));

  const scenarios = [
    {
      name: 'No data',
      context: { stage: 'query_understanding' as const, data: {}, start_time: Date.now(), timeout_ms: 6000 },
      expected: false,
    },
    {
      name: 'Query only',
      context: {
        stage: 'retrieval' as const,
        data: { structured_query: {} },
        start_time: Date.now(),
        timeout_ms: 6000,
      },
      expected: true,
    },
    {
      name: 'Query + Retrieval',
      context: {
        stage: 'extraction' as const,
        data: { structured_query: {}, retrieval_results: {} },
        start_time: Date.now(),
        timeout_ms: 6000,
      },
      expected: true,
    },
  ];

  console.log('  Testing partial results availability:\n');

  scenarios.forEach(scenario => {
    const hasPartial = partialResultsHandler.hasPartialResults(scenario.context);
    console.log(`    ${scenario.name}: ${hasPartial ? 'YES' : 'NO'}`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 8: User-friendly messages for different stages
 */
export function exampleUserMessages() {
  console.log('Example 8: User-Friendly Messages for Different Stages');
  console.log('-'.repeat(80));

  const stages: Array<{ stage: any; completedStages: string[] }> = [
    { stage: 'query_understanding', completedStages: [] },
    { stage: 'retrieval', completedStages: ['query_understanding'] },
    { stage: 'extraction', completedStages: ['query_understanding', 'retrieval'] },
    { stage: 'generation', completedStages: ['query_understanding', 'retrieval', 'extraction'] },
    { stage: 'formatting', completedStages: ['query_understanding', 'retrieval', 'extraction', 'generation'] },
  ];

  console.log('  User messages by failed stage:\n');

  stages.forEach(({ stage, completedStages }) => {
    const message = partialResultsHandler.createPartialMessage(stage, completedStages);
    console.log(`    ${stage}:`);
    console.log(`      "${message}"`);
    console.log();
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Fallback determination
 */
export function exampleFallbackDetermination() {
  console.log('Example 9: Fallback Determination');
  console.log('-'.repeat(80));

  const context: PipelineContext = {
    stage: 'generation',
    data: {
      structured_query: { patient_id: 'patient_123' },
      retrieval_results: { candidates: [] },
      extractions: [{ medication: 'aspirin' }],
    },
    start_time: Date.now(),
    timeout_ms: 6000,
  };

  console.log('  Testing fallback strategies:\n');

  const scenarios = [
    ['generation', 'extraction', 'retrieval', 'query_understanding'],
    ['extraction', 'retrieval', 'query_understanding'],
    ['retrieval', 'query_understanding'],
    ['query_understanding'],
    [],
  ];

  scenarios.forEach((completedStages, i) => {
    const fallback = partialResultsHandler.determineFallback(completedStages, context);
    console.log(`    Scenario ${i + 1}: ${completedStages.length} stages completed`);
    console.log(`      Fallback type: ${fallback.type}`);
    console.log();
  });

  console.log('  ✅ Success (fallback strategies)\n');
}

/**
 * Example 10: Real-world timeout scenario
 */
export async function exampleRealWorldTimeout() {
  console.log('Example 10: Real-World Timeout Scenario');
  console.log('-'.repeat(80));

  console.log('  Scenario: Ollama generation takes too long\n');

  async function ragPipelineWithTimeout(_query: string): Promise<UIResponse> {
    const context: PipelineContext = {
      stage: 'query_understanding',
      data: {},
      start_time: Date.now(),
      timeout_ms: 200, // 200ms timeout for demo
    };

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), context.timeout_ms)
      );

      const workPromise = async () => {
        // Query Understanding (fast)
        await new Promise(resolve => setTimeout(resolve, 30));
        context.data.structured_query = { query: _query };
        context.stage = 'retrieval';
        console.log('    ✓ Query Understanding: 30ms');

        // Retrieval (medium)
        await new Promise(resolve => setTimeout(resolve, 80));
        context.data.retrieval_results = {
          candidates: [
            { artifact_id: 'med_001', snippet: 'Aspirin 81mg daily', score: 0.95 },
            { artifact_id: 'med_002', snippet: 'Aspirin for cardiac protection', score: 0.89 },
          ],
        };
        context.stage = 'extraction';
        console.log('    ✓ Retrieval: 80ms');

        // Extraction (medium)
        await new Promise(resolve => setTimeout(resolve, 60));
        context.data.extractions = [{ medication: 'Aspirin', dosage: '81mg' }];
        context.stage = 'generation';
        console.log('    ✓ Extraction: 60ms');

        // Generation (slow - will timeout)
        await new Promise(resolve => setTimeout(resolve, 300));
        context.data.generated_answer = { answer: 'Patient is taking aspirin 81mg daily.' };
        console.log('    ✓ Generation: 300ms');

        return { success: true };
      };

      await Promise.race([workPromise(), timeoutPromise]);

      return {
        query_id: '123',
        short_answer: 'Complete',
        detailed_summary: '',
        structured_extractions: [],
        provenance: [],
        confidence: { score: 0.9, label: 'high', reason: 'Complete' },
        metadata: {},
      };
    } catch (error: any) {
      if (error.message === 'TIMEOUT') {
        console.log('\n    ✗ Timeout at stage:', context.stage);
        console.log('      Elapsed time:', Date.now() - context.start_time, 'ms');

        const partial = partialResultsHandler.handlePartialResult(error, context);
        const response = partialResultsHandler.formatPartialResponse(partial);

        console.log('\n    Returning partial results:');
        console.log('      Completed:', partial.completed_stages.join(', '));
        console.log('      Message:', partial.user_message);

        return response;
      }

      throw error;
    }
  }

  const result = await ragPipelineWithTimeout('What medications am I taking?');

  console.log('\n  Final Response:');
  console.log('    Type:', result.metadata.partial ? 'PARTIAL' : 'COMPLETE');
  console.log('    Short answer:', result.short_answer);
  console.log('    Provenance entries:', result.provenance.length);

  console.log('\n  ✅ Success (real-world scenario)\n');
}

/**
 * Example 11: Explain partial results handler
 */
export function exampleExplain() {
  console.log('Example 11: Explain Partial Results Handler');
  console.log('-'.repeat(80));

  const explanation = partialResultsHandler.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('PARTIAL RESULTS HANDLER EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleRetrievalSuccessGenerationTimeout();
    exampleOnlyQueryUnderstanding();
    exampleNothingSucceeded();
    exampleExtractionSuccessGenerationTimeout();
    await exampleOrchestratorIntegration();
    exampleCompletionPercentage();
    exampleHasPartialResults();
    exampleUserMessages();
    exampleFallbackDetermination();
    await exampleRealWorldTimeout();
    exampleExplain();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
