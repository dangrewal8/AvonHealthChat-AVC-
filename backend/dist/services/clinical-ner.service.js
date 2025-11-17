"use strict";
/**
 * Clinical NER Service
 *
 * Clinical entity recognition for medical terms in chunks.
 *
 * Requirements:
 * - Pattern-based extraction (medications, dosages, conditions, symptoms, procedures)
 * - Medical abbreviations handling
 * - Entity normalization
 * - Char offset tracking
 *
 * NO spaCy, NLTK, or Python NLP libraries
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Clinical NER Class
 *
 * Extract and normalize clinical entities from medical text
 */
class ClinicalNER {
    /**
     * Medical abbreviations mapping
     *
     * Common medical abbreviations and their expansions
     */
    abbreviations = {
        // Conditions
        HTN: { expanded: 'Hypertension', type: 'condition' },
        DM: { expanded: 'Diabetes Mellitus', type: 'condition' },
        'T2DM': { expanded: 'Type 2 Diabetes Mellitus', type: 'condition' },
        'T1DM': { expanded: 'Type 1 Diabetes Mellitus', type: 'condition' },
        CAD: { expanded: 'Coronary Artery Disease', type: 'condition' },
        CHF: { expanded: 'Congestive Heart Failure', type: 'condition' },
        COPD: { expanded: 'Chronic Obstructive Pulmonary Disease', type: 'condition' },
        CKD: { expanded: 'Chronic Kidney Disease', type: 'condition' },
        GERD: { expanded: 'Gastroesophageal Reflux Disease', type: 'condition' },
        UTI: { expanded: 'Urinary Tract Infection', type: 'condition' },
        MI: { expanded: 'Myocardial Infarction', type: 'condition' },
        CVA: { expanded: 'Cerebrovascular Accident', type: 'condition' },
        DVT: { expanded: 'Deep Vein Thrombosis', type: 'condition' },
        PE: { expanded: 'Pulmonary Embolism', type: 'condition' },
        ESRD: { expanded: 'End Stage Renal Disease', type: 'condition' },
        // Dosage/Administration
        PRN: { expanded: 'As Needed', type: 'dosage' },
        'q6h': { expanded: 'Every 6 Hours', type: 'dosage' },
        'q8h': { expanded: 'Every 8 Hours', type: 'dosage' },
        'q12h': { expanded: 'Every 12 Hours', type: 'dosage' },
        QD: { expanded: 'Once Daily', type: 'dosage' },
        BID: { expanded: 'Twice Daily', type: 'dosage' },
        TID: { expanded: 'Three Times Daily', type: 'dosage' },
        QID: { expanded: 'Four Times Daily', type: 'dosage' },
        PO: { expanded: 'By Mouth', type: 'dosage' },
        IV: { expanded: 'Intravenous', type: 'dosage' },
        IM: { expanded: 'Intramuscular', type: 'dosage' },
        SC: { expanded: 'Subcutaneous', type: 'dosage' },
        SL: { expanded: 'Sublingual', type: 'dosage' },
        // Procedures (common abbreviations)
        EKG: { expanded: 'Electrocardiogram', type: 'procedure' },
        ECG: { expanded: 'Electrocardiogram', type: 'procedure' },
        CBC: { expanded: 'Complete Blood Count', type: 'procedure' },
        CMP: { expanded: 'Comprehensive Metabolic Panel', type: 'procedure' },
        BMP: { expanded: 'Basic Metabolic Panel', type: 'procedure' },
        MRI: { expanded: 'Magnetic Resonance Imaging', type: 'procedure' },
        CT: { expanded: 'Computed Tomography', type: 'procedure' },
        US: { expanded: 'Ultrasound', type: 'procedure' },
        XR: { expanded: 'X-Ray', type: 'procedure' },
    };
    /**
     * Medication name patterns
     *
     * Common suffixes and patterns for drug names
     */
    medicationSuffixes = [
        'cillin', // Antibiotics: penicillin, amoxicillin
        'mycin', // Antibiotics: erythromycin, azithromycin
        'cycline', // Antibiotics: tetracycline, doxycycline
        'oxacin', // Antibiotics: ciprofloxacin, levofloxacin
        'olol', // Beta blockers: metoprolol, atenolol
        'pril', // ACE inhibitors: lisinopril, enalapril
        'sartan', // ARBs: losartan, valsartan
        'statin', // Statins: atorvastatin, simvastatin
        'prazole', // PPIs: omeprazole, pantoprazole
        'dipine', // Calcium channel blockers: amlodipine, nifedipine
        'zepam', // Benzodiazepines: diazepam, lorazepam
        'zolam', // Benzodiazepines: alprazolam
        'tidine', // H2 blockers: ranitidine, famotidine
        'formin', // Diabetes: metformin
        'gliptin', // DPP-4 inhibitors: sitagliptin
        'gliflozin', // SGLT2 inhibitors: empagliflozin
        'mab', // Monoclonal antibodies: adalimumab
    ];
    /**
     * Common medication names
     */
    commonMedications = [
        'aspirin',
        'tylenol',
        'acetaminophen',
        'ibuprofen',
        'advil',
        'motrin',
        'aleve',
        'naproxen',
        'insulin',
        'warfarin',
        'coumadin',
        'heparin',
        'prednisone',
        'hydrocortisone',
        'albuterol',
        'ventolin',
        'gabapentin',
        'neurontin',
        'tramadol',
        'hydrocodone',
        'oxycodone',
        'morphine',
        'fentanyl',
        'levothyroxine',
        'synthroid',
        'furosemide',
        'lasix',
        'hydrochlorothiazide',
    ];
    /**
     * Dosage patterns
     *
     * Regex patterns for dosage recognition
     */
    dosagePatterns = [
        /\b\d+\.?\d*\s*(mg|milligrams?|mcg|micrograms?)\b/gi,
        /\b\d+\.?\d*\s*(ml|milliliters?|cc)\b/gi,
        /\b\d+\.?\d*\s*(g|grams?)\b/gi,
        /\b\d+\.?\d*\s*(units?|IU|international units?)\b/gi,
        /\b\d+\.?\d*\s*(tablets?|caps?|capsules?)\b/gi,
        /\b\d+\.?\d*\s*%\s*(solution|cream|ointment)\b/gi,
    ];
    /**
     * Condition patterns
     *
     * Common medical conditions
     */
    conditions = [
        'hypertension',
        'diabetes',
        'diabetes mellitus',
        'heart failure',
        'heart disease',
        'coronary artery disease',
        'atrial fibrillation',
        'asthma',
        'copd',
        'pneumonia',
        'bronchitis',
        'infection',
        'sepsis',
        'stroke',
        'cancer',
        'carcinoma',
        'tumor',
        'arthritis',
        'osteoarthritis',
        'rheumatoid arthritis',
        'depression',
        'anxiety',
        'dementia',
        'alzheimer',
        'parkinson',
        'epilepsy',
        'seizure',
        'kidney disease',
        'renal failure',
        'liver disease',
        'cirrhosis',
        'hepatitis',
        'anemia',
        'obesity',
        'hypothyroidism',
        'hyperthyroidism',
    ];
    /**
     * Symptom patterns
     *
     * Common patient symptoms
     */
    symptoms = [
        'pain',
        'chest pain',
        'abdominal pain',
        'back pain',
        'headache',
        'migraine',
        'fever',
        'temperature',
        'chills',
        'fatigue',
        'weakness',
        'dizziness',
        'lightheadedness',
        'nausea',
        'vomiting',
        'diarrhea',
        'constipation',
        'cough',
        'shortness of breath',
        'dyspnea',
        'wheezing',
        'rash',
        'itching',
        'swelling',
        'edema',
        'bleeding',
        'bruising',
        'numbness',
        'tingling',
        'confusion',
        'disorientation',
    ];
    /**
     * Procedure patterns
     *
     * Common medical procedures
     */
    procedures = [
        'surgery',
        'operation',
        'biopsy',
        'endoscopy',
        'colonoscopy',
        'bronchoscopy',
        'catheterization',
        'angioplasty',
        'stent placement',
        'bypass',
        'transplant',
        'dialysis',
        'chemotherapy',
        'radiation therapy',
        'physical therapy',
        'blood transfusion',
        'injection',
        'vaccination',
        'immunization',
        'intubation',
        'ventilation',
    ];
    /**
     * Extract entities from chunk text
     *
     * Main entry point for entity extraction
     *
     * @param chunkText - Text to extract entities from
     * @returns Array of clinical entities
     */
    extractEntities(chunkText) {
        const entities = [];
        const matches = [];
        // Extract each entity type
        matches.push(...this.extractMedications(chunkText));
        matches.push(...this.extractDosages(chunkText));
        matches.push(...this.extractConditions(chunkText));
        matches.push(...this.extractSymptoms(chunkText));
        matches.push(...this.extractProcedures(chunkText));
        matches.push(...this.extractAbbreviations(chunkText));
        // Remove duplicates and overlapping matches
        const uniqueMatches = this.deduplicateMatches(matches);
        // Convert to ClinicalEntity objects with normalization
        for (const match of uniqueMatches) {
            const entity = {
                text: match.text,
                type: match.type,
                char_offsets: [match.start, match.end],
                normalized: '', // Will be filled by normalizeEntity
            };
            // Normalize the entity
            entity.normalized = this.normalizeEntity(entity);
            entities.push(entity);
        }
        return entities;
    }
    /**
     * Normalize entity
     *
     * Convert entity to standardized form
     *
     * @param entity - Entity to normalize
     * @returns Normalized string
     */
    normalizeEntity(entity) {
        const text = entity.text.trim();
        const upperText = text.toUpperCase();
        // Check if it's a known abbreviation
        if (this.abbreviations[upperText]) {
            return this.abbreviations[upperText].expanded;
        }
        // Check variants (with/without periods)
        const noPeriods = upperText.replace(/\./g, '');
        if (this.abbreviations[noPeriods]) {
            return this.abbreviations[noPeriods].expanded;
        }
        // For medications, lowercase
        if (entity.type === 'medication') {
            return text.toLowerCase();
        }
        // For dosages, standardize units
        if (entity.type === 'dosage') {
            return this.normalizeDosage(text);
        }
        // For conditions/symptoms/procedures, title case
        return this.toTitleCase(text);
    }
    /**
     * Extract medications
     *
     * Find medication names using suffix patterns and common names
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    extractMedications(text) {
        const matches = [];
        // Extract by suffix patterns
        for (const suffix of this.medicationSuffixes) {
            const regex = new RegExp(`\\b\\w*${suffix}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    type: 'medication',
                    start: match.index,
                    end: match.index + match[0].length,
                });
            }
        }
        // Extract common medication names
        for (const med of this.commonMedications) {
            const regex = new RegExp(`\\b${med}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    type: 'medication',
                    start: match.index,
                    end: match.index + match[0].length,
                });
            }
        }
        return matches;
    }
    /**
     * Extract dosages
     *
     * Find dosage information using patterns
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    extractDosages(text) {
        const matches = [];
        for (const pattern of this.dosagePatterns) {
            // Reset regex
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    type: 'dosage',
                    start: match.index,
                    end: match.index + match[0].length,
                });
            }
        }
        return matches;
    }
    /**
     * Extract conditions
     *
     * Find medical conditions
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    extractConditions(text) {
        const matches = [];
        for (const condition of this.conditions) {
            const regex = new RegExp(`\\b${this.escapeRegex(condition)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    type: 'condition',
                    start: match.index,
                    end: match.index + match[0].length,
                });
            }
        }
        return matches;
    }
    /**
     * Extract symptoms
     *
     * Find patient symptoms
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    extractSymptoms(text) {
        const matches = [];
        for (const symptom of this.symptoms) {
            const regex = new RegExp(`\\b${this.escapeRegex(symptom)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    type: 'symptom',
                    start: match.index,
                    end: match.index + match[0].length,
                });
            }
        }
        return matches;
    }
    /**
     * Extract procedures
     *
     * Find medical procedures
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    extractProcedures(text) {
        const matches = [];
        for (const procedure of this.procedures) {
            const regex = new RegExp(`\\b${this.escapeRegex(procedure)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    type: 'procedure',
                    start: match.index,
                    end: match.index + match[0].length,
                });
            }
        }
        return matches;
    }
    /**
     * Extract abbreviations
     *
     * Find known medical abbreviations
     *
     * @param text - Text to search
     * @returns Array of pattern matches
     */
    extractAbbreviations(text) {
        const matches = [];
        for (const abbr in this.abbreviations) {
            const mapping = this.abbreviations[abbr];
            // Try exact match
            const regex = new RegExp(`\\b${this.escapeRegex(abbr)}\\b`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    type: mapping.type,
                    start: match.index,
                    end: match.index + match[0].length,
                });
            }
        }
        return matches;
    }
    /**
     * Deduplicate matches
     *
     * Remove duplicate and overlapping matches
     *
     * @param matches - Array of pattern matches
     * @returns Deduplicated array
     */
    deduplicateMatches(matches) {
        // Sort by start position
        matches.sort((a, b) => a.start - b.start);
        const unique = [];
        let lastEnd = -1;
        for (const match of matches) {
            // Skip if overlaps with previous match
            if (match.start < lastEnd) {
                continue;
            }
            // Skip if duplicate position and text
            const isDuplicate = unique.some((u) => u.start === match.start &&
                u.end === match.end &&
                u.text.toLowerCase() === match.text.toLowerCase());
            if (!isDuplicate) {
                unique.push(match);
                lastEnd = match.end;
            }
        }
        return unique;
    }
    /**
     * Normalize dosage
     *
     * Standardize dosage format
     *
     * @param dosage - Dosage string
     * @returns Normalized dosage
     */
    normalizeDosage(dosage) {
        let normalized = dosage.toLowerCase().trim();
        // Standardize units
        normalized = normalized.replace(/milligrams?/g, 'mg');
        normalized = normalized.replace(/micrograms?/g, 'mcg');
        normalized = normalized.replace(/milliliters?/g, 'ml');
        normalized = normalized.replace(/grams?/g, 'g');
        normalized = normalized.replace(/international units?/g, 'IU');
        normalized = normalized.replace(/tablets?/g, 'tablet');
        normalized = normalized.replace(/caps?|capsules?/g, 'capsule');
        // Remove extra spaces
        normalized = normalized.replace(/\s+/g, ' ');
        return normalized;
    }
    /**
     * Convert to title case
     *
     * @param text - Text to convert
     * @returns Title cased text
     */
    toTitleCase(text) {
        return text
            .toLowerCase()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    /**
     * Escape regex special characters
     *
     * @param text - Text to escape
     * @returns Escaped text
     */
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Get extraction statistics
     *
     * Analyze extracted entities
     *
     * @param entities - Extracted entities
     * @param chunkId - Chunk ID
     * @returns Extraction result with statistics
     */
    getExtractionStats(entities, chunkId) {
        const byType = {
            medication: 0,
            condition: 0,
            symptom: 0,
            procedure: 0,
            dosage: 0,
        };
        for (const entity of entities) {
            byType[entity.type]++;
        }
        return {
            chunk_id: chunkId,
            entities,
            entity_count: entities.length,
            by_type: byType,
        };
    }
    /**
     * Explain Clinical NER
     *
     * @returns Explanation string
     */
    explain() {
        return `Clinical NER (Named Entity Recognition):

Purpose:
Extract and normalize clinical entities from medical text chunks.

Entity Types:
1. Medications: Drug names and brand names
2. Dosages: Amounts, units, frequencies
3. Conditions: Diagnoses and diseases
4. Symptoms: Patient-reported symptoms
5. Procedures: Medical procedures and tests

Pattern-Based Extraction:
- Medication suffixes: ${this.medicationSuffixes.slice(0, 5).join(', ')}, etc.
- Common medications: ${this.commonMedications.slice(0, 5).join(', ')}, etc.
- Dosage patterns: numbers + units (mg, ml, units, tablets)
- Condition names: ${this.conditions.slice(0, 5).join(', ')}, etc.
- Symptom names: ${this.symptoms.slice(0, 5).join(', ')}, etc.
- Procedure names: ${this.procedures.slice(0, 5).join(', ')}, etc.

Medical Abbreviations:
${Object.entries(this.abbreviations)
            .slice(0, 10)
            .map(([abbr, data]) => `- ${abbr} → ${data.expanded}`)
            .join('\n')}
... and ${Object.keys(this.abbreviations).length - 10} more

Entity Normalization:
- Abbreviations expanded to full terms
- Medications lowercased
- Dosages standardized (e.g., "milligrams" → "mg")
- Conditions/symptoms/procedures title-cased

Char Offset Tracking:
- Each entity includes [start, end] position in chunk
- Enables precise provenance and highlighting
- Supports citation and context display

Deduplication:
- Removes overlapping matches
- Handles same term appearing multiple times
- Prioritizes by position

Integration:
1. Chunk text during indexing
2. Extract entities from each chunk
3. Store entities with chunk metadata
4. Use for enhanced retrieval (entity-based search)
5. Display in results for context

Tech Stack: Node.js + TypeScript ONLY
NO external NLP libraries (spaCy, NLTK, etc.)
Pure pattern-based matching using regex`;
    }
}
// Export singleton instance
const clinicalNER = new ClinicalNER();
exports.default = clinicalNER;
//# sourceMappingURL=clinical-ner.service.js.map