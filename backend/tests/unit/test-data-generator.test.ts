/**
 * Unit Tests: TestDataGenerator
 *
 * Tests for synthetic medical record generation.
 *
 * Tech Stack: Jest + TypeScript
 */

import { TestDataGenerator, createTestDataGenerator } from '../../src/utils/test-data-generator';
import { Artifact } from '../../src/types/artifact.types';

describe('TestDataGenerator', () => {
  let generator: TestDataGenerator;

  beforeEach(() => {
    generator = createTestDataGenerator({ seed: 12345 });
  });

  describe('Constructor', () => {
    it('should create generator with default options', () => {
      const gen = createTestDataGenerator();
      expect(gen).toBeInstanceOf(TestDataGenerator);
    });

    it('should create generator with custom seed', () => {
      const gen1 = createTestDataGenerator({ seed: 111 });
      const gen2 = createTestDataGenerator({ seed: 111 });

      const artifacts1 = gen1.generateArtifacts(5, 'patient-001', false);
      const artifacts2 = gen2.generateArtifacts(5, 'patient-001', false);

      // Same seed should produce identical results
      expect(artifacts1[0].title).toBe(artifacts2[0].title);
      expect(artifacts1[0].text).toBe(artifacts2[0].text);
    });

    it('should create generator with custom base URL', () => {
      const gen = createTestDataGenerator({
        baseUrl: 'https://custom.api.com',
      });

      const artifact = gen.generateNote('patient-001');
      expect(artifact.source).toContain('https://custom.api.com');
    });
  });

  describe('generateCarePlan', () => {
    it('should generate care plan artifact', () => {
      const carePlan = generator.generateCarePlan('patient-123');

      expect(carePlan).toBeDefined();
      expect(carePlan.type).toBe('care_plan');
      expect(carePlan.patient_id).toBe('patient-123');
      expect(carePlan.id).toBeDefined();
      expect(carePlan.occurred_at).toBeDefined();
      expect(carePlan.text).toBeDefined();
      expect(carePlan.source).toBeDefined();
    });

    it('should include care plan specific content', () => {
      const carePlan = generator.generateCarePlan('patient-456');

      expect(carePlan.text).toContain('Care Plan');
      expect(carePlan.text).toContain('Goals');
      expect(carePlan.text).toContain('Medications');
      expect(carePlan.text).toContain('Follow-up');
    });

    it('should have metadata', () => {
      const carePlan = generator.generateCarePlan('patient-789');

      expect(carePlan.meta).toBeDefined();
      expect(carePlan.meta?.condition).toBeDefined();
      expect(carePlan.meta?.status).toBeDefined();
      expect(carePlan.meta?.medications).toBeDefined();
      expect(Array.isArray(carePlan.meta?.medications)).toBe(true);
    });

    it('should have author', () => {
      const carePlan = generator.generateCarePlan('patient-111');

      expect(carePlan.author).toBeDefined();
      expect(typeof carePlan.author).toBe('string');
      expect(carePlan.author?.length).toBeGreaterThan(0);
    });

    it('should have title', () => {
      const carePlan = generator.generateCarePlan('patient-222');

      expect(carePlan.title).toBeDefined();
      expect(carePlan.title).toContain('Care Plan:');
    });
  });

  describe('generateMedication', () => {
    it('should generate medication artifact', () => {
      const medication = generator.generateMedication('patient-123');

      expect(medication).toBeDefined();
      expect(medication.type).toBe('medication');
      expect(medication.patient_id).toBe('patient-123');
      expect(medication.id).toBeDefined();
      expect(medication.occurred_at).toBeDefined();
      expect(medication.text).toBeDefined();
      expect(medication.source).toBeDefined();
    });

    it('should include medication specific content', () => {
      const medication = generator.generateMedication('patient-456');

      expect(medication.text).toContain('Prescription:');
      expect(medication.text).toContain('Dosage:');
      expect(medication.text).toContain('Frequency:');
      expect(medication.text).toContain('Instructions:');
    });

    it('should have medication metadata', () => {
      const medication = generator.generateMedication('patient-789');

      expect(medication.meta).toBeDefined();
      expect(medication.meta?.medication_name).toBeDefined();
      expect(medication.meta?.dosage).toBeDefined();
      expect(medication.meta?.frequency).toBeDefined();
      expect(medication.meta?.indication).toBeDefined();
      expect(medication.meta?.status).toBeDefined();
    });

    it('should have title with medication name and dosage', () => {
      const medication = generator.generateMedication('patient-111');

      expect(medication.title).toBeDefined();
      expect(medication.title?.length).toBeGreaterThan(0);
    });
  });

  describe('generateNote', () => {
    it('should generate note artifact', () => {
      const note = generator.generateNote('patient-123');

      expect(note).toBeDefined();
      expect(note.type).toBe('note');
      expect(note.patient_id).toBe('patient-123');
      expect(note.id).toBeDefined();
      expect(note.occurred_at).toBeDefined();
      expect(note.text).toBeDefined();
      expect(note.source).toBeDefined();
    });

    it('should include note metadata', () => {
      const note = generator.generateNote('patient-456');

      expect(note.meta).toBeDefined();
      expect(note.meta?.note_type).toBeDefined();
      expect(note.meta?.condition).toBeDefined();
      expect(note.meta?.vitals).toBeDefined();
    });

    it('should have vitals in metadata', () => {
      const note = generator.generateNote('patient-789');

      const vitals = note.meta?.vitals;
      expect(vitals).toBeDefined();
      expect(vitals.bp).toBeDefined();
      expect(vitals.hr).toBeDefined();
      expect(vitals.temp).toBeDefined();
      expect(vitals.weight).toBeDefined();
    });

    it('should have title', () => {
      const note = generator.generateNote('patient-111');

      expect(note.title).toBeDefined();
      expect(note.title).toContain('Note');
    });
  });

  describe('generateArtifacts', () => {
    it('should generate specified number of artifacts', () => {
      const artifacts = generator.generateArtifacts(10, 'patient-123', false);

      expect(artifacts).toBeDefined();
      expect(Array.isArray(artifacts)).toBe(true);
      expect(artifacts.length).toBe(10);
    });

    it('should include edge cases by default', () => {
      const artifacts = generator.generateArtifacts(10, 'patient-123', true);

      expect(artifacts.length).toBeGreaterThan(10); // 10 + edge cases
      const edgeCases = artifacts.filter((a) => a.meta?.edge_case);
      expect(edgeCases.length).toBeGreaterThan(0);
    });

    it('should exclude edge cases when requested', () => {
      const artifacts = generator.generateArtifacts(10, 'patient-123', false);

      expect(artifacts.length).toBe(10);
      const edgeCases = artifacts.filter((a) => a.meta?.edge_case);
      expect(edgeCases.length).toBe(0);
    });

    it('should generate mix of artifact types', () => {
      const artifacts = generator.generateArtifacts(30, 'patient-123', false);

      const carePlans = artifacts.filter((a) => a.type === 'care_plan');
      const medications = artifacts.filter((a) => a.type === 'medication');
      const notes = artifacts.filter((a) => a.type === 'note');

      expect(carePlans.length).toBeGreaterThan(0);
      expect(medications.length).toBeGreaterThan(0);
      expect(notes.length).toBeGreaterThan(0);
    });

    it('should maintain patient_id for all artifacts', () => {
      const artifacts = generator.generateArtifacts(20, 'patient-456', false);

      artifacts.forEach((artifact) => {
        expect(artifact.patient_id).toBe('patient-456');
      });
    });

    it('should generate unique IDs for each artifact', () => {
      const artifacts = generator.generateArtifacts(20, 'patient-789', false);

      const ids = artifacts.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('generateGoldenDataset', () => {
    it('should generate golden dataset', () => {
      const goldenDataset = generator.generateGoldenDataset('patient-test-001');

      expect(goldenDataset).toBeDefined();
      expect(Array.isArray(goldenDataset)).toBe(true);
      expect(goldenDataset.length).toBeGreaterThan(0);
    });

    it('should be reproducible with fixed seed', () => {
      const gen1 = createTestDataGenerator();
      const gen2 = createTestDataGenerator();

      const dataset1 = gen1.generateGoldenDataset('patient-test-001');
      const dataset2 = gen2.generateGoldenDataset('patient-test-001');

      expect(dataset1.length).toBe(dataset2.length);
      expect(dataset1[0].title).toBe(dataset2[0].title);
      expect(dataset1[0].text).toBe(dataset2[0].text);
    });

    it('should include edge cases', () => {
      const goldenDataset = generator.generateGoldenDataset('patient-test-001');

      const edgeCases = goldenDataset.filter((a) => a.meta?.edge_case);
      expect(edgeCases.length).toBeGreaterThan(0);
    });
  });

  describe('exportToJSON', () => {
    it('should export artifacts to JSON', () => {
      const artifacts = generator.generateArtifacts(5, 'patient-123', false);
      const json = generator.exportToJSON(artifacts);

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });

    it('should be valid JSON', () => {
      const artifacts = generator.generateArtifacts(5, 'patient-123', false);
      const json = generator.exportToJSON(artifacts);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include metadata', () => {
      const artifacts = generator.generateArtifacts(5, 'patient-123', false);
      const json = generator.exportToJSON(artifacts);

      const parsed = JSON.parse(json);

      expect(parsed.generated_at).toBeDefined();
      expect(parsed.count).toBe(5);
      expect(parsed.artifacts).toBeDefined();
      expect(parsed.artifacts.length).toBe(5);
    });

    it('should support compact format', () => {
      const artifacts = generator.generateArtifacts(2, 'patient-123', false);
      const compact = generator.exportToJSON(artifacts, false);
      const pretty = generator.exportToJSON(artifacts, true);

      expect(compact.length).toBeLessThan(pretty.length);
      expect(compact).not.toContain('\n  ');
      expect(pretty).toContain('\n  ');
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics', () => {
      const artifacts = generator.generateArtifacts(50, 'patient-123', false);
      const stats = generator.getStatistics(artifacts);

      expect(stats).toBeDefined();
      expect(stats.total).toBe(50);
      expect(stats.by_type).toBeDefined();
      expect(stats.date_range).toBeDefined();
      expect(stats.authors).toBeGreaterThan(0);
      expect(stats.avg_text_length).toBeGreaterThan(0);
    });

    it('should calculate type distribution', () => {
      const artifacts = generator.generateArtifacts(30, 'patient-123', false);
      const stats = generator.getStatistics(artifacts);

      expect(stats.by_type.care_plan).toBeGreaterThan(0);
      expect(stats.by_type.medication).toBeGreaterThan(0);
      expect(stats.by_type.note).toBeGreaterThan(0);

      const total =
        stats.by_type.care_plan + stats.by_type.medication + stats.by_type.note;
      expect(total).toBe(30);
    });

    it('should calculate date range', () => {
      const artifacts = generator.generateArtifacts(20, 'patient-123', false);
      const stats = generator.getStatistics(artifacts);

      expect(stats.date_range.earliest).toBeDefined();
      expect(stats.date_range.latest).toBeDefined();

      const earliest = new Date(stats.date_range.earliest);
      const latest = new Date(stats.date_range.latest);

      expect(earliest.getTime()).toBeLessThanOrEqual(latest.getTime());
    });
  });

  describe('Reproducibility', () => {
    it('should produce same results with same seed', () => {
      const gen1 = createTestDataGenerator({ seed: 99999 });
      const gen2 = createTestDataGenerator({ seed: 99999 });

      const artifacts1 = gen1.generateArtifacts(10, 'patient-001', false);
      const artifacts2 = gen2.generateArtifacts(10, 'patient-001', false);

      artifacts1.forEach((artifact1, index) => {
        const artifact2 = artifacts2[index];

        expect(artifact1.type).toBe(artifact2.type);
        expect(artifact1.title).toBe(artifact2.title);
        expect(artifact1.text).toBe(artifact2.text);
        expect(artifact1.author).toBe(artifact2.author);
      });
    });

    it('should produce different results with different seeds', () => {
      const gen1 = createTestDataGenerator({ seed: 11111 });
      const gen2 = createTestDataGenerator({ seed: 22222 });

      const artifacts1 = gen1.generateArtifacts(10, 'patient-001', false);
      const artifacts2 = gen2.generateArtifacts(10, 'patient-001', false);

      // At least one artifact should be different
      const hasDifference = artifacts1.some((artifact1, index) => {
        const artifact2 = artifacts2[index];
        return artifact1.text !== artifact2.text || artifact1.title !== artifact2.title;
      });

      expect(hasDifference).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero artifacts', () => {
      const artifacts = generator.generateArtifacts(0, 'patient-123', false);

      expect(artifacts).toBeDefined();
      expect(artifacts.length).toBe(0);
    });

    it('should handle large number of artifacts', () => {
      const artifacts = generator.generateArtifacts(1000, 'patient-123', false);

      expect(artifacts.length).toBe(1000);
      expect(artifacts.every((a) => a.id)).toBe(true);
      expect(artifacts.every((a) => a.text)).toBe(true);
    });

    it('should generate edge case artifacts', () => {
      const gen = createTestDataGenerator({ seed: 12345 });
      const artifacts = gen.generateArtifacts(5, 'patient-123', true);

      const edgeCases = artifacts.filter((a) => a.meta?.edge_case);
      expect(edgeCases.length).toBeGreaterThan(0);

      const edgeCaseTypes = edgeCases.map((a) => a.meta?.edge_case);
      expect(edgeCaseTypes).toContain('empty');
      expect(edgeCaseTypes).toContain('very_long');
      expect(edgeCaseTypes).toContain('special_chars');
      expect(edgeCaseTypes).toContain('unicode');
    });
  });
});
