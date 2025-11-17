/**
 * Test Data Generator
 *
 * Generates synthetic medical records for testing purposes.
 * Supports seeded random generation for reproducible tests.
 *
 */
import { Artifact } from '../types/artifact.types';
/**
 * Test Data Generator Options
 */
export interface TestDataGeneratorOptions {
    seed?: number;
    baseUrl?: string;
}
/**
 * TestDataGenerator Class
 *
 * Generates realistic synthetic medical records for testing.
 */
export declare class TestDataGenerator {
    private random;
    private baseUrl;
    private readonly medications;
    private readonly conditions;
    private readonly authors;
    private readonly vitals;
    private readonly noteTemplates;
    constructor(options?: TestDataGeneratorOptions);
    /**
     * Generate random date within last N days
     */
    private generateDate;
    /**
     * Generate Care Plan artifact
     */
    generateCarePlan(patientId: string): Artifact;
    /**
     * Generate Medication artifact
     */
    generateMedication(patientId: string): Artifact;
    /**
     * Generate Note artifact
     */
    generateNote(patientId: string): Artifact;
    /**
     * Generate edge case artifacts for testing
     */
    private generateEdgeCases;
    /**
     * Generate multiple artifacts
     *
     * @param count - Number of artifacts to generate
     * @param patientId - Patient ID
     * @param includeEdgeCases - Include edge case artifacts (default: true)
     * @returns Array of generated artifacts
     */
    generateArtifacts(count: number, patientId: string, includeEdgeCases?: boolean): Artifact[];
    /**
     * Export artifacts to JSON
     *
     * @param artifacts - Artifacts to export
     * @param pretty - Pretty-print JSON (default: true)
     * @returns JSON string
     */
    exportToJSON(artifacts: Artifact[], pretty?: boolean): string;
    /**
     * Generate golden dataset
     *
     * Creates a standardized test dataset for regression testing
     */
    generateGoldenDataset(patientId?: string): Artifact[];
    /**
     * Get statistics about generated artifacts
     */
    getStatistics(artifacts: Artifact[]): Record<string, any>;
}
/**
 * Create test data generator instance
 */
export declare function createTestDataGenerator(options?: TestDataGeneratorOptions): TestDataGenerator;
export default TestDataGenerator;
//# sourceMappingURL=test-data-generator.d.ts.map