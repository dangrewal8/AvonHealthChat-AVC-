"use strict";
/**
 * Test Data Generator
 *
 * Generates synthetic medical records for testing purposes.
 * Supports seeded random generation for reproducible tests.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDataGenerator = void 0;
exports.createTestDataGenerator = createTestDataGenerator;
const uuid_1 = require("uuid");
/**
 * Seeded Random Number Generator
 * Uses Linear Congruential Generator (LCG) for reproducible randomness
 */
class SeededRandom {
    seed;
    constructor(seed = Date.now()) {
        this.seed = seed;
    }
    /**
     * Generate next random number (0-1)
     */
    next() {
        // LCG parameters (same as Java's Random)
        const a = 1103515245;
        const c = 12345;
        const m = 2 ** 31;
        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }
    /**
     * Generate random integer between min (inclusive) and max (exclusive)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }
    /**
     * Pick random item from array
     */
    pick(array) {
        return array[this.nextInt(0, array.length)];
    }
    /**
     * Shuffle array
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
/**
 * TestDataGenerator Class
 *
 * Generates realistic synthetic medical records for testing.
 */
class TestDataGenerator {
    random;
    baseUrl;
    // Medical data pools
    medications = [
        { name: 'Ibuprofen', dosage: '200mg', frequency: 'twice daily', condition: 'pain' },
        { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily', condition: 'hypertension' },
        { name: 'Metformin', dosage: '500mg', frequency: 'twice daily', condition: 'diabetes' },
        { name: 'Amlodipine', dosage: '5mg', frequency: 'once daily', condition: 'hypertension' },
        { name: 'Atorvastatin', dosage: '20mg', frequency: 'once daily', condition: 'high cholesterol' },
        { name: 'Omeprazole', dosage: '20mg', frequency: 'once daily', condition: 'acid reflux' },
        { name: 'Levothyroxine', dosage: '50mcg', frequency: 'once daily', condition: 'hypothyroidism' },
        { name: 'Sertraline', dosage: '50mg', frequency: 'once daily', condition: 'depression' },
        { name: 'Albuterol', dosage: '90mcg', frequency: 'as needed', condition: 'asthma' },
        { name: 'Gabapentin', dosage: '300mg', frequency: 'three times daily', condition: 'neuropathy' },
    ];
    conditions = [
        'Hypertension',
        'Type 2 Diabetes',
        'Chronic Pain',
        'High Cholesterol',
        'Asthma',
        'GERD',
        'Hypothyroidism',
        'Depression',
        'Anxiety',
        'Osteoarthritis',
        'Migraine',
        'Allergic Rhinitis',
    ];
    authors = [
        'Dr. Sarah Smith',
        'Dr. Michael Johnson',
        'Dr. Emily Williams',
        'Dr. James Brown',
        'Dr. Jennifer Davis',
        'Nurse Patricia Wilson',
        'Nurse Robert Taylor',
        'Nurse Linda Anderson',
        'PA Christopher Lee',
        'PA Jessica Martinez',
    ];
    vitals = [
        { bp: '120/80', hr: 72, temp: 98.6, weight: 165 },
        { bp: '135/85', hr: 78, temp: 98.4, weight: 180 },
        { bp: '145/90', hr: 85, temp: 99.1, weight: 195 },
        { bp: '110/70', hr: 65, temp: 98.2, weight: 150 },
        { bp: '130/82', hr: 75, temp: 98.7, weight: 170 },
    ];
    noteTemplates = [
        {
            type: 'progress',
            template: (condition, vital) => `Patient presents for follow-up of ${condition}. ` +
                `Vital signs: BP ${vital.bp}, HR ${vital.hr}, Temp ${vital.temp}°F, Weight ${vital.weight} lbs. ` +
                `Patient reports compliance with medication regimen. No new concerns reported.`,
        },
        {
            type: 'assessment',
            template: (condition, vital) => `Chief Complaint: ${condition}\n\n` +
                `Vitals: BP ${vital.bp}, HR ${vital.hr}, Temp ${vital.temp}°F\n\n` +
                `Assessment: Continue current treatment plan. Patient shows good disease management.`,
        },
        {
            type: 'consultation',
            template: (condition) => `Consultation regarding ${condition}. ` +
                `Reviewed patient history and current medications. ` +
                `Recommendations provided for ongoing management.`,
        },
    ];
    constructor(options = {}) {
        this.random = new SeededRandom(options.seed);
        this.baseUrl = options.baseUrl || 'https://demo-api.avonhealth.com/v2';
    }
    /**
     * Generate random date within last N days
     */
    generateDate(daysBack = 180) {
        const now = new Date();
        const daysAgo = this.random.nextInt(0, daysBack);
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return date.toISOString();
    }
    /**
     * Generate Care Plan artifact
     */
    generateCarePlan(patientId) {
        const condition = this.random.pick(this.conditions);
        const author = this.random.pick(this.authors);
        const relatedMeds = this.medications.filter((m) => m.condition.toLowerCase().includes(condition.toLowerCase().split(' ')[0]));
        const medsList = relatedMeds.length > 0
            ? relatedMeds.slice(0, this.random.nextInt(1, Math.min(3, relatedMeds.length + 1)))
            : [this.random.pick(this.medications)];
        const text = `Care Plan for ${condition}\n\n` +
            `Goals:\n` +
            `- Manage ${condition} effectively\n` +
            `- Monitor vital signs regularly\n` +
            `- Maintain medication compliance\n\n` +
            `Medications:\n` +
            medsList.map((m) => `- ${m.name} ${m.dosage} ${m.frequency}`).join('\n') +
            `\n\nFollow-up:\n` +
            `- Schedule follow-up in ${this.random.pick(['2 weeks', '1 month', '3 months'])}\n` +
            `- Monitor for adverse effects\n` +
            `- Track symptoms daily`;
        return {
            id: (0, uuid_1.v4)(),
            type: 'care_plan',
            patient_id: patientId,
            author,
            occurred_at: this.generateDate(90),
            title: `Care Plan: ${condition}`,
            text,
            source: `${this.baseUrl}/care_plans/${(0, uuid_1.v4)()}`,
            meta: {
                condition,
                status: this.random.pick(['active', 'under_review', 'completed']),
                medications: medsList.map((m) => m.name),
            },
        };
    }
    /**
     * Generate Medication artifact
     */
    generateMedication(patientId) {
        const med = this.random.pick(this.medications);
        const author = this.random.pick(this.authors);
        const startDate = this.generateDate(180);
        const text = `Prescription: ${med.name}\n\n` +
            `Dosage: ${med.dosage}\n` +
            `Frequency: ${med.frequency}\n` +
            `Indication: ${med.condition}\n\n` +
            `Instructions:\n` +
            `- Take ${med.frequency}\n` +
            `- Take with ${this.random.pick(['food', 'water', 'or without food'])}\n` +
            `- Do not ${this.random.pick(['skip doses', 'double doses', 'crush tablets'])}\n\n` +
            `Side Effects to Monitor:\n` +
            `- ${this.random.pick(['Nausea', 'Dizziness', 'Headache', 'Fatigue'])}\n` +
            `- ${this.random.pick(['Drowsiness', 'Dry mouth', 'Upset stomach'])}\n\n` +
            `Refills: ${this.random.nextInt(0, 6)}`;
        return {
            id: (0, uuid_1.v4)(),
            type: 'medication',
            patient_id: patientId,
            author,
            occurred_at: startDate,
            title: `${med.name} ${med.dosage}`,
            text,
            source: `${this.baseUrl}/medications/${(0, uuid_1.v4)()}`,
            meta: {
                medication_name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                indication: med.condition,
                status: this.random.pick(['active', 'discontinued', 'completed']),
            },
        };
    }
    /**
     * Generate Note artifact
     */
    generateNote(patientId) {
        const condition = this.random.pick(this.conditions);
        const author = this.random.pick(this.authors);
        const vital = this.random.pick(this.vitals);
        const noteTemplate = this.random.pick(this.noteTemplates);
        const text = noteTemplate.template(condition, vital);
        return {
            id: (0, uuid_1.v4)(),
            type: 'note',
            patient_id: patientId,
            author,
            occurred_at: this.generateDate(180),
            title: `${noteTemplate.type.charAt(0).toUpperCase() + noteTemplate.type.slice(1)} Note - ${condition}`,
            text,
            source: `${this.baseUrl}/notes/${(0, uuid_1.v4)()}`,
            meta: {
                note_type: noteTemplate.type,
                condition,
                vitals: vital,
            },
        };
    }
    /**
     * Generate edge case artifacts for testing
     */
    generateEdgeCases(patientId) {
        const edgeCases = [];
        // Empty text
        edgeCases.push({
            id: (0, uuid_1.v4)(),
            type: 'note',
            patient_id: patientId,
            author: 'System',
            occurred_at: this.generateDate(),
            title: 'Empty Note',
            text: '',
            source: `${this.baseUrl}/notes/${(0, uuid_1.v4)()}`,
            meta: { edge_case: 'empty' },
        });
        // Very long text (5000+ chars)
        const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
        edgeCases.push({
            id: (0, uuid_1.v4)(),
            type: 'note',
            patient_id: patientId,
            author: this.random.pick(this.authors),
            occurred_at: this.generateDate(),
            title: 'Very Long Note',
            text: longText,
            source: `${this.baseUrl}/notes/${(0, uuid_1.v4)()}`,
            meta: { edge_case: 'very_long', length: longText.length },
        });
        // Special characters
        edgeCases.push({
            id: (0, uuid_1.v4)(),
            type: 'note',
            patient_id: patientId,
            author: 'Dr. O\'Brien',
            occurred_at: this.generateDate(),
            title: 'Special Characters: "Test" & <Symbols>',
            text: 'Patient reports: "I\'m feeling better" & symptoms have improved. Temperature: 98.6°F. Notes: <Normal>',
            source: `${this.baseUrl}/notes/${(0, uuid_1.v4)()}`,
            meta: { edge_case: 'special_chars' },
        });
        // Unicode characters
        edgeCases.push({
            id: (0, uuid_1.v4)(),
            type: 'medication',
            patient_id: patientId,
            author: 'Dr. García',
            occurred_at: this.generateDate(),
            title: 'Medication with Unicode: Ñ, É, ü',
            text: 'Prescripción: Naproxén 500mg\nDosificación: Según indicación médica\n\n© 2024 Healthcare System',
            source: `${this.baseUrl}/medications/${(0, uuid_1.v4)()}`,
            meta: { edge_case: 'unicode' },
        });
        // Minimal metadata
        edgeCases.push({
            id: (0, uuid_1.v4)(),
            type: 'care_plan',
            patient_id: patientId,
            occurred_at: this.generateDate(),
            text: 'Minimal care plan with no author, title, or meta',
            source: `${this.baseUrl}/care_plans/${(0, uuid_1.v4)()}`,
        });
        return edgeCases;
    }
    /**
     * Generate multiple artifacts
     *
     * @param count - Number of artifacts to generate
     * @param patientId - Patient ID
     * @param includeEdgeCases - Include edge case artifacts (default: true)
     * @returns Array of generated artifacts
     */
    generateArtifacts(count, patientId, includeEdgeCases = true) {
        const artifacts = [];
        // Calculate distribution (40% notes, 40% medications, 20% care plans)
        const noteCount = Math.floor(count * 0.4);
        const medCount = Math.floor(count * 0.4);
        const carePlanCount = count - noteCount - medCount;
        // Generate artifacts
        for (let i = 0; i < noteCount; i++) {
            artifacts.push(this.generateNote(patientId));
        }
        for (let i = 0; i < medCount; i++) {
            artifacts.push(this.generateMedication(patientId));
        }
        for (let i = 0; i < carePlanCount; i++) {
            artifacts.push(this.generateCarePlan(patientId));
        }
        // Add edge cases
        if (includeEdgeCases) {
            artifacts.push(...this.generateEdgeCases(patientId));
        }
        // Shuffle to mix types
        return this.random.shuffle(artifacts);
    }
    /**
     * Export artifacts to JSON
     *
     * @param artifacts - Artifacts to export
     * @param pretty - Pretty-print JSON (default: true)
     * @returns JSON string
     */
    exportToJSON(artifacts, pretty = true) {
        const data = {
            generated_at: new Date().toISOString(),
            count: artifacts.length,
            artifacts,
        };
        return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    }
    /**
     * Generate golden dataset
     *
     * Creates a standardized test dataset for regression testing
     */
    generateGoldenDataset(patientId = 'patient-test-001') {
        // Use fixed seed for reproducibility
        this.random = new SeededRandom(12345);
        return this.generateArtifacts(50, patientId, true);
    }
    /**
     * Get statistics about generated artifacts
     */
    getStatistics(artifacts) {
        const stats = {
            total: artifacts.length,
            by_type: {
                care_plan: artifacts.filter((a) => a.type === 'care_plan').length,
                medication: artifacts.filter((a) => a.type === 'medication').length,
                note: artifacts.filter((a) => a.type === 'note').length,
            },
            date_range: {
                earliest: artifacts.reduce((min, a) => (a.occurred_at < min ? a.occurred_at : min), artifacts[0]?.occurred_at || ''),
                latest: artifacts.reduce((max, a) => (a.occurred_at > max ? a.occurred_at : max), artifacts[0]?.occurred_at || ''),
            },
            authors: [...new Set(artifacts.map((a) => a.author).filter(Boolean))].length,
            avg_text_length: Math.round(artifacts.reduce((sum, a) => sum + a.text.length, 0) / artifacts.length),
            with_metadata: artifacts.filter((a) => a.meta && Object.keys(a.meta).length > 0).length,
        };
        return stats;
    }
}
exports.TestDataGenerator = TestDataGenerator;
/**
 * Create test data generator instance
 */
function createTestDataGenerator(options) {
    return new TestDataGenerator(options);
}
exports.default = TestDataGenerator;
//# sourceMappingURL=test-data-generator.js.map