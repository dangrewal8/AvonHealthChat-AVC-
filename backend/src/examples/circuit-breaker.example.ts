/**
 * Circuit Breaker Usage Examples
 *
 * Demonstrates:
 * - Basic circuit breaker usage
 * - State transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
 * - Failure threshold behavior
 * - Reset timeout mechanism
 * - Fail-fast behavior when circuit is OPEN
 * - Automatic recovery
 * - Integration with Ollama and Avon API
 * - Multiple service monitoring
 */

import { CircuitBreaker, circuitBreakerManager, CircuitState } from '../services/circuit-breaker.service';

/**
 * Example 1: Basic circuit breaker usage
 */
export async function exampleBasicUsage() {
  console.log('Example 1: Basic Circuit Breaker Usage');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeoutMs: 5000,
  });

  console.log('  Configuration:');
  console.log('    Failure threshold: 3');
  console.log('    Reset timeout: 5000ms');

  console.log('\n  Making successful request:\n');

  // Successful request
  try {
    const result = await breaker.execute(async () => {
      console.log('    → Executing request...');
      return 'Success!';
    });

    console.log('    Result:', result);
    console.log('    State:', breaker.getState());
  } catch (error) {
    console.error('    Error:', (error as Error).message);
  }

  console.log('\n  ✅ Success\n');

  breaker.reset();
}

/**
 * Example 2: State transitions
 */
export async function exampleStateTransitions() {
  console.log('Example 2: State Transitions');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeoutMs: 2000,
  });

  console.log('  Initial state:', breaker.getState());
  console.log();

  // Simulate 3 failures to open circuit
  console.log('  Simulating 3 failures:\n');

  for (let i = 1; i <= 3; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Service unavailable');
      });
    } catch (error) {
      console.log(`    Failure ${i}: ${(error as Error).message}`);
      console.log(`      State: ${breaker.getState()}`);
      console.log(`      Failure count: ${breaker.getStats().failureCount}`);
    }
  }

  console.log('\n  Circuit is now OPEN\n');

  // Try request while circuit is OPEN
  console.log('  Attempting request while OPEN:\n');

  try {
    await breaker.execute(async () => {
      return 'This will not execute';
    });
  } catch (error) {
    console.log('    Error:', (error as Error).message);
    console.log('    State:', breaker.getState());
  }

  // Wait for reset timeout
  console.log('\n  Waiting 2 seconds for reset timeout...\n');
  await new Promise(resolve => setTimeout(resolve, 2100));

  // Try request after timeout (should transition to HALF_OPEN)
  console.log('  Attempting request after timeout:\n');

  try {
    await breaker.execute(async () => {
      console.log('    → State before execution:', breaker.getState());
      return 'Success!';
    });

    console.log('    → Request succeeded');
    console.log('    → State after execution:', breaker.getState());
  } catch (error) {
    console.log('    Error:', (error as Error).message);
  }

  console.log('\n  ✅ Success (circuit recovered)\n');

  breaker.reset();
}

/**
 * Example 3: Failure threshold
 */
export async function exampleFailureThreshold() {
  console.log('Example 3: Failure Threshold');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeoutMs: 10000,
  });

  console.log('  Failure threshold: 5');
  console.log('  Simulating failures:\n');

  for (let i = 1; i <= 7; i++) {
    try {
      await breaker.execute(async () => {
        if (i <= 6) {
          throw new Error('Service error');
        }
        return 'Success';
      });

      console.log(`    Request ${i}: SUCCESS`);
    } catch (error) {
      const stats = breaker.getStats();
      console.log(`    Request ${i}: FAILED`);
      console.log(`      Failure count: ${stats.failureCount}`);
      console.log(`      State: ${stats.state}`);

      if (stats.state === CircuitState.OPEN) {
        console.log('      → Circuit OPENED');
      }
    }
  }

  console.log('\n  ✅ Success (threshold behavior demonstrated)\n');

  breaker.reset();
}

/**
 * Example 4: Reset timeout mechanism
 */
export async function exampleResetTimeout() {
  console.log('Example 4: Reset Timeout Mechanism');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 2,
    resetTimeoutMs: 3000,
  });

  console.log('  Configuration:');
  console.log('    Failure threshold: 2');
  console.log('    Reset timeout: 3000ms\n');

  // Open circuit
  console.log('  Opening circuit (2 failures):\n');

  for (let i = 1; i <= 2; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Failed');
      });
    } catch (error) {
      console.log(`    Failure ${i}`);
    }
  }

  console.log('    State:', breaker.getState());

  // Check time until reset
  const timeUntilReset = breaker.getTimeUntilReset();
  console.log('    Time until reset:', Math.ceil(timeUntilReset / 1000), 'seconds\n');

  // Wait for half the timeout
  console.log('  Waiting 1.5 seconds (half timeout)...\n');
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('    Time until reset:', Math.ceil(breaker.getTimeUntilReset() / 1000), 'seconds');
  console.log('    State:', breaker.getState());

  // Wait for remaining timeout
  console.log('\n  Waiting remaining 1.5+ seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 1600));

  console.log('    Time until reset: 0 seconds');
  console.log('    Next request will attempt HALF_OPEN\n');

  // Successful request to close circuit
  try {
    await breaker.execute(async () => {
      return 'Success!';
    });

    console.log('    Request succeeded');
    console.log('    State:', breaker.getState(), '(CLOSED)');
  } catch (error) {
    console.log('    Error:', (error as Error).message);
  }

  console.log('\n  ✅ Success (reset timeout working)\n');

  breaker.reset();
}

/**
 * Example 5: Fail-fast behavior
 */
export async function exampleFailFast() {
  console.log('Example 5: Fail-Fast Behavior');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 2,
    resetTimeoutMs: 10000,
  });

  console.log('  Opening circuit:\n');

  // Open circuit
  for (let i = 1; i <= 2; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Failed');
      });
    } catch (error) {
      console.log(`    Failure ${i}`);
    }
  }

  console.log('    State: OPEN\n');

  // Try multiple requests (should all fail-fast)
  console.log('  Attempting 5 requests while circuit is OPEN:\n');

  const startTime = Date.now();

  for (let i = 1; i <= 5; i++) {
    try {
      await breaker.execute(async () => {
        // This will not execute
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'Success';
      });
    } catch (error) {
      console.log(`    Request ${i}: FAILED FAST`);
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  console.log('\n    Total time:', totalTime, 'ms');
  console.log('    (All requests failed immediately, no 1s delay)\n');

  console.log('  ✅ Success (fail-fast prevents slow failures)\n');

  breaker.reset();
}

/**
 * Example 6: Automatic recovery
 */
export async function exampleAutomaticRecovery() {
  console.log('Example 6: Automatic Recovery');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeoutMs: 2000,
  });

  console.log('  Scenario: Service fails, then recovers\n');

  // Phase 1: Service failures
  console.log('  Phase 1: Service failures (3 failures)\n');

  for (let i = 1; i <= 3; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Service down');
      });
    } catch (error) {
      console.log(`    Failure ${i}`);
    }
  }

  console.log('    Circuit: OPEN\n');

  // Phase 2: Wait for timeout
  console.log('  Phase 2: Waiting for reset timeout (2 seconds)...\n');
  await new Promise(resolve => setTimeout(resolve, 2100));

  // Phase 3: Service recovers
  console.log('  Phase 3: Service recovers\n');

  try {
    const result = await breaker.execute(async () => {
      console.log('    → Attempting recovery request...');
      return 'Service recovered!';
    });

    console.log('    Result:', result);
    console.log('    Circuit:', breaker.getState(), '(CLOSED)');
  } catch (error) {
    console.log('    Error:', (error as Error).message);
  }

  // Phase 4: Normal operation
  console.log('\n  Phase 4: Normal operation\n');

  for (let i = 1; i <= 3; i++) {
    try {
      await breaker.execute(async () => {
        return `Request ${i} success`;
      });
      console.log(`    Request ${i}: SUCCESS`);
    } catch (error) {
      console.log(`    Request ${i}: FAILED`);
    }
  }

  console.log('\n  ✅ Success (automatic recovery)\n');

  breaker.reset();
}

/**
 * Example 7: Ollama API integration
 */
export async function exampleOllamaIntegration() {
  console.log('Example 7: Ollama API Integration');
  console.log('-'.repeat(80));

  // Get circuit breaker for Ollama
  const ollamaBreaker = circuitBreakerManager.getBreaker('ollama', {
    failureThreshold: 3,
    resetTimeoutMs: 60000, // 1 minute
  });

  console.log('  Ollama Circuit Breaker:');
  console.log('    Failure threshold: 3');
  console.log('    Reset timeout: 60000ms (1 minute)\n');

  // Simulate Ollama call
  async function callOllama(prompt: string): Promise<string> {
    return ollamaBreaker.execute(async () => {
      console.log('    → Calling Ollama API...');

      // Simulate API call
      // In production: return await ollama.generate({ ... })

      // Simulate random failure
      if (Math.random() < 0.3) {
        throw new Error('Ollama API error: Service timeout');
      }

      return `Ollama response for: "${prompt}"`;
    });
  }

  console.log('  Making Ollama requests:\n');

  for (let i = 1; i <= 5; i++) {
    try {
      const result = await callOllama(`Query ${i}`);
      console.log(`    Request ${i}: SUCCESS`);
      console.log(`      ${result}`);
    } catch (error) {
      console.log(`    Request ${i}: FAILED`);
      console.log(`      ${(error as Error).message}`);
      console.log(`      Circuit: ${ollamaBreaker.getState()}`);
    }
  }

  const stats = ollamaBreaker.getStats();
  console.log('\n  Ollama Circuit Stats:');
  console.log('    State:', stats.state);
  console.log('    Successes:', stats.successCount);
  console.log('    Failures:', stats.failureCount);
  console.log('    Total requests:', stats.totalRequests);

  console.log('\n  ✅ Success\n');

  ollamaBreaker.reset();
}

/**
 * Example 8: Avon Health API integration
 */
export async function exampleAvonAPIIntegration() {
  console.log('Example 8: Avon Health API Integration');
  console.log('-'.repeat(80));

  // Get circuit breaker for Avon API
  const avonBreaker = circuitBreakerManager.getBreaker('avon_api', {
    failureThreshold: 5,
    resetTimeoutMs: 30000, // 30 seconds
  });

  console.log('  Avon API Circuit Breaker:');
  console.log('    Failure threshold: 5');
  console.log('    Reset timeout: 30000ms (30 seconds)\n');

  // Simulate Avon API call
  async function callAvonAPI(patientId: string): Promise<any> {
    return avonBreaker.execute(async () => {
      console.log(`    → Calling Avon API for patient ${patientId}...`);

      // Simulate API call
      // In production: return await fetch('https://api.avonhealth.com/...')

      // Simulate random failure
      if (Math.random() < 0.2) {
        throw new Error('Avon API error: Service unavailable');
      }

      return {
        patientId,
        data: 'Patient health records',
      };
    });
  }

  console.log('  Making Avon API requests:\n');

  for (let i = 1; i <= 5; i++) {
    try {
      const result = await callAvonAPI(`patient_${i}`);
      console.log(`    Request ${i}: SUCCESS`);
      console.log(`      Patient ID: ${result.patientId}`);
    } catch (error) {
      console.log(`    Request ${i}: FAILED`);
      console.log(`      ${(error as Error).message}`);
    }
  }

  const stats = avonBreaker.getStats();
  console.log('\n  Avon API Circuit Stats:');
  console.log('    State:', stats.state);
  console.log('    Success rate:', (avonBreaker.getSuccessRate() * 100).toFixed(1), '%');
  console.log('    Failure rate:', (avonBreaker.getFailureRate() * 100).toFixed(1), '%');

  console.log('\n  ✅ Success\n');

  avonBreaker.reset();
}

/**
 * Example 9: Multiple services
 */
export async function exampleMultipleServices() {
  console.log('Example 9: Multiple Services');
  console.log('-'.repeat(80));

  console.log('  Managing circuit breakers for multiple services:\n');

  // Simulate calls to different services
  const services = ['ollama', 'avon_api', 'vector_db'];

  for (const service of services) {
    console.log(`  ${service.toUpperCase()}:`);

    for (let i = 1; i <= 3; i++) {
      try {
        await circuitBreakerManager.execute(service, async () => {
          // Simulate random failure
          if (Math.random() < 0.3) {
            throw new Error(`${service} error`);
          }
          return `${service} success`;
        });

        console.log(`    Request ${i}: SUCCESS`);
      } catch (error) {
        console.log(`    Request ${i}: FAILED`);
      }
    }

    console.log();
  }

  // Get stats for all services
  console.log('  Circuit Breaker Stats for All Services:\n');

  const allStats = circuitBreakerManager.getAllStats();

  for (const [serviceName, stats] of allStats.entries()) {
    console.log(`  ${serviceName}:`);
    console.log('    State:', stats.state);
    console.log('    Successes:', stats.successCount);
    console.log('    Failures:', stats.failureCount);
    console.log();
  }

  console.log('  Total services monitored:', circuitBreakerManager.getBreakerCount());

  console.log('\n  ✅ Success (multiple services)\n');

  circuitBreakerManager.resetAll();
}

/**
 * Example 10: Circuit breaker statistics
 */
export async function exampleStatistics() {
  console.log('Example 10: Circuit Breaker Statistics');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeoutMs: 10000,
  });

  console.log('  Making 10 requests (mix of success and failure):\n');

  for (let i = 1; i <= 10; i++) {
    try {
      await breaker.execute(async () => {
        // 30% failure rate
        if (Math.random() < 0.3) {
          throw new Error('Failed');
        }
        return 'Success';
      });
    } catch (error) {
      // Ignore error
    }
  }

  // Get statistics
  const stats = breaker.getStats();

  console.log('  Circuit Breaker Statistics:\n');
  console.log('    State:', stats.state);
  console.log('    Total requests:', stats.totalRequests);
  console.log('    Successes:', stats.successCount);
  console.log('    Failures:', stats.failureCount);
  console.log('    Success rate:', (breaker.getSuccessRate() * 100).toFixed(1), '%');
  console.log('    Failure rate:', (breaker.getFailureRate() * 100).toFixed(1), '%');

  if (stats.lastSuccessTime) {
    console.log('    Last success:', new Date(stats.lastSuccessTime).toISOString());
  }

  if (stats.lastFailureTime) {
    console.log('    Last failure:', new Date(stats.lastFailureTime).toISOString());
  }

  console.log('\n  ✅ Success\n');

  breaker.reset();
}

/**
 * Example 11: Manual control
 */
export async function exampleManualControl() {
  console.log('Example 11: Manual Control');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker();

  console.log('  Initial state:', breaker.getState());

  // Manually open circuit
  console.log('\n  Manually opening circuit:\n');
  breaker.forceOpen();
  console.log('    State:', breaker.getState());

  // Try request while manually opened
  try {
    await breaker.execute(async () => {
      return 'This will not execute';
    });
  } catch (error) {
    console.log('    Request blocked:', (error as Error).message);
  }

  // Manually close circuit
  console.log('\n  Manually closing circuit:\n');
  breaker.forceClose();
  console.log('    State:', breaker.getState());

  // Try request after manually closing
  try {
    await breaker.execute(async () => {
      return 'Success!';
    });
    console.log('    Request succeeded');
  } catch (error) {
    console.log('    Request failed');
  }

  console.log('\n  ✅ Success (manual control)\n');

  breaker.reset();
}

/**
 * Example 12: Real-world RAG pipeline scenario
 */
export async function exampleRealWorldScenario() {
  console.log('Example 12: Real-World RAG Pipeline Scenario');
  console.log('-'.repeat(80));

  console.log('  Scenario: RAG pipeline with Ollama and vector DB\n');

  // Create circuit breakers
  const ollamaBreaker = circuitBreakerManager.getBreaker('ollama', {
    failureThreshold: 3,
    resetTimeoutMs: 60000,
  });

  const vectorDbBreaker = circuitBreakerManager.getBreaker('vector_db', {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  });

  // Simulate RAG pipeline
  async function processQuery(query: string): Promise<string> {
    console.log(`  Processing: "${query}"`);

    try {
      // Step 1: Vector DB retrieval
      const documents = await vectorDbBreaker.execute(async () => {
        console.log('    → Retrieving from vector DB...');

        // Simulate occasional failure
        if (Math.random() < 0.1) {
          throw new Error('Vector DB timeout');
        }

        return ['doc1', 'doc2', 'doc3'];
      });

      console.log('    ✓ Retrieved', documents.length, 'documents');

      // Step 2: Ollama generation
      const response = await ollamaBreaker.execute(async () => {
        console.log('    → Generating with Ollama...');

        // Simulate occasional failure
        if (Math.random() < 0.15) {
          throw new Error('Ollama service timeout');
        }

        return 'Generated answer';
      });

      console.log('    ✓ Generated response');

      return response;
    } catch (error) {
      console.log('    ✗ Pipeline failed:', (error as Error).message);
      throw error;
    }
  }

  // Process multiple queries
  console.log('  Processing 5 queries:\n');

  for (let i = 1; i <= 5; i++) {
    try {
      await processQuery(`Query ${i}`);
      console.log('    Result: SUCCESS\n');
    } catch (error) {
      console.log('    Result: FAILED\n');
    }
  }

  // Show circuit status
  console.log('  Circuit Breaker Status:\n');

  const ollamaStats = ollamaBreaker.getStats();
  console.log('  Ollama:');
  console.log('    State:', ollamaStats.state);
  console.log('    Success rate:', (ollamaBreaker.getSuccessRate() * 100).toFixed(1), '%');

  const vectorDbStats = vectorDbBreaker.getStats();
  console.log('\n  Vector DB:');
  console.log('    State:', vectorDbStats.state);
  console.log('    Success rate:', (vectorDbBreaker.getSuccessRate() * 100).toFixed(1), '%');

  console.log('\n  ✅ Success (real-world scenario)\n');

  circuitBreakerManager.resetAll();
}

/**
 * Example 13: Explain circuit breaker
 */
export function exampleExplain() {
  console.log('Example 13: Explain Circuit Breaker');
  console.log('-'.repeat(80));

  const breaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  });

  const explanation = breaker.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('CIRCUIT BREAKER EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    await exampleBasicUsage();
    await exampleStateTransitions();
    await exampleFailureThreshold();
    await exampleResetTimeout();
    await exampleFailFast();
    await exampleAutomaticRecovery();
    await exampleOllamaIntegration();
    await exampleAvonAPIIntegration();
    await exampleMultipleServices();
    await exampleStatistics();
    await exampleManualControl();
    await exampleRealWorldScenario();
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
