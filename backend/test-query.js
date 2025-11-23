/**
 * Test script for Avon Health RAG System
 * Tests multi-agent verification and data retrieval
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/query';

async function testQuery(query, verificationStrategy = 'none', preferredModel = null) {
  console.log('\n' + '='.repeat(80));
  console.log(`TESTING: "${query}"`);
  console.log(`Verification: ${verificationStrategy}`);
  if (preferredModel) console.log(`Preferred Model: ${preferredModel}`);
  console.log('='.repeat(80));

  try {
    const start = Date.now();
    const response = await axios.post(API_URL, {
      query,
      patient_id: 'patient123',
      verification_strategy: verificationStrategy,
      preferred_model: preferredModel,
    }, {
      timeout: 180000 // 3 minutes
    });

    const elapsed = Date.now() - start;
    const data = response.data;

    console.log(`\n✅ Query completed in ${elapsed}ms`);
    console.log(`\n📊 Model Info:`);
    console.log(`   Model Used: ${data.model_display_name}`);
    console.log(`   Task Type: ${data.task_type}`);
    console.log(`   Routing Reason: ${data.routing_reason}`);

    if (data.verification_used && data.verification_used !== 'none') {
      console.log(`\n🔍 Verification Info:`);
      console.log(`   Strategy: ${data.verification_used}`);
      console.log(`   Consensus Score: ${(data.consensus_score * 100).toFixed(1)}%`);
      if (data.agent_responses) {
        console.log(`   Agents Consulted: ${data.agent_responses.length}`);
        data.agent_responses.forEach(agent => {
          console.log(`      - ${agent.model}: confidence ${agent.confidence}`);
        });
      }
      if (data.hallucination_flags && data.hallucination_flags.length > 0) {
        console.log(`   ⚠️  Hallucination Flags: ${data.hallucination_flags.length}`);
        data.hallucination_flags.forEach(flag => {
          console.log(`      - ${flag}`);
        });
      }
    }

    console.log(`\n💬 Short Answer:`);
    console.log(`   ${data.short_answer}`);

    console.log(`\n📝 Detailed Summary (first 500 chars):`);
    console.log(`   ${data.detailed_summary.substring(0, 500)}...`);

    console.log(`\n📚 Structured Extractions: ${data.structured_extractions.length}`);
    if (data.structured_extractions.length > 0) {
      data.structured_extractions.slice(0, 5).forEach(ext => {
        console.log(`   - ${ext.type}: ${ext.value} (${(ext.confidence * 100).toFixed(0)}% confidence)`);
      });
    }

    console.log(`\n🔗 Provenance: ${data.provenance.length} sources`);

    return true;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('\n🏥 Avon Health RAG System - Multi-Agent Verification Tests\n');

  // Test 1: Basic query with no verification (default)
  await testQuery('What medications is the patient taking?');

  // Test 2: Same query with OpenBioLLM (best for entity extraction)
  await testQuery('What medications is the patient taking?', 'none', 'openbiollm');

  // Test 3: Self-consistency verification
  // await testQuery('What medications is the patient taking?', 'self-consistency', 'openbiollm');

  // Test 4: Adaptive verification (auto-selects based on risk)
  // await testQuery('Should the patient stop taking their blood pressure medication?', 'adaptive');

  // Test 5: Complex reasoning query
  await testQuery('What conditions does the patient have and what medications are they taking for those conditions?', 'none', 'biomistral');

  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed');
  console.log('='.repeat(80));
}

runTests().catch(console.error);
