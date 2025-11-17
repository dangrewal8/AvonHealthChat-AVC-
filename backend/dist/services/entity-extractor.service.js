"use strict";
/**
 * Named Entity Extraction Service
 *
 * Rule-based entity extraction for medical queries using pattern matching
 *
 * Features:
 * - Extract medications, conditions, symptoms, dates, persons
 * - Entity normalization (lowercase, stemming, abbreviations)
 * - Confidence scoring
 * - Integration with TemporalParser for date extraction
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const temporal_parser_service_1 = __importDefault(require("./temporal-parser.service"));
/**
 * Entity Extractor Class
 *
 * Rule-based extraction using keyword and pattern matching
 */
class EntityExtractor {
    /**
     * Medication patterns
     * Common medications, drug classes, and brand names
     */
    medicationPatterns = [
        // Common medications
        'acetaminophen',
        'ibuprofen',
        'aspirin',
        'metformin',
        'insulin',
        'lisinopril',
        'atorvastatin',
        'amlodipine',
        'levothyroxine',
        'omeprazole',
        'simvastatin',
        'losartan',
        'gabapentin',
        'hydrochlorothiazide',
        'metoprolol',
        'amoxicillin',
        'prednisone',
        'warfarin',
        'clopidogrel',
        'sertraline',
        'fluoxetine',
        'escitalopram',
        'duloxetine',
        'pantoprazole',
        'albuterol',
        'furosemide',
        'carvedilol',
        'tramadol',
        'hydrocodone',
        'oxycodone',
        'morphine',
        'fentanyl',
        // Drug classes
        'statin',
        'statins',
        'beta blocker',
        'beta-blocker',
        'ace inhibitor',
        'ace-inhibitor',
        'arb',
        'diuretic',
        'antibiotic',
        'antibiotics',
        'anticoagulant',
        'anticoagulants',
        'antidepressant',
        'antidepressants',
        'antihypertensive',
        'antihypertensives',
        'analgesic',
        'analgesics',
        'nsaid',
        'nsaids',
        // Brand names (common)
        'tylenol',
        'advil',
        'motrin',
        'glucophage',
        'zestril',
        'lipitor',
        'norvasc',
        'synthroid',
        'prilosec',
        'zocor',
        'cozaar',
        'neurontin',
        'lasix',
        'plavix',
        'zoloft',
        'prozac',
        'lexapro',
        'cymbalta',
        'proventil',
        'ventolin',
    ];
    /**
     * Condition patterns
     * Common medical conditions and diagnoses
     */
    conditionPatterns = [
        // Chronic conditions
        'diabetes',
        'diabetes mellitus',
        'type 1 diabetes',
        'type 2 diabetes',
        't1d',
        't2d',
        'hypertension',
        'high blood pressure',
        'hyperlipidemia',
        'high cholesterol',
        'coronary artery disease',
        'cad',
        'heart failure',
        'chf',
        'congestive heart failure',
        'copd',
        'chronic obstructive pulmonary disease',
        'asthma',
        'chronic kidney disease',
        'ckd',
        'end stage renal disease',
        'esrd',
        'obesity',
        'metabolic syndrome',
        'depression',
        'anxiety',
        'gad',
        'generalized anxiety disorder',
        'hypothyroidism',
        'hyperthyroidism',
        'osteoarthritis',
        'rheumatoid arthritis',
        'osteoporosis',
        // Acute conditions
        'pneumonia',
        'bronchitis',
        'uti',
        'urinary tract infection',
        'cellulitis',
        'gastroenteritis',
        'influenza',
        'flu',
        'covid-19',
        'covid',
        'stroke',
        'cva',
        'cerebrovascular accident',
        'myocardial infarction',
        'mi',
        'heart attack',
        'pulmonary embolism',
        'pe',
        'dvt',
        'deep vein thrombosis',
        // Other conditions
        'anemia',
        'atrial fibrillation',
        'afib',
        'gerd',
        'gastroesophageal reflux disease',
        'ibs',
        'irritable bowel syndrome',
        'migraine',
        'migraines',
        'neuropathy',
        'diabetic neuropathy',
        'retinopathy',
        'diabetic retinopathy',
        'nephropathy',
        'diabetic nephropathy',
    ];
    /**
     * Symptom patterns
     * Common symptoms and complaints
     */
    symptomPatterns = [
        // Pain-related
        'pain',
        'chest pain',
        'abdominal pain',
        'back pain',
        'headache',
        'migraine',
        'joint pain',
        'muscle pain',
        'neck pain',
        'shoulder pain',
        // Respiratory
        'cough',
        'shortness of breath',
        'sob',
        'dyspnea',
        'wheezing',
        'chest tightness',
        // Gastrointestinal
        'nausea',
        'vomiting',
        'diarrhea',
        'constipation',
        'heartburn',
        'indigestion',
        'bloating',
        // Cardiovascular
        'palpitations',
        'chest pressure',
        'edema',
        'swelling',
        'leg swelling',
        // Neurological
        'dizziness',
        'vertigo',
        'numbness',
        'tingling',
        'weakness',
        'confusion',
        'memory loss',
        // Constitutional
        'fever',
        'chills',
        'fatigue',
        'tiredness',
        'weakness',
        'weight loss',
        'weight gain',
        'night sweats',
        // Other
        'rash',
        'itching',
        'bruising',
        'bleeding',
        'urinary frequency',
        'dysuria',
        'hematuria',
    ];
    /**
     * Person indicators (titles, roles)
     */
    personPatterns = [
        'dr',
        'dr.',
        'doctor',
        'physician',
        'nurse',
        'practitioner',
        'np',
        'pa',
        'physician assistant',
        'patient',
        'provider',
        'cardiologist',
        'endocrinologist',
        'nephrologist',
        'neurologist',
        'psychiatrist',
        'surgeon',
        'specialist',
    ];
    /**
     * Medical abbreviations and their expanded forms
     */
    abbreviations = {
        // Dosage
        mg: 'milligram',
        mcg: 'microgram',
        g: 'gram',
        ml: 'milliliter',
        l: 'liter',
        // Frequency
        qd: 'once daily',
        bid: 'twice daily',
        tid: 'three times daily',
        qid: 'four times daily',
        q6h: 'every 6 hours',
        q8h: 'every 8 hours',
        q12h: 'every 12 hours',
        prn: 'as needed',
        ac: 'before meals',
        pc: 'after meals',
        hs: 'at bedtime',
        // Route
        po: 'by mouth',
        iv: 'intravenous',
        im: 'intramuscular',
        sc: 'subcutaneous',
        sl: 'sublingual',
        // Common medical
        htn: 'hypertension',
        dm: 'diabetes mellitus',
        cad: 'coronary artery disease',
        chf: 'congestive heart failure',
        copd: 'chronic obstructive pulmonary disease',
        ckd: 'chronic kidney disease',
        esrd: 'end stage renal disease',
        gerd: 'gastroesophageal reflux disease',
        uti: 'urinary tract infection',
        sob: 'shortness of breath',
        hx: 'history',
        fx: 'fracture',
        sx: 'symptoms',
    };
    /**
     * Regex patterns for special entity types
     */
    specialPatterns = [
        // Dosage patterns (e.g., "500mg", "2.5 mg")
        {
            pattern: /\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|l)\b/gi,
            type: 'medication',
            confidence: 0.7,
        },
        // Frequency patterns (e.g., "twice daily", "q6h")
        {
            pattern: /\b(qd|bid|tid|qid|q\d+h|prn)\b/gi,
            type: 'medication',
            confidence: 0.6,
        },
    ];
    /**
     * Extract entities from query
     *
     * @param query - Natural language query
     * @returns List of extracted entities
     *
     * @example
     * extractEntities("Patient with diabetes on metformin 500mg twice daily")
     * // Returns: [
     * //   { text: "diabetes", type: "condition", normalized: "diabetes", confidence: 1.0 },
     * //   { text: "metformin", type: "medication", normalized: "metformin", confidence: 1.0 },
     * //   { text: "500mg", type: "medication", normalized: "500 milligram", confidence: 0.7 }
     * // ]
     */
    extractEntities(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        const entities = [];
        // Extract medications
        entities.push(...this.extractMedications(query));
        // Extract conditions
        entities.push(...this.extractConditions(query));
        // Extract symptoms
        entities.push(...this.extractSymptoms(query));
        // Extract persons
        entities.push(...this.extractPersons(query));
        // Extract dates using TemporalParser
        entities.push(...this.extractDates(query));
        // Extract special patterns (dosages, frequencies)
        entities.push(...this.extractSpecialPatterns(query));
        // Remove duplicates and overlaps
        const deduplicated = this.deduplicateEntities(entities);
        // Sort by position in query
        return deduplicated.sort((a, b) => {
            if (a.position && b.position) {
                return a.position.start - b.position.start;
            }
            return 0;
        });
    }
    /**
     * Extract medication entities
     *
     * @param query - Original query
     * @returns Medication entities
     */
    extractMedications(query) {
        const entities = [];
        for (const medication of this.medicationPatterns) {
            const regex = new RegExp(`\\b${this.escapeRegex(medication)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(query)) !== null) {
                const entity = {
                    text: match[0],
                    type: 'medication',
                    normalized: this.normalizeTerm(medication),
                    confidence: 1.0,
                    position: {
                        start: match.index,
                        end: match.index + match[0].length,
                    },
                };
                entities.push(entity);
            }
        }
        return entities;
    }
    /**
     * Extract condition entities
     *
     * @param query - Original query
     * @returns Condition entities
     */
    extractConditions(query) {
        const entities = [];
        for (const condition of this.conditionPatterns) {
            const regex = new RegExp(`\\b${this.escapeRegex(condition)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(query)) !== null) {
                const entity = {
                    text: match[0],
                    type: 'condition',
                    normalized: this.normalizeTerm(condition),
                    confidence: 1.0,
                    position: {
                        start: match.index,
                        end: match.index + match[0].length,
                    },
                };
                entities.push(entity);
            }
        }
        return entities;
    }
    /**
     * Extract symptom entities
     *
     * @param query - Original query
     * @returns Symptom entities
     */
    extractSymptoms(query) {
        const entities = [];
        for (const symptom of this.symptomPatterns) {
            const regex = new RegExp(`\\b${this.escapeRegex(symptom)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(query)) !== null) {
                const entity = {
                    text: match[0],
                    type: 'symptom',
                    normalized: this.normalizeTerm(symptom),
                    confidence: 0.9, // Slightly lower confidence for symptoms
                    position: {
                        start: match.index,
                        end: match.index + match[0].length,
                    },
                };
                entities.push(entity);
            }
        }
        return entities;
    }
    /**
     * Extract person entities
     *
     * @param query - Original query
     * @returns Person entities
     */
    extractPersons(query) {
        const entities = [];
        for (const person of this.personPatterns) {
            const regex = new RegExp(`\\b${this.escapeRegex(person)}\\b`, 'gi');
            let match;
            while ((match = regex.exec(query)) !== null) {
                const entity = {
                    text: match[0],
                    type: 'person',
                    normalized: this.normalizeTerm(person),
                    confidence: 0.8,
                    position: {
                        start: match.index,
                        end: match.index + match[0].length,
                    },
                };
                entities.push(entity);
            }
        }
        return entities;
    }
    /**
     * Extract date entities using TemporalParser
     *
     * @param query - Original query
     * @returns Date entities
     */
    extractDates(query) {
        const entities = [];
        // Use temporal parser to extract all temporal references
        const temporalFilters = temporal_parser_service_1.default.parseAll(query);
        for (const filter of temporalFilters) {
            const entity = {
                text: filter.timeReference,
                type: 'date',
                normalized: filter.dateFrom, // Use ISO date as normalized form
                confidence: 0.95,
            };
            entities.push(entity);
        }
        return entities;
    }
    /**
     * Extract special patterns (dosages, frequencies, etc.)
     *
     * @param query - Original query
     * @returns Special pattern entities
     */
    extractSpecialPatterns(query) {
        const entities = [];
        for (const { pattern, type, confidence } of this.specialPatterns) {
            let match;
            const regex = new RegExp(pattern);
            while ((match = regex.exec(query)) !== null) {
                const entity = {
                    text: match[0],
                    type,
                    normalized: this.expandAbbreviation(match[0].toLowerCase()),
                    confidence,
                    position: {
                        start: match.index,
                        end: match.index + match[0].length,
                    },
                };
                entities.push(entity);
            }
        }
        return entities;
    }
    /**
     * Normalize entity
     *
     * @param entity - Entity to normalize
     * @returns Normalized entity
     *
     * @example
     * normalizeEntity({ text: "Ibuprofen", type: "medication", normalized: "", confidence: 1.0 })
     * // Returns: { text: "Ibuprofen", type: "medication", normalized: "ibuprofen", confidence: 1.0 }
     */
    normalizeEntity(entity) {
        return {
            ...entity,
            normalized: this.normalizeTerm(entity.text),
        };
    }
    /**
     * Normalize a term
     *
     * @param term - Term to normalize
     * @returns Normalized term
     */
    normalizeTerm(term) {
        let normalized = term.toLowerCase().trim();
        // Expand abbreviations
        normalized = this.expandAbbreviation(normalized);
        // Simple stemming (remove common suffixes)
        normalized = this.applyStemming(normalized);
        return normalized;
    }
    /**
     * Expand medical abbreviations
     *
     * @param term - Term to expand
     * @returns Expanded term
     */
    expandAbbreviation(term) {
        const lower = term.toLowerCase().trim();
        // Check for exact match
        if (this.abbreviations[lower]) {
            return this.abbreviations[lower];
        }
        // Check for abbreviations within the term
        let expanded = term;
        for (const [abbr, full] of Object.entries(this.abbreviations)) {
            const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
            expanded = expanded.replace(regex, full);
        }
        return expanded;
    }
    /**
     * Apply simple stemming
     *
     * @param term - Term to stem
     * @returns Stemmed term
     */
    applyStemming(term) {
        // Remove common suffixes
        const suffixes = ['ing', 'ed', 'es', 's', 'ly', 'ness', 'ment'];
        for (const suffix of suffixes) {
            if (term.endsWith(suffix) && term.length > suffix.length + 2) {
                return term.substring(0, term.length - suffix.length);
            }
        }
        return term;
    }
    /**
     * Deduplicate entities (remove duplicates and overlapping entities)
     *
     * @param entities - List of entities
     * @returns Deduplicated entities
     */
    deduplicateEntities(entities) {
        const deduplicated = [];
        for (const entity of entities) {
            // Check if this entity overlaps with any existing entity
            const overlaps = deduplicated.some((existing) => {
                if (!entity.position || !existing.position) {
                    return false;
                }
                // Check for overlap
                const entityStart = entity.position.start;
                const entityEnd = entity.position.end;
                const existingStart = existing.position.start;
                const existingEnd = existing.position.end;
                return ((entityStart >= existingStart && entityStart < existingEnd) ||
                    (entityEnd > existingStart && entityEnd <= existingEnd) ||
                    (entityStart <= existingStart && entityEnd >= existingEnd));
            });
            if (!overlaps) {
                deduplicated.push(entity);
            }
            else {
                // If there's an overlap, keep the one with higher confidence
                const overlappingIndex = deduplicated.findIndex((existing) => {
                    if (!entity.position || !existing.position) {
                        return false;
                    }
                    const entityStart = entity.position.start;
                    const entityEnd = entity.position.end;
                    const existingStart = existing.position.start;
                    const existingEnd = existing.position.end;
                    return ((entityStart >= existingStart && entityStart < existingEnd) ||
                        (entityEnd > existingStart && entityEnd <= existingEnd) ||
                        (entityStart <= existingStart && entityEnd >= existingEnd));
                });
                if (overlappingIndex !== -1) {
                    const existing = deduplicated[overlappingIndex];
                    if (entity.confidence > existing.confidence) {
                        deduplicated[overlappingIndex] = entity;
                    }
                }
            }
        }
        return deduplicated;
    }
    /**
     * Escape special regex characters
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Get entity patterns for a specific type
     *
     * @param type - Entity type
     * @returns List of patterns for that type
     */
    getEntityPatterns(type) {
        switch (type) {
            case 'medication':
                return [...this.medicationPatterns];
            case 'condition':
                return [...this.conditionPatterns];
            case 'symptom':
                return [...this.symptomPatterns];
            case 'person':
                return [...this.personPatterns];
            case 'date':
                return ['(handled by TemporalParser)'];
            default:
                return [];
        }
    }
    /**
     * Get all abbreviations
     *
     * @returns Abbreviation mappings
     */
    getAbbreviations() {
        return { ...this.abbreviations };
    }
    /**
     * Extract entities by type
     *
     * @param query - Natural language query
     * @param type - Entity type to extract
     * @returns Entities of specified type
     */
    extractByType(query, type) {
        const allEntities = this.extractEntities(query);
        return allEntities.filter((entity) => entity.type === type);
    }
    /**
     * Check if query contains entity of specific type
     *
     * @param query - Natural language query
     * @param type - Entity type to check
     * @returns True if entity type is found
     */
    hasEntityType(query, type) {
        const entities = this.extractByType(query, type);
        return entities.length > 0;
    }
}
// Export singleton instance
const entityExtractor = new EntityExtractor();
exports.default = entityExtractor;
//# sourceMappingURL=entity-extractor.service.js.map