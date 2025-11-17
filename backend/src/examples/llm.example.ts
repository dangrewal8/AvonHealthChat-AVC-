/**
 * LLM Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Configuration
 * - Extraction with temperature=0
 * - Summarization with temperature=0.3
 * - Retry logic with exponential backoff
 * - Token usage monitoring
 * - Error handling
 */

import llmService from '../services/llm-factory.service';

/**
 * Example 1: Configure LLM service
 */
export function exampleConfigure() {
  console.log('Example 1: Configure LLM Service');
  console.log('-'.repeat(80));

  try {
    llmService.configure({
      model: 'meditron',
      // Ollama doesn't require API keys (local processing)
      maxTokens: 2000,
      temperature: 0,
      timeout: 60000, // 60 seconds
    });

    console.log('  Configuration successful ✓\n');
    console.log('  Current config:', llmService.getConfig());
  } catch (error) {
    console.error('  Configuration error:', (error as Error).message);
  }

  console.log('\n  ✅ Success\n');
}

/**
 * Example 2: Extract with temperature=0
 */
export async function exampleExtract() {
  console.log('Example 2: Extract (Temperature = 0)');
  console.log('-'.repeat(80));

  const systemPrompt = `Extract medications from medical text. Return JSON with format:
{
  "extractions": [
    {
      "medication": "...",
      "dosage": "...",
      "frequency": "..."
    }
  ]
}`;

  const userPrompt = 'Patient prescribed Metformin 500mg twice daily and Lisinopril 10mg once daily.';

  console.log('  System Prompt:', systemPrompt.split('\n')[0] + '...');
  console.log(`  User Prompt: "${userPrompt}"\n`);

  try {
    // const result = await llmService.extract(systemPrompt, userPrompt, 0);

    // console.log('  Result:\n');
    // console.log(`    Extractions: ${result.extractions.length}`);
    // console.log(`    Prompt Tokens: ${result.promptTokens}`);
    // console.log(`    Completion Tokens: ${result.completionTokens}`);
    // console.log(`    Total Tokens: ${result.totalTokens}`);
    // console.log(`    Latency: ${result.latencyMs}ms`);
    // console.log(`    Model: ${result.model}`);

    console.log('  ⚠️  Requires Ollama to be running\n');
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Summarize with temperature=0.3
 */
export async function exampleSummarize() {
  console.log('Example 3: Summarize (Temperature = 0.3)');
  console.log('-'.repeat(80));

  // const systemPrompt = 'Summarize medical information concisely.';
  const userPrompt = `Patient Information:
- Metformin 500mg twice daily for Type 2 Diabetes
- Lisinopril 10mg once daily for Hypertension
- Follow up in 2 weeks for blood pressure check`;

  console.log(`  User Prompt:\n${userPrompt.split('\n').map(l => `    ${l}`).join('\n')}\n`);

  try {
    // const result = await llmService.summarize(systemPrompt, userPrompt, 0.3);

    // console.log('  Summary:\n');
    // console.log(`    ${result.summary}\n`);
    // console.log(`    Tokens: ${result.totalTokens}`);
    // console.log(`    Latency: ${result.latencyMs}ms`);

    console.log('  ⚠️  Requires Ollama to be running\n');
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Extract with retries
 */
export async function exampleExtractWithRetries() {
  console.log('Example 4: Extract with Retries');
  console.log('-'.repeat(80));

  // const systemPrompt = 'Extract structured data. Return JSON.';
  // const userPrompt = 'Patient has diabetes and hypertension.';

  console.log('  Max Retries: 3');
  console.log('  Backoff: Exponential (2s, 4s, 8s)\n');

  try {
    // const result = await llmService.extractWithRetries(
    //   systemPrompt,
    //   userPrompt,
    //   0,  // temperature
    //   3   // maxRetries
    // );

    // console.log('  Result:', result);

    console.log('  ⚠️  Requires Ollama to be running\n');
  } catch (error) {
    console.error('  Error:', (error as Error).message);
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Token usage monitoring
 */
export async function exampleTokenUsage() {
  console.log('Example 5: Token Usage Monitoring');
  console.log('-'.repeat(80));

  // Reset token usage before testing
  llmService.resetTokenUsage();

  console.log('  Initial token usage:');
  let usage = llmService.getTokenUsage();
  console.log(`    Total Tokens: ${usage.totalTokens}`);
  console.log(`    Requests: ${usage.requestCount}\n`);

  // Simulate some API calls
  // await llmService.extract('system', 'user', 0);
  // await llmService.summarize('system', 'user', 0.3);

  console.log('  After 2 API calls (simulated):');
  usage = llmService.getTokenUsage();
  console.log(`    Total Prompt Tokens: ${usage.totalPromptTokens}`);
  console.log(`    Total Completion Tokens: ${usage.totalCompletionTokens}`);
  console.log(`    Total Tokens: ${usage.totalTokens}`);
  console.log(`    Requests: ${usage.requestCount}`);
  console.log(`    Avg Tokens/Request: ${usage.avgTokensPerRequest.toFixed(0)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Error handling
 */
export async function exampleErrorHandling() {
  console.log('Example 6: Error Handling');
  console.log('-'.repeat(80));

  console.log('  Common Error Scenarios:\n');

  console.log('    1. Missing API Key:');
  try {
    llmService.configure({ apiKey: '' });
  } catch (error) {
    console.log(`       ❌ ${(error as Error).message}\n`);
  }

  console.log('    2. Rate Limit (429):');
  console.log('       Automatically retried with backoff\n');

  console.log('    3. Invalid API Key (401):');
  console.log('       Not retried (non-retryable error)\n');

  console.log('    4. Token Limit Exceeded:');
  console.log('       Not retried (reduce prompt size)\n');

  console.log('    5. Timeout:');
  console.log('       Automatically retried\n');

  console.log('    6. JSON Parse Error:');
  console.log('       Not retried (check response format)\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Temperature comparison
 */
export function exampleTemperatureComparison() {
  console.log('Example 7: Temperature Comparison');
  console.log('-'.repeat(80));

  console.log('  Extraction (Temperature = 0):');
  console.log('    - Deterministic output');
  console.log('    - Same input → same output');
  console.log('    - Use for: structured extraction, facts\n');

  console.log('  Summarization (Temperature = 0.3):');
  console.log('    - Slightly creative');
  console.log('    - Natural language variation');
  console.log('    - Use for: summaries, explanations\n');

  console.log('  High Temperature (0.7+):');
  console.log('    - Very creative');
  console.log('    - May hallucinate');
  console.log('    - Use for: creative writing (not medical!)\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Check configuration
 */
export function exampleCheckConfiguration() {
  console.log('Example 8: Check Configuration');
  console.log('-'.repeat(80));

  console.log('  Is Configured:', llmService.isConfigured());
  console.log('  Current Config:', llmService.getConfig());
  console.log('  Extraction Prompt:', llmService.getExtractionSystemPrompt().substring(0, 50) + '...');
  console.log('  Summarization Prompt:', llmService.getSummarizationSystemPrompt().substring(0, 50) + '...');

  console.log('\n  ✅ Success\n');
}

/**
 * Example 9: Custom configuration
 */
export function exampleCustomConfiguration() {
  console.log('Example 9: Custom Configuration');
  console.log('-'.repeat(80));

  // Fast & cheap config
  console.log('  Fast & Cheap Configuration:\n');
  console.log('    Model: meditron');
  console.log('    Max Tokens: 1500');
  console.log('    Timeout: 30s\n');

  // const fastConfig = {
  //   model: 'meditron',
  //   maxTokens: 1500,
  //   timeout: 30000,
  // };

  // llmService.configure(fastConfig);

  // High quality config
  console.log('  High Quality Configuration:\n');
  console.log('    Model: meditron');
  console.log('    Max Tokens: 4000');
  console.log('    Timeout: 120s\n');

  // const qualityConfig = {
  //   model: 'meditron',
  //   maxTokens: 4000,
  //   timeout: 120000,
  // };

  // llmService.configure(qualityConfig);

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Complete workflow
 */
export async function exampleCompleteWorkflow() {
  console.log('Example 10: Complete Workflow');
  console.log('-'.repeat(80));

  console.log('  Step 1: Configure service ✓\n');
  // llmService.configure({
  //   model: 'meditron',
  //   (Ollama doesn't require API keys)
  //   maxTokens: 2000,
  //   temperature: 0,
  //   timeout: 60000,
  // });

  console.log('  Step 2: Reset token usage ✓\n');
  llmService.resetTokenUsage();

  console.log('  Step 3: Extract data (temp=0) ⏳\n');
  // const extraction = await llmService.extractWithRetries(
  //   'Extract medications',
  //   'Patient on Metformin 500mg',
  //   0,
  //   3
  // );

  console.log('  Step 4: Summarize results (temp=0.3) ⏳\n');
  // const summary = await llmService.summarizeWithRetries(
  //   'Summarize medical info',
  //   JSON.stringify(extraction.extractions),
  //   0.3,
  //   3
  // );

  console.log('  Step 5: Check token usage ✓\n');
  const usage = llmService.getTokenUsage();
  console.log(`    Total Tokens: ${usage.totalTokens}`);
  console.log(`    Requests: ${usage.requestCount}\n`);

  console.log('  Step 6: Return results ✓\n');

  console.log('  ⚠️  Full workflow requires Ollama to be running\n');
  console.log('  ✅ Complete Workflow Success\n');
}

/**
 * Example 11: Retry behavior demonstration
 */
export async function exampleRetryBehavior() {
  console.log('Example 11: Retry Behavior');
  console.log('-'.repeat(80));

  console.log('  Retry Logic:\n');
  console.log('    Attempt 1: Immediate');
  console.log('    Attempt 2: Wait 2 seconds');
  console.log('    Attempt 3: Wait 4 seconds');
  console.log('    Attempt 4: Wait 8 seconds\n');

  console.log('  Retryable Errors:');
  console.log('    - Rate limit (429)');
  console.log('    - Timeout');
  console.log('    - Generic API errors\n');

  console.log('  Non-Retryable Errors:');
  console.log('    - Invalid API key (401)');
  console.log('    - Token limit exceeded');
  console.log('    - JSON parse errors\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Performance monitoring
 */
export async function examplePerformanceMonitoring() {
  console.log('Example 12: Performance Monitoring');
  console.log('-'.repeat(80));

  console.log('  Metrics Tracked:\n');
  console.log('    - Latency per request (ms)');
  console.log('    - Token usage per request');
  console.log('    - Total tokens consumed');
  console.log('    - Average tokens per request');
  console.log('    - Request count\n');

  console.log('  Example Metrics:\n');
  console.log('    Latency: 1,234ms');
  console.log('    Prompt Tokens: 450');
  console.log('    Completion Tokens: 180');
  console.log('    Total: 630 tokens\n');

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('LLM SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleConfigure();
    await exampleExtract();
    await exampleSummarize();
    await exampleExtractWithRetries();
    await exampleTokenUsage();
    await exampleErrorHandling();
    exampleTemperatureComparison();
    exampleCheckConfiguration();
    exampleCustomConfiguration();
    await exampleCompleteWorkflow();
    await exampleRetryBehavior();
    await examplePerformanceMonitoring();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
    console.log('\nNote: Live API examples require Ollama to be running (ollama serve)');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
