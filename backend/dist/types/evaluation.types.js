"use strict";
/**
 * Human Evaluation Framework Types
 *
 * Type definitions for qualitative assessment of RAG pipeline responses.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_ISSUES = exports.EVALUATION_CRITERIA = exports.RATING_SCALE = void 0;
/**
 * Rating scale descriptions
 */
exports.RATING_SCALE = {
    5: 'Excellent',
    4: 'Good',
    3: 'Acceptable',
    2: 'Poor',
    1: 'Unacceptable',
};
/**
 * Evaluation criteria descriptions
 */
exports.EVALUATION_CRITERIA = {
    accuracy: {
        name: 'Accuracy',
        description: 'Is the answer factually correct?',
        guidelines: [
            '5 - All facts are correct and verified',
            '4 - Facts are mostly correct with minor issues',
            '3 - Some facts are correct, some questionable',
            '2 - Many facts are incorrect or unverified',
            '1 - Facts are incorrect or misleading',
        ],
    },
    completeness: {
        name: 'Completeness',
        description: 'Does it answer all parts of the question?',
        guidelines: [
            '5 - Fully answers all aspects of the question',
            '4 - Answers most aspects with minor gaps',
            '3 - Answers some aspects, missing key information',
            '2 - Partial answer with significant gaps',
            '1 - Fails to answer the question',
        ],
    },
    citation_quality: {
        name: 'Citation Quality',
        description: 'Are sources relevant and properly cited?',
        guidelines: [
            '5 - All citations are relevant and accurate',
            '4 - Citations are mostly relevant and accurate',
            '3 - Some citations are relevant, some questionable',
            '2 - Many citations are irrelevant or inaccurate',
            '1 - No citations or completely irrelevant',
        ],
    },
    relevance: {
        name: 'Relevance',
        description: 'Is the response on-topic?',
        guidelines: [
            '5 - Completely on-topic and focused',
            '4 - Mostly on-topic with minor tangents',
            '3 - Somewhat on-topic with noticeable drift',
            '2 - Frequently off-topic',
            '1 - Completely off-topic or irrelevant',
        ],
    },
};
/**
 * Common issues that can be reported during evaluation
 */
exports.COMMON_ISSUES = [
    'Missing information',
    'Incorrect facts',
    'Irrelevant sources',
    'Missing citations',
    'Off-topic content',
    'Incomplete answer',
    'Unclear explanation',
    'Contradictory information',
    'Out of date information',
    'Poor formatting',
    'Other',
];
//# sourceMappingURL=evaluation.types.js.map