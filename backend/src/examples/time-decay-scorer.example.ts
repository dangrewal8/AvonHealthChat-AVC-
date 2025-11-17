/**
 * Time Decay Scorer Usage Examples
 *
 * Demonstrates:
 * - Applying exponential time decay to candidates
 * - Decay curve analysis
 * - Before/after comparisons
 * - Decay milestones
 * - Visualization
 */

import timeDecayScorer from '../services/time-decay-scorer.service';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import { Chunk } from '../services/metadata-filter.service';

/**
 * Generate sample candidates with varying dates
 */
function generateSampleCandidates(): RetrievalCandidate[] {
  const now = new Date();

  // Create candidates with different ages
  const agesInDays = [0, 7, 30, 90, 180, 365];

  return agesInDays.map((daysAgo, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const chunk: Chunk = {
      chunk_id: `chunk_${index + 1}`,
      artifact_id: `artifact_${index + 1}`,
      patient_id: 'patient_123',
      content: `Medical record from ${daysAgo} days ago.`,
      metadata: {
        artifact_type: 'clinical_note',
        date: date.toISOString(),
        author: 'Dr. Smith',
      },
    };

    return {
      chunk,
      score: 0.8, // Same initial score for all
      snippet: chunk.content,
      highlights: [],
      metadata: chunk.metadata,
      rank: index + 1,
    };
  });
}

/**
 * Example 1: Basic time decay application
 */
export function exampleBasicTimeDecay() {
  console.log('Example 1: Basic Time Decay Application');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();

  console.log('  Original Candidates (all score 0.8):\n');
  candidates.forEach((c) => {
    const daysAgo = timeDecayScorer.calculateDaysAgo(c.metadata.date);
    console.log(`    ${c.rank}. ${c.chunk.chunk_id} - ${daysAgo} days ago`);
  });

  console.log('\n  Applying time decay...\n');

  const decayed = timeDecayScorer.applyTimeDecay(candidates);

  console.log('  After Time Decay:\n');
  decayed.forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
    console.log(`       Original: ${c.original_score.toFixed(4)}`);
    console.log(`       Decay:    ${c.time_decay_factor.toFixed(4)}`);
    console.log(`       Final:    ${c.score.toFixed(4)} (${c.days_ago} days ago)`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Decay factor calculation
 */
export function exampleDecayFactorCalculation() {
  console.log('Example 2: Decay Factor Calculation');
  console.log('-'.repeat(80));

  const testDates = [
    { label: 'Today', days: 0 },
    { label: '1 week ago', days: 7 },
    { label: '1 month ago', days: 30 },
    { label: '3 months ago', days: 90 },
    { label: '6 months ago', days: 180 },
    { label: '1 year ago', days: 365 },
  ];

  console.log('  Decay Factors per ChatGPT Specification:\n');
  console.log('  Formula: e^(-0.01 * days_ago)\n');

  testDates.forEach(({ label, days }) => {
    const now = new Date();
    const testDate = new Date(now);
    testDate.setDate(testDate.getDate() - days);

    const decayFactor = timeDecayScorer.calculateDecayFactor(testDate.toISOString());
    const penalty = (1 - decayFactor) * 100;

    console.log(`    ${label.padEnd(15)} (${String(days).padStart(3)} days):`);
    console.log(`      Decay Factor: ${decayFactor.toFixed(4)}`);
    console.log(`      Penalty:      ${penalty.toFixed(1)}%`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Decay milestones
 */
export function exampleDecayMilestones() {
  console.log('Example 3: Decay Milestones');
  console.log('-'.repeat(80));

  const milestones = timeDecayScorer.getDecayMilestones();

  console.log('  Standard Decay Milestones:\n');
  console.log('  Days Ago │ Decay Factor │ Penalty │ Effect');
  console.log('  ─'.repeat(50));

  milestones.forEach((m) => {
    let effect = '';
    if (m.penalty_pct < 10) effect = 'No penalty';
    else if (m.penalty_pct < 30) effect = '7% penalty';
    else if (m.penalty_pct < 50) effect = '26% penalty';
    else if (m.penalty_pct < 70) effect = '59% penalty';
    else if (m.penalty_pct < 90) effect = '83% penalty';
    else effect = '97% penalty';

    console.log(
      `  ${String(m.days_ago).padStart(8)} │ ${m.decay_factor.toFixed(4).padStart(12)} │ ${m.penalty_pct.toFixed(0).padStart(7)}% │ ${effect}`
    );
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 4: Decay curve visualization
 */
export function exampleDecayCurveVisualization() {
  console.log('Example 4: Decay Curve Visualization');
  console.log('-'.repeat(80));

  console.log('\n' + timeDecayScorer.visualizeDecayCurve(50) + '\n');

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Decay curve data points
 */
export function exampleDecayCurveData() {
  console.log('Example 5: Decay Curve Data Points');
  console.log('-'.repeat(80));

  const curve = timeDecayScorer.getDecayCurve(365, 30);

  console.log('  Decay Curve (30-day intervals):\n');

  curve.forEach((point) => {
    console.log(`    Day ${String(point.days_ago).padStart(3)}: ${point.decay_factor.toFixed(4)} (-${point.penalty_pct.toFixed(0)}%)`);
  });

  console.log('\n  ✅ Success\n');
}

/**
 * Example 6: Before/After comparison
 */
export function exampleBeforeAfterComparison() {
  console.log('Example 6: Before/After Comparison');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const decayed = timeDecayScorer.applyTimeDecay(candidates);

  const comparison = timeDecayScorer.compareBeforeAfter(candidates, decayed);

  console.log('  Ranking Changes:\n');

  comparison.rank_changes.forEach((change) => {
    const arrow = change.rank_change > 0 ? '↑' : change.rank_change < 0 ? '↓' : '─';
    console.log(`    ${change.chunk_id}:`);
    console.log(`      Rank: ${change.original_rank} → ${change.decayed_rank} ${arrow}`);
    console.log(`      Score: ${change.original_score.toFixed(4)} → ${change.decayed_score.toFixed(4)}`);
    console.log(`      Age: ${change.days_ago} days`);
    console.log('');
  });

  console.log('  Summary:\n');
  console.log(`    Improved:  ${comparison.summary.improved} candidates`);
  console.log(`    Degraded:  ${comparison.summary.degraded} candidates`);
  console.log(`    Unchanged: ${comparison.summary.unchanged} candidates`);
  console.log(`    Avg Decay: ${comparison.summary.avg_decay_factor.toFixed(4)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Decay analysis for specific date
 */
export function exampleDecayAnalysis() {
  console.log('Example 7: Decay Analysis for Specific Date');
  console.log('-'.repeat(80));

  const now = new Date();
  const testDate = new Date(now);
  testDate.setDate(testDate.getDate() - 60); // 60 days ago

  const analysis = timeDecayScorer.analyzeDecay(testDate.toISOString());

  console.log('  Analysis:\n');
  console.log(`    Date: ${analysis.date}`);
  console.log(`    Days Ago: ${analysis.days_ago}`);
  console.log(`    Decay Factor: ${analysis.decay_factor.toFixed(4)}`);
  console.log(`    Penalty: ${analysis.penalty_percentage.toFixed(1)}%`);
  console.log('');
  console.log('  Score Impact Example:');
  console.log(`    Original Score: ${analysis.score_example.original.toFixed(4)}`);
  console.log(`    After Decay:    ${analysis.score_example.decayed.toFixed(4)}`);
  console.log(`    Loss:           ${(analysis.score_example.original - analysis.score_example.decayed).toFixed(4)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Explain decay for candidate
 */
export function exampleExplainDecay() {
  console.log('Example 8: Explain Decay for Candidate');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const decayed = timeDecayScorer.applyTimeDecay(candidates);

  // Explain for a moderately old candidate (90 days)
  const candidate = decayed.find((c) => c.days_ago >= 85 && c.days_ago <= 95);

  if (candidate) {
    console.log('\n' + timeDecayScorer.explainDecay(candidate) + '\n');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Rank changes due to time decay
 */
export function exampleRankChanges() {
  console.log('Example 9: Rank Changes Due to Time Decay');
  console.log('-'.repeat(80));

  // Create candidates with different initial scores and dates
  const now = new Date();

  const candidates: RetrievalCandidate[] = [
    {
      chunk: {
        chunk_id: 'old_high_score',
        artifact_id: 'a1',
        patient_id: 'p1',
        content: 'Old but high relevance',
        metadata: {
          artifact_type: 'note',
          date: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
          author: 'Dr. A',
        },
      },
      score: 0.95,
      snippet: '',
      highlights: [],
      metadata: { artifact_type: 'note', date: '', author: '' },
      rank: 1,
    },
    {
      chunk: {
        chunk_id: 'recent_medium_score',
        artifact_id: 'a2',
        patient_id: 'p1',
        content: 'Recent with medium relevance',
        metadata: {
          artifact_type: 'note',
          date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          author: 'Dr. B',
        },
      },
      score: 0.75,
      snippet: '',
      highlights: [],
      metadata: { artifact_type: 'note', date: '', author: '' },
      rank: 2,
    },
  ];

  // Update metadata dates
  candidates.forEach((c) => {
    c.metadata.date = c.chunk.metadata.date;
  });

  console.log('  Original Ranking:\n');
  candidates.forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
    console.log(`       Score: ${c.score.toFixed(4)}`);
    console.log(`       Age: ${timeDecayScorer.calculateDaysAgo(c.metadata.date)} days`);
    console.log('');
  });

  const decayed = timeDecayScorer.applyTimeDecay(candidates);

  console.log('  After Time Decay:\n');
  decayed.forEach((c) => {
    console.log(`    ${c.rank}. ${c.chunk.chunk_id}`);
    console.log(`       Original: ${c.original_score.toFixed(4)}`);
    console.log(`       Decay:    ${c.time_decay_factor.toFixed(4)}`);
    console.log(`       Final:    ${c.score.toFixed(4)}`);
    console.log('');
  });

  console.log('  Observation:');
  if (decayed[0].chunk.chunk_id !== candidates[0].chunk.chunk_id) {
    console.log('    ⚠ Ranking changed! Recent document overtook older high-score document.\n');
  } else {
    console.log('    → Original top result maintained despite time decay.\n');
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Most affected candidates
 */
export function exampleMostAffected() {
  console.log('Example 10: Most Affected Candidates');
  console.log('-'.repeat(80));

  const candidates = generateSampleCandidates();
  const decayed = timeDecayScorer.applyTimeDecay(candidates);

  // Find candidates with >50% penalty
  const mostAffected = timeDecayScorer.findMostAffected(decayed, 50);

  console.log('  Candidates with >50% Time Decay Penalty:\n');

  if (mostAffected.length === 0) {
    console.log('    (None found)\n');
  } else {
    mostAffected.forEach((c) => {
      const penalty = (1 - c.time_decay_factor) * 100;
      console.log(`    ${c.chunk.chunk_id}:`);
      console.log(`      Age: ${c.days_ago} days`);
      console.log(`      Penalty: ${penalty.toFixed(1)}%`);
      console.log(`      Score: ${c.original_score.toFixed(4)} → ${c.score.toFixed(4)}`);
      console.log('');
    });
  }

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Batch time decay
 */
export function exampleBatchTimeDecay() {
  console.log('Example 11: Batch Time Decay');
  console.log('-'.repeat(80));

  const candidateLists = [
    generateSampleCandidates(),
    generateSampleCandidates(),
    generateSampleCandidates(),
  ];

  console.log(`  Processing ${candidateLists.length} candidate lists...\n`);

  const decayedLists = timeDecayScorer.batchApplyTimeDecay(candidateLists);

  decayedLists.forEach((decayed, i) => {
    const avgDecay =
      decayed.reduce((sum, c) => sum + c.time_decay_factor, 0) / decayed.length;

    console.log(`  List ${i + 1}:`);
    console.log(`    Candidates: ${decayed.length}`);
    console.log(`    Avg Decay Factor: ${avgDecay.toFixed(4)}`);
    console.log(`    Top Result Age: ${decayed[0].days_ago} days`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Decay rate constant
 */
export function exampleDecayRate() {
  console.log('Example 12: Decay Rate Constant');
  console.log('-'.repeat(80));

  const decayRate = timeDecayScorer.getDecayRate();

  console.log('  Time Decay Configuration:\n');
  console.log(`    Decay Rate: ${decayRate}`);
  console.log(`    Formula: e^(-${decayRate} * days_ago)`);
  console.log('    Source: ChatGPT Specification');
  console.log('');
  console.log('  Interpretation:');
  console.log(`    • Each day reduces score by ~${((1 - Math.exp(-decayRate)) * 100).toFixed(2)}%`);
  console.log(`    • Half-life: ~${(Math.log(2) / decayRate).toFixed(0)} days`);
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('TIME DECAY SCORER EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicTimeDecay();
    exampleDecayFactorCalculation();
    exampleDecayMilestones();
    exampleDecayCurveVisualization();
    exampleDecayCurveData();
    exampleBeforeAfterComparison();
    exampleDecayAnalysis();
    exampleExplainDecay();
    exampleRankChanges();
    exampleMostAffected();
    exampleBatchTimeDecay();
    exampleDecayRate();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
