/**
 * Citation Link Generator Usage Examples
 *
 * Demonstrates:
 * - Generating citation links
 * - Building deep links
 * - Display formatting
 * - Citation grouping
 * - URL validation
 * - HTML/Markdown output
 */

import citationLinkGenerator from '../services/citation-link-generator.service';
import { FormattedProvenance } from '../services/provenance-formatter.service';

/**
 * Generate sample provenance
 */
function generateSampleProvenance(): FormattedProvenance[] {
  return [
    {
      artifact_id: 'note_123',
      artifact_type: 'clinical_note',
      snippet: '...prescribed Metformin 500mg twice daily for Type 2 Diabetes...',
      note_date: '2 days ago',
      author: 'Dr. Smith',
      source_url: 'http://localhost:3000/notes/note_123',
      char_offsets: [18, 47],
      relevance_score: 0.9,
    },
    {
      artifact_id: 'note_124',
      artifact_type: 'care_plan',
      snippet: '...follow up scheduled in 2 weeks for blood pressure monitoring...',
      note_date: '1 week ago',
      author: 'Dr. Johnson',
      source_url: 'http://localhost:3000/careplans/note_124',
      char_offsets: [0, 62],
      relevance_score: 0.85,
    },
    {
      artifact_id: 'note_123',
      artifact_type: 'clinical_note',
      snippet: '...blood glucose levels improving with current regimen...',
      note_date: '2 days ago',
      author: 'Dr. Smith',
      source_url: 'http://localhost:3000/notes/note_123',
      char_offsets: [80, 120],
      relevance_score: 0.88,
    },
    {
      artifact_id: 'lab_456',
      artifact_type: 'lab_result',
      snippet: '...HbA1c: 6.5% (target <7%)...',
      note_date: '3 days ago',
      author: 'Quest Diagnostics',
      source_url: 'http://localhost:3000/labs/lab_456',
      char_offsets: [0, 25],
      relevance_score: 0.92,
    },
  ];
}

/**
 * Example 1: Generate citation links
 */
export function exampleGenerateLinks() {
  console.log('Example 1: Generate Citation Links');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  console.log('  Generated citation links:\n');
  links.forEach(link => {
    console.log(`    ${link.display_text} ${link.artifact_id}`);
    console.log(`       URL: ${link.url}`);
    console.log(`       Tooltip: ${link.tooltip}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Build deep links
 */
export function exampleBuildDeepLink() {
  console.log('Example 2: Build Deep Links');
  console.log('-'.repeat(80));

  console.log('  Deep links with text highlighting:\n');

  const link1 = citationLinkGenerator.buildDeepLink('note_123', [18, 47], 'clinical_note');
  console.log(`    Clinical note: ${link1}`);

  const link2 = citationLinkGenerator.buildDeepLink('plan_456', [0, 62], 'care_plan');
  console.log(`    Care plan: ${link2}`);

  const link3 = citationLinkGenerator.buildDeepLink('lab_789', [0, 25], 'lab_result');
  console.log(`    Lab result: ${link3}`);

  const link4 = citationLinkGenerator.buildDeepLink('med_101', [10, 30], 'medication');
  console.log(`    Medication: ${link4}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Format inline references
 */
export function exampleInlineReferences() {
  console.log('Example 3: Format Inline References');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  const inline = citationLinkGenerator.formatInlineReferences(links);

  console.log('  Inline references:\n');
  console.log(`    Patient is taking Metformin 500mg twice daily ${inline}`);
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Format bibliography
 */
export function exampleBibliography() {
  console.log('Example 4: Format Bibliography');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  const bibliography = citationLinkGenerator.formatBibliography(links);

  console.log('  Bibliography:\n');
  console.log(bibliography.split('\n').map(line => `    ${line}`).join('\n'));

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Group citations by artifact
 */
export function exampleGroupByArtifact() {
  console.log('Example 5: Group Citations by Artifact');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  const grouped = citationLinkGenerator.groupByArtifact(links);

  console.log('  Grouped citations:\n');
  grouped.forEach(group => {
    console.log(`    ${group.display_text} ${group.artifact_id}`);
    console.log(`       Type: ${group.artifact_type}`);
    console.log(`       Date: ${group.note_date}`);
    console.log(`       Author: ${group.author || 'Unknown'}`);
    console.log(`       Citations: ${group.citation_count}`);
    console.log(`       URL: ${group.url}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Format grouped bibliography
 */
export function exampleGroupedBibliography() {
  console.log('Example 6: Format Grouped Bibliography');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);
  const grouped = citationLinkGenerator.groupByArtifact(links);

  const bibliography = citationLinkGenerator.formatGroupedBibliography(grouped);

  console.log('  Grouped bibliography:\n');
  console.log(bibliography.split('\n').map(line => `    ${line}`).join('\n'));

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Generate HTML links
 */
export function exampleHTML() {
  console.log('Example 7: Generate HTML Links');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance().slice(0, 2);
  const links = citationLinkGenerator.generateLinks(provenance);

  const html = citationLinkGenerator.generateHTML(links);

  console.log('  HTML output:\n');
  console.log(`    ${html}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Generate Markdown links
 */
export function exampleMarkdown() {
  console.log('Example 8: Generate Markdown Links');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance().slice(0, 2);
  const links = citationLinkGenerator.generateLinks(provenance);

  const markdown = citationLinkGenerator.generateMarkdown(links);

  console.log('  Markdown output:\n');
  console.log(`    ${markdown}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Validate URLs
 */
export function exampleValidateURL() {
  console.log('Example 9: Validate URLs');
  console.log('-'.repeat(80));

  const urls = [
    'http://localhost:3000/notes/note_123',
    'https://localhost:3000/careplans/plan_456',
    'ftp://localhost:3000/notes/note_123',
    'http://evil.com/notes/note_123',
    'http://localhost:3000/notes/note_123?highlight=10-20',
  ];

  console.log('  URL validation:\n');
  urls.forEach(url => {
    const valid = citationLinkGenerator.validateURL(url);
    console.log(`    ${valid ? '✅' : '❌'} ${url}`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Get unique artifacts count
 */
export function exampleUniqueArtifacts() {
  console.log('Example 10: Get Unique Artifacts Count');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  const uniqueCount = citationLinkGenerator.getUniqueArtifactsCount(links);

  console.log('  Artifact statistics:\n');
  console.log(`    Total citations: ${links.length}`);
  console.log(`    Unique artifacts: ${uniqueCount}`);
  console.log(`    Avg citations per artifact: ${(links.length / uniqueCount).toFixed(1)}\n`);

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Filter citations by type
 */
export function exampleFilterByType() {
  console.log('Example 11: Filter Citations by Type');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  console.log('  Citations by type:\n');

  const types = ['clinical_note', 'care_plan', 'lab_result'];
  types.forEach(type => {
    const filtered = citationLinkGenerator.getCitationsByType(links, type);
    console.log(`    ${type}: ${filtered.length} citations`);
    filtered.forEach(link => {
      console.log(`      ${link.display_text} ${link.artifact_id}`);
    });
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Sort citations by date
 */
export function exampleSortByDate() {
  console.log('Example 12: Sort Citations by Date');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  console.log('  Citations sorted by date (newest first):\n');
  const sorted = citationLinkGenerator.sortByDate(links, false);
  sorted.forEach(link => {
    console.log(`    ${link.display_text} ${link.note_date} - ${link.artifact_id}`);
  });
  console.log('');

  console.log('  Citations sorted by date (oldest first):\n');
  const sortedAsc = citationLinkGenerator.sortByDate(links, true);
  sortedAsc.forEach(link => {
    console.log(`    ${link.display_text} ${link.note_date} - ${link.artifact_id}`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 13: Complete answer with citations
 */
export function exampleAnswerWithCitations() {
  console.log('Example 13: Complete Answer with Citations');
  console.log('-'.repeat(80));

  const provenance = generateSampleProvenance();
  const links = citationLinkGenerator.generateLinks(provenance);

  const answer = `Patient is currently taking Metformin 500mg twice daily for Type 2 Diabetes management [1][3]. Blood glucose levels are improving with the current regimen [3]. A follow-up is scheduled in 2 weeks for blood pressure monitoring [2]. Recent lab results show HbA1c at 6.5%, which is within the target range [4].`;

  const bibliography = citationLinkGenerator.formatBibliography(links);

  console.log('  Complete answer with citations:\n');
  console.log(`    ${answer}\n`);
  console.log(bibliography.split('\n').map(line => `    ${line}`).join('\n'));

  console.log('  ✅ Success\n');
}

/**
 * Example 14: Highlighting enabled/disabled
 */
export function exampleHighlighting() {
  console.log('Example 14: Highlighting Enabled/Disabled');
  console.log('-'.repeat(80));

  console.log('  Current highlighting status:');
  console.log(`    Enabled: ${citationLinkGenerator.isHighlightingEnabled()}\n`);

  console.log('  Link with highlighting disabled:');
  citationLinkGenerator.setHighlightingEnabled(false);
  const link1 = citationLinkGenerator.buildDeepLink('note_123', [18, 47], 'clinical_note');
  console.log(`    ${link1}\n`);

  console.log('  Link with highlighting enabled:');
  citationLinkGenerator.setHighlightingEnabled(true);
  const link2 = citationLinkGenerator.buildDeepLink('note_123', [18, 47], 'clinical_note');
  console.log(`    ${link2}\n`);

  // Reset to default
  citationLinkGenerator.setHighlightingEnabled(false);

  console.log('  ✅ Success\n');
}

/**
 * Example 15: Base URL configuration
 */
export function exampleBaseURL() {
  console.log('Example 15: Base URL Configuration');
  console.log('-'.repeat(80));

  const baseURL = citationLinkGenerator.getBaseURL();

  console.log('  Base URL configuration:\n');
  console.log(`    Base URL: ${baseURL}`);
  console.log(`    Highlighting: ${citationLinkGenerator.isHighlightingEnabled()}\n`);

  console.log('  Example URLs for different artifact types:\n');
  const types = ['clinical_note', 'care_plan', 'medication', 'lab_result', 'imaging'];
  types.forEach(type => {
    const link = citationLinkGenerator.buildDeepLink('artifact_123', [0, 10], type);
    console.log(`    ${type}: ${link}`);
  });
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 16: Explain citation link generator
 */
export function exampleExplain() {
  console.log('Example 16: Explain Citation Link Generator');
  console.log('-'.repeat(80));

  const explanation = citationLinkGenerator.explain();

  console.log('\n' + explanation.split('\n').map(line => `  ${line}`).join('\n'));

  console.log('\n  ✅ Success\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('='.repeat(80));
  console.log('CITATION LINK GENERATOR EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleGenerateLinks();
    exampleBuildDeepLink();
    exampleInlineReferences();
    exampleBibliography();
    exampleGroupByArtifact();
    exampleGroupedBibliography();
    exampleHTML();
    exampleMarkdown();
    exampleValidateURL();
    exampleUniqueArtifacts();
    exampleFilterByType();
    exampleSortByDate();
    exampleAnswerWithCitations();
    exampleHighlighting();
    exampleBaseURL();
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
