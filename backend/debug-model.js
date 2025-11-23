/**
 * Debug script to test Ollama model responses
 */

const axios = require('axios');

async function testModel() {
  const testData = {
    medications: [
      {
        id: 'med_abc123',
        name: 'IBgard Oral Capsule Extended Release',
        strength: '90 MG',
        sig: 'take 2 capsules TID before meals',
        active: true,
        start_date: '2024-03-15',
        created_by: 'Dr. Smith'
      },
      {
        id: 'med_def456',
        name: 'Ubrelvy Oral Tablet',
        strength: '50 MG',
        sig: 'take at first sign of migraine',
        active: true,
        start_date: '2024-02-20',
        created_by: 'Dr. Jones'
      }
    ]
  };

  const dataContext = `[MEDICATIONS] - Current prescriptions

Active (2):
1. IBgard Oral Capsule Extended Release - 90 MG
   Instructions: take 2 capsules TID before meals
   Started: 2024-03-15
   Prescribed by: Dr. Smith
   Record ID: med_abc123

2. Ubrelvy Oral Tablet - 50 MG
   Instructions: take at first sign of migraine
   Started: 2024-02-20
   Prescribed by: Dr. Jones
   Record ID: med_def456
`;

  const query = 'What medications is the patient taking?';

  const prompt = `${dataContext}

=== QUESTION ===
${query}

=== YOUR TASK ===
Answer the question using ONLY the patient data above.

Respond in this EXACT format (three sections separated by labels):

REASONING:
[Explain your analysis step-by-step]

SHORT_ANSWER:
[1-2 sentence direct answer with ACTUAL medication names from the data]

DETAILED_SUMMARY:
[Comprehensive answer with full details]

CRITICAL: Use the ACTUAL medication names and details from the data above!`;

  console.log('='.repeat(80));
  console.log('TESTING MODEL RESPONSE');
  console.log('='.repeat(80));
  console.log('\nPROMPT BEING SENT:');
  console.log(prompt);
  console.log('\n' + '='.repeat(80));

  const models = [
    'koesn/llama3-openbiollm-8b',
    'cniongolo/biomistral',
    'meditron:latest'
  ];

  for (const model of models) {
    console.log(`\n\nTesting model: ${model}`);
    console.log('-'.repeat(80));

    try {
      const start = Date.now();
      const response = await axios.post('http://localhost:11434/api/generate', {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 500
        }
      }, {
        timeout: 120000
      });

      const elapsed = Date.now() - start;
      const generatedText = response.data.response;

      console.log(`✅ Response received in ${elapsed}ms`);
      console.log(`Response length: ${generatedText.length} characters\n`);
      console.log('RAW RESPONSE:');
      console.log(generatedText);
      console.log('\n' + '-'.repeat(80));

      // Try parsing
      const reasoningMatch = generatedText.match(/REASONING:\s*(.+?)(?=\n\s*SHORT_ANSWER:)/s);
      const shortMatch = generatedText.match(/SHORT_ANSWER:\s*(.+?)(?=\n\s*DETAILED_SUMMARY:)/s);
      const detailedMatch = generatedText.match(/DETAILED_SUMMARY:\s*(.+)$/s);

      console.log('\nPARSING RESULTS:');
      console.log(`  REASONING: ${reasoningMatch ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
      console.log(`  SHORT_ANSWER: ${shortMatch ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
      console.log(`  DETAILED_SUMMARY: ${detailedMatch ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

      if (shortMatch) {
        console.log(`\nExtracted SHORT_ANSWER:`);
        console.log(`  ${shortMatch[1].trim()}`);
      }

      if (detailedMatch) {
        console.log(`\nExtracted DETAILED_SUMMARY:`);
        console.log(`  ${detailedMatch[1].trim().substring(0, 200)}...`);
      }

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEBUG TEST COMPLETE');
  console.log('='.repeat(80));
}

testModel().catch(console.error);
