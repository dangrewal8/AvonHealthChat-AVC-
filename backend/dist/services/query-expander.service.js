"use strict";
/**
 * Query Expansion Service
 *
 * Expands queries with medical synonyms and related terms to improve retrieval coverage
 *
 * Features:
 * - Medical synonym dictionary
 * - Entity-based query expansion
 * - Expanded term generation
 * - Synonym mapping
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Query Expander Class
 *
 * Dictionary-based query expansion using medical synonyms
 */
class QueryExpander {
    /**
     * Medical synonym dictionary
     * Maps medical terms to their synonyms, abbreviations, and related terms
     */
    MEDICAL_SYNONYMS = {
        // Medications - Generic Names
        ibuprofen: ['advil', 'motrin', 'nsaid', 'nonsteroidal anti-inflammatory'],
        acetaminophen: ['tylenol', 'paracetamol', 'apap'],
        aspirin: ['asa', 'acetylsalicylic acid'],
        metformin: ['glucophage', 'biguanide'],
        insulin: ['humulin', 'novolin', 'lantus', 'humalog'],
        lisinopril: ['zestril', 'prinivil', 'ace inhibitor'],
        atorvastatin: ['lipitor', 'statin'],
        amlodipine: ['norvasc', 'calcium channel blocker'],
        levothyroxine: ['synthroid', 'thyroid hormone'],
        omeprazole: ['prilosec', 'ppi', 'proton pump inhibitor'],
        simvastatin: ['zocor', 'statin'],
        losartan: ['cozaar', 'arb', 'angiotensin receptor blocker'],
        gabapentin: ['neurontin'],
        hydrochlorothiazide: ['hctz', 'microzide', 'diuretic'],
        metoprolol: ['lopressor', 'toprol', 'beta blocker'],
        amoxicillin: ['amoxil', 'antibiotic', 'penicillin'],
        prednisone: ['corticosteroid', 'steroid'],
        warfarin: ['coumadin', 'anticoagulant', 'blood thinner'],
        clopidogrel: ['plavix', 'antiplatelet'],
        sertraline: ['zoloft', 'ssri', 'antidepressant'],
        fluoxetine: ['prozac', 'ssri', 'antidepressant'],
        escitalopram: ['lexapro', 'ssri', 'antidepressant'],
        duloxetine: ['cymbalta', 'snri', 'antidepressant'],
        pantoprazole: ['protonix', 'ppi'],
        albuterol: ['proventil', 'ventolin', 'bronchodilator'],
        furosemide: ['lasix', 'loop diuretic'],
        // Drug Classes
        statin: ['atorvastatin', 'simvastatin', 'lipitor', 'zocor', 'cholesterol medication'],
        'beta blocker': [
            'metoprolol',
            'atenolol',
            'carvedilol',
            'beta-blocker',
            'beta adrenergic blocker',
        ],
        'ace inhibitor': [
            'lisinopril',
            'enalapril',
            'ramipril',
            'ace-inhibitor',
            'angiotensin converting enzyme inhibitor',
        ],
        arb: ['losartan', 'valsartan', 'irbesartan', 'angiotensin receptor blocker'],
        diuretic: [
            'furosemide',
            'hydrochlorothiazide',
            'hctz',
            'lasix',
            'water pill',
            'fluid pill',
        ],
        nsaid: ['ibuprofen', 'naproxen', 'advil', 'aleve', 'anti-inflammatory'],
        antibiotic: [
            'amoxicillin',
            'azithromycin',
            'ciprofloxacin',
            'antibacterial',
            'antimicrobial',
        ],
        anticoagulant: ['warfarin', 'coumadin', 'blood thinner', 'anticlotting medication'],
        antidepressant: ['ssri', 'snri', 'sertraline', 'fluoxetine', 'mood medication'],
        antihypertensive: [
            'blood pressure medication',
            'ace inhibitor',
            'beta blocker',
            'arb',
            'diuretic',
        ],
        // Conditions - Chronic
        hypertension: ['high blood pressure', 'htn', 'elevated blood pressure', 'bp'],
        diabetes: [
            'diabetes mellitus',
            'dm',
            'type 2 diabetes',
            't2dm',
            'type 1 diabetes',
            't1dm',
            'sugar diabetes',
            'high blood sugar',
        ],
        'diabetes mellitus': ['diabetes', 'dm', 'sugar diabetes'],
        'type 2 diabetes': ['t2dm', 'type ii diabetes', 'adult onset diabetes', 'diabetes'],
        'type 1 diabetes': ['t1dm', 'type i diabetes', 'juvenile diabetes', 'diabetes'],
        hyperlipidemia: [
            'high cholesterol',
            'elevated cholesterol',
            'dyslipidemia',
            'cholesterol disorder',
        ],
        'high cholesterol': ['hyperlipidemia', 'elevated cholesterol', 'dyslipidemia'],
        'coronary artery disease': ['cad', 'coronary heart disease', 'chd', 'heart disease'],
        cad: ['coronary artery disease', 'coronary heart disease'],
        'heart failure': ['chf', 'congestive heart failure', 'cardiac failure', 'hf'],
        chf: ['congestive heart failure', 'heart failure', 'cardiac failure'],
        copd: [
            'chronic obstructive pulmonary disease',
            'chronic bronchitis',
            'emphysema',
            'lung disease',
        ],
        asthma: ['reactive airway disease', 'bronchial asthma', 'bronchospasm'],
        'chronic kidney disease': ['ckd', 'renal disease', 'kidney disease', 'renal insufficiency'],
        ckd: ['chronic kidney disease', 'renal disease'],
        obesity: ['overweight', 'elevated bmi', 'weight problem'],
        depression: ['major depressive disorder', 'mdd', 'depressive disorder', 'mood disorder'],
        anxiety: ['generalized anxiety disorder', 'gad', 'anxiety disorder', 'nervousness'],
        gad: ['generalized anxiety disorder', 'anxiety'],
        hypothyroidism: ['underactive thyroid', 'low thyroid', 'thyroid disorder'],
        osteoarthritis: ['oa', 'degenerative joint disease', 'arthritis'],
        'rheumatoid arthritis': ['ra', 'autoimmune arthritis', 'inflammatory arthritis'],
        // Conditions - Acute
        pneumonia: ['lung infection', 'respiratory infection', 'pulmonary infection'],
        bronchitis: ['chest cold', 'respiratory infection', 'airway infection'],
        uti: ['urinary tract infection', 'bladder infection', 'urine infection'],
        'urinary tract infection': ['uti', 'bladder infection'],
        influenza: ['flu', 'viral infection', 'respiratory illness'],
        flu: ['influenza', 'viral infection'],
        stroke: ['cva', 'cerebrovascular accident', 'brain attack', 'cerebral infarction'],
        cva: ['cerebrovascular accident', 'stroke'],
        'myocardial infarction': ['mi', 'heart attack', 'cardiac arrest', 'coronary event'],
        mi: ['myocardial infarction', 'heart attack'],
        'heart attack': ['myocardial infarction', 'mi', 'cardiac event'],
        'pulmonary embolism': ['pe', 'blood clot in lung', 'lung clot'],
        pe: ['pulmonary embolism'],
        dvt: ['deep vein thrombosis', 'blood clot', 'venous thrombosis'],
        // Other Conditions
        gerd: [
            'gastroesophageal reflux disease',
            'acid reflux',
            'heartburn',
            'reflux',
            'esophageal reflux',
        ],
        'acid reflux': ['gerd', 'heartburn', 'reflux'],
        ibs: ['irritable bowel syndrome', 'spastic colon', 'bowel disorder'],
        migraine: ['severe headache', 'migraine headache', 'vascular headache'],
        neuropathy: ['nerve damage', 'nerve pain', 'peripheral neuropathy'],
        'diabetic neuropathy': ['diabetic nerve damage', 'diabetes-related nerve pain'],
        retinopathy: ['diabetic retinopathy', 'eye disease', 'vision problem'],
        anemia: ['low blood count', 'low hemoglobin', 'iron deficiency'],
        'atrial fibrillation': ['afib', 'a-fib', 'irregular heartbeat', 'arrhythmia'],
        afib: ['atrial fibrillation', 'irregular heartbeat'],
        // Symptoms
        pain: ['discomfort', 'ache', 'soreness', 'hurting'],
        'chest pain': ['chest discomfort', 'chest pressure', 'angina', 'thoracic pain'],
        'abdominal pain': ['stomach pain', 'belly pain', 'gut pain', 'tummy ache'],
        'back pain': ['backache', 'lumbar pain', 'spinal pain'],
        headache: ['head pain', 'cephalgia', 'migraine'],
        'shortness of breath': [
            'sob',
            'dyspnea',
            'breathing difficulty',
            'difficulty breathing',
            'breathlessness',
        ],
        sob: ['shortness of breath', 'dyspnea'],
        dyspnea: ['shortness of breath', 'sob', 'breathing difficulty'],
        cough: ['coughing', 'hacking', 'persistent cough'],
        nausea: ['queasiness', 'upset stomach', 'sick to stomach', 'feeling sick'],
        vomiting: ['emesis', 'throwing up', 'being sick'],
        diarrhea: ['loose stools', 'watery stools', 'frequent bowel movements'],
        constipation: ['irregular bowel movements', 'difficulty passing stool', 'blocked'],
        fever: ['elevated temperature', 'febrile', 'high temperature', 'pyrexia'],
        fatigue: ['tiredness', 'exhaustion', 'weakness', 'lethargy', 'feeling tired'],
        dizziness: ['lightheadedness', 'vertigo', 'feeling faint', 'unsteadiness'],
        // Medical Actions
        prescribe: ['order', 'recommend', 'start', 'initiate', 'write prescription for'],
        discontinue: ['stop', 'cease', 'end', 'terminate', 'discontinue use'],
        increase: ['raise', 'up', 'elevate', 'boost', 'augment'],
        decrease: ['lower', 'reduce', 'cut', 'diminish', 'taper'],
        monitor: ['watch', 'track', 'follow', 'observe', 'check'],
        treat: ['manage', 'address', 'handle', 'control', 'therapy for'],
        diagnose: ['identify', 'determine', 'detect', 'find', 'discover'],
        refer: ['send to', 'consult with', 'transfer to', 'recommend to see'],
        // Medical Procedures
        surgery: ['operation', 'procedure', 'surgical intervention'],
        procedure: ['intervention', 'operation', 'treatment'],
        test: ['exam', 'examination', 'screening', 'lab work', 'diagnostic test'],
        'blood test': ['blood work', 'lab test', 'laboratory test', 'serum test'],
        xray: ['x-ray', 'radiograph', 'imaging'],
        'ct scan': ['cat scan', 'computed tomography', 'ct', 'imaging'],
        mri: ['magnetic resonance imaging', 'imaging scan'],
        // Vital Signs
        'blood pressure': ['bp', 'hypertension reading', 'systolic/diastolic'],
        bp: ['blood pressure'],
        'heart rate': ['pulse', 'hr', 'beats per minute', 'bpm'],
        temperature: ['temp', 'fever', 'body temperature'],
        // Lab Values
        hba1c: ['hemoglobin a1c', 'glycated hemoglobin', 'a1c', 'diabetes marker'],
        a1c: ['hba1c', 'hemoglobin a1c'],
        glucose: ['blood sugar', 'blood glucose', 'sugar level'],
        cholesterol: ['lipid', 'lipid panel', 'cholesterol level'],
        // Common Abbreviations
        htn: ['hypertension', 'high blood pressure'],
        dm: ['diabetes mellitus', 'diabetes'],
        hx: ['history', 'history of'],
        sx: ['symptoms', 'signs and symptoms'],
    };
    /**
     * Expand query with medical synonyms
     *
     * @param query - Original query
     * @param entities - Extracted entities from query
     * @returns Expanded query with synonyms
     *
     * @example
     * expandQuery("Patient with hypertension on lisinopril", entities)
     * // Returns: {
     * //   original: "Patient with hypertension on lisinopril",
     * //   expanded_terms: [
     * //     "Patient with hypertension on lisinopril",
     * //     "Patient with high blood pressure on lisinopril",
     * //     "Patient with htn on lisinopril",
     * //     "Patient with hypertension on zestril",
     * //     "Patient with hypertension on ace inhibitor"
     * //   ],
     * //   synonym_map: {
     * //     "hypertension": ["high blood pressure", "htn"],
     * //     "lisinopril": ["zestril", "prinivil", "ace inhibitor"]
     * //   }
     * // }
     */
    expandQuery(query, entities) {
        const expandedTerms = [query]; // Always include original
        const synonymMap = {};
        // Expand each entity
        for (const entity of entities) {
            // Get synonyms for normalized entity term
            const synonyms = this.getMedicalSynonyms(entity.normalized);
            if (synonyms.length > 0) {
                // Store in synonym map
                synonymMap[entity.text] = synonyms;
                // Create expanded query versions
                for (const synonym of synonyms) {
                    const expanded = this.replaceEntityInQuery(query, entity.text, synonym);
                    // Only add if it's different from original and not already added
                    if (expanded !== query && !expandedTerms.includes(expanded)) {
                        expandedTerms.push(expanded);
                    }
                }
            }
        }
        return {
            original: query,
            expanded_terms: expandedTerms,
            synonym_map: synonymMap,
        };
    }
    /**
     * Get medical synonyms for a term
     *
     * @param term - Term to find synonyms for
     * @returns List of synonyms
     *
     * @example
     * getMedicalSynonyms("hypertension")
     * // Returns: ["high blood pressure", "htn", "elevated blood pressure", "bp"]
     */
    getMedicalSynonyms(term) {
        if (!term) {
            return [];
        }
        const normalizedTerm = term.toLowerCase().trim();
        // Direct lookup
        if (this.MEDICAL_SYNONYMS[normalizedTerm]) {
            return [...this.MEDICAL_SYNONYMS[normalizedTerm]];
        }
        // Try partial matches for compound terms
        const synonyms = [];
        // Check if any dictionary key is contained in the term
        for (const [key, values] of Object.entries(this.MEDICAL_SYNONYMS)) {
            if (normalizedTerm.includes(key) || key.includes(normalizedTerm)) {
                synonyms.push(...values);
            }
        }
        // Remove duplicates and return
        return [...new Set(synonyms)];
    }
    /**
     * Build expanded search terms from original and synonyms
     *
     * @param original - Original term
     * @param synonyms - List of synonyms
     * @returns Combined search terms with original boosted
     *
     * @example
     * buildExpandedSearchTerms("hypertension", ["high blood pressure", "htn"])
     * // Returns: ["hypertension^2", "high blood pressure", "htn"]
     */
    buildExpandedSearchTerms(original, synonyms) {
        const terms = [];
        // Add original with boost (^2 indicates 2x weight)
        terms.push(`${original}^2`);
        // Add synonyms without boost
        terms.push(...synonyms);
        return terms;
    }
    /**
     * Replace entity in query with synonym
     *
     * @param query - Original query
     * @param entity - Entity text to replace
     * @param synonym - Synonym to use
     * @returns Expanded query
     */
    replaceEntityInQuery(query, entity, synonym) {
        // Use case-insensitive replacement
        const regex = new RegExp(`\\b${this.escapeRegex(entity)}\\b`, 'gi');
        return query.replace(regex, synonym);
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
     * Get all available medical terms in dictionary
     *
     * @returns List of all terms
     */
    getAllMedicalTerms() {
        return Object.keys(this.MEDICAL_SYNONYMS);
    }
    /**
     * Check if term has synonyms
     *
     * @param term - Term to check
     * @returns True if synonyms exist
     */
    hasSynonyms(term) {
        const synonyms = this.getMedicalSynonyms(term);
        return synonyms.length > 0;
    }
    /**
     * Get synonym count for term
     *
     * @param term - Term to check
     * @returns Number of synonyms
     */
    getSynonymCount(term) {
        return this.getMedicalSynonyms(term).length;
    }
    /**
     * Expand multiple queries in batch
     *
     * @param queries - Array of queries with entities
     * @returns Array of expanded queries
     */
    expandBatch(queries) {
        return queries.map(({ query, entities }) => this.expandQuery(query, entities));
    }
}
// Export singleton instance
const queryExpander = new QueryExpander();
exports.default = queryExpander;
//# sourceMappingURL=query-expander.service.js.map