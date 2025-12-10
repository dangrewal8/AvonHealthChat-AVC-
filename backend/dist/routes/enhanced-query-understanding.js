"use strict";
/**
 * Enhanced Query Understanding System with Advanced NLP
 * Handles synonyms, abbreviations, variations, and complex questions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectIntent = detectIntent;
exports.isMultiPartQuestion = isMultiPartQuestion;
exports.splitMultiPartQuestion = splitMultiPartQuestion;
exports.extractEntities = extractEntities;
exports.getQueryComplexity = getQueryComplexity;
exports.isFollowUpQuestion = isFollowUpQuestion;
exports.analyzeQuery = analyzeQuery;
const chrono = __importStar(require("chrono-node"));
/**
 * Normalize query for better matching
 */
function normalizeQuery(query) {
    let normalized = query.toLowerCase().trim();
    // Expand common medical abbreviations
    const abbreviations = {
        "\\ba1c\\b": "hemoglobin a1c",
        "\\bhba1c\\b": "hemoglobin a1c",
        "\\bbp\\b": "blood pressure",
        "\\bhr\\b": "heart rate",
        "\\brr\\b": "respiratory rate",
        "\\btemp\\b": "temperature",
        "\\bmed\\b": "medication",
        "\\bmeds\\b": "medications",
        "\\brx\\b": "prescription",
        "\\bdoc\\b": "doctor",
        "\\bdr\\b": "doctor",
        "\\bnp\\b": "nurse practitioner",
        "\\bpt\\b": "patient",
        "\\bdx\\b": "diagnosis",
        "\\bhx\\b": "history",
        "\\bfh\\b": "family history",
        "\\bsh\\b": "social history",
        "\\bldl\\b": "ldl cholesterol",
        "\\bhdl\\b": "hdl cholesterol",
        "\\begfr\\b": "kidney function",
        "\\balt\\b": "liver function",
        "\\bast\\b": "liver function",
        "\\bbmi\\b": "body mass index",
        "\\bwt\\b": "weight",
        "\\bht\\b": "height",
        "\\bdm\\b": "diabetes",
        "\\bt2dm\\b": "type 2 diabetes",
        "\\bhtn\\b": "hypertension",
    };
    // Replace abbreviations with full terms
    for (const [abbrev, full] of Object.entries(abbreviations)) {
        const regex = new RegExp(abbrev, "gi");
        normalized = normalized.replace(regex, full);
    }
    // Remove common filler words but keep medical context
    const fillers = [
        "\\bcan you\\b",
        "\\bcould you\\b",
        "\\bwould you\\b",
        "\\bplease\\b",
        "\\btell me\\b",
        "\\bshow me\\b",
        "\\bgive me\\b",
        "\\blet me know\\b",
        "\\bi want to know\\b",
        "\\bi would like\\b",
        "\\bwhat are\\b",
        "\\bwhat is\\b",
        "\\bwhat was\\b",
    ];
    for (const filler of fillers) {
        const regex = new RegExp(filler, "gi");
        normalized = normalized.replace(regex, "");
    }
    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, " ").trim();
    return normalized;
}
/**
 * Create a comprehensive synonym map
 */
const SYNONYM_MAP = {
    // Medications
    medications: [
        "medication",
        "medicine",
        "drug",
        "prescription",
        "pill",
        "tablet",
        "capsule",
        "treatment",
        "therapy",
        "taking",
        "on",
    ],
    // Allergies
    allergies: [
        "allergy",
        "allergic",
        "reaction",
        "sensitive",
        "sensitivity",
        "intolerance",
        "adverse",
    ],
    // Vital signs
    "blood pressure": [
        "bp",
        "pressure",
        "hypertension",
        "hypotension",
        "systolic",
        "diastolic",
    ],
    "heart rate": ["hr", "pulse", "heartbeat", "beats per minute", "bpm"],
    temperature: ["temp", "fever", "t"],
    weight: ["wt", "body weight", "pounds", "lbs", "kg", "kilograms"],
    "vital signs": ["vitals", "vital", "signs"],
    // Lab results
    "lab results": [
        "lab",
        "labs",
        "test",
        "tests",
        "bloodwork",
        "blood work",
        "laboratory",
        "results",
    ],
    "a1c": ["hemoglobin a1c", "hba1c", "glycated hemoglobin", "glycohemoglobin"],
    cholesterol: ["lipid", "lipids", "ldl", "hdl", "triglyceride", "triglycerides"],
    // Conditions
    diabetes: [
        "diabetic",
        "blood sugar",
        "glucose",
        "hyperglycemia",
        "type 2 diabetes",
        "t2dm",
        "dm",
    ],
    hypertension: ["high blood pressure", "htn", "elevated bp"],
    // Appointments
    appointment: [
        "visit",
        "appointment",
        "appt",
        "scheduled",
        "upcoming",
        "next visit",
        "follow-up",
        "followup",
    ],
    // Doctors/Providers
    doctor: [
        "physician",
        "provider",
        "doc",
        "dr",
        "clinician",
        "practitioner",
        "treating",
    ],
    // Immunizations
    immunizations: [
        "vaccine",
        "vaccination",
        "shot",
        "immunization",
        "flu shot",
        "booster",
    ],
    // History
    "medical history": [
        "history",
        "past medical",
        "pmh",
        "background",
        "previous",
        "prior",
        "past",
        "before",
        "previously",
    ],
    "family history": ["family", "hereditary", "genetic", "familial", "relatives"],
    "smoking": ["smoke", "smoker", "tobacco", "cigarette", "nicotine"],
    // Clinical Notes & Documentation
    "clinical notes": [
        "notes",
        "note",
        "documentation",
        "documented",
        "chart",
        "medical record",
        "records",
        "encounter",
        "visit note",
    ],
    // Care Plans
    "care plans": [
        "care plan",
        "treatment plan",
        "plan of care",
        "management plan",
        "therapy plan",
        "treatment",
        "management",
    ],
    // Contact
    contact: ["phone", "email", "call", "reach", "address"],
    emergency: ["urgent", "emergency contact", "backup", "if something happens"],
    // Demographics
    name: ["called", "patient name", "identity", "who"],
    age: ["old", "years old", "born", "birthday", "birth date", "dob"],
    // Summary & Overview
    summary: [
        "summary",
        "overview",
        "everything",
        "all",
        "complete",
        "full",
        "entire",
        "comprehensive",
        "tell me about",
    ],
};
/**
 * Check if query matches any synonyms for a category
 */
function matchesSynonyms(query, category) {
    const synonyms = SYNONYM_MAP[category] || [];
    // Check if category itself is in query
    if (query.includes(category)) {
        return true;
    }
    // Check all synonyms
    for (const synonym of synonyms) {
        if (query.includes(synonym)) {
            return true;
        }
    }
    return false;
}
/**
 * Score intent based on keyword matches
 */
function scoreIntent(query, keywords) {
    let score = 0;
    for (const keyword of keywords) {
        if (query.includes(keyword)) {
            score += 1;
        }
    }
    return score;
}
/**
 * Extract time-based context (recent, last, latest, etc.)
 */
function hasTimeContext(query) {
    const timeKeywords = [
        "recent",
        "latest",
        "last",
        "current",
        "now",
        "today",
        "yesterday",
        "this week",
        "this month",
    ];
    return timeKeywords.some((kw) => query.includes(kw));
}
/**
 * Check if question is asking about changes/trends
 */
function isTrendQuestion(query) {
    const trendKeywords = [
        "change",
        "changed",
        "improve",
        "improved",
        "worse",
        "better",
        "trend",
        "progress",
        "over time",
    ];
    return trendKeywords.some((kw) => query.includes(kw));
}
/**
 * Check if question is negated
 */
function isNegated(query) {
    const negations = ["not", "no", "never", "none", "without"];
    return negations.some((neg) => query.includes(` ${neg} `));
}
/**
 * Extract question type (what, when, who, where, how, why, is/does)
 */
function getQuestionType(query) {
    const originalQuery = query.toLowerCase();
    if (originalQuery.match(/^(what|what's|whats)\b/))
        return "what";
    if (originalQuery.match(/^(when|when's|whens)\b/))
        return "when";
    if (originalQuery.match(/^(who|who's|whos)\b/))
        return "who";
    if (originalQuery.match(/^(where|where's|wheres)\b/))
        return "where";
    if (originalQuery.match(/^(how|how's|hows)\b/))
        return "how";
    if (originalQuery.match(/^(why|why's|whys)\b/))
        return "why";
    if (originalQuery.match(/^(is|does|do|did|has|have|can|could|should)\b/))
        return "boolean";
    if (originalQuery.match(/^(list|show|display|give)\b/))
        return "list";
    return "statement";
}
/**
 * Enhanced intent detection with scoring
 */
function detectIntent(query) {
    const normalized = normalizeQuery(query);
    const questionType = getQuestionType(query);
    // Score all possible intents
    const intentScores = {
        // Demographics - Enhanced with more patterns
        patient_name: scoreIntent(normalized, ["patient name", "name", "called", "patient called"]),
        patient_age: scoreIntent(normalized, ["age", "old", "years old", "born", "birthday", "birth date", "dob"]),
        patient_gender: scoreIntent(normalized, ["gender", "sex", "male", "female"]),
        patient_contact: scoreIntent(normalized, ["phone", "email", "address", "contact info"]),
        allergies: scoreIntent(normalized, [
            "allergy",
            "allergic",
            "reaction",
            "sensitive",
        ]),
        vitals: scoreIntent(normalized, ["vital", "signs", "heart rate", "temperature"]),
        labs: scoreIntent(normalized, ["lab", "test", "bloodwork", "results"]),
        medications: scoreIntent(normalized, [
            "medication",
            "medicine",
            "drug",
            "prescription",
            "pill",
            "taking",
        ]),
        // Enhanced: Specific medication questions
        medication_for_condition: scoreIntent(normalized, [
            "taking for",
            "prescribed for",
            "medication for",
            "treating",
        ]),
        medication_timing: scoreIntent(normalized, [
            "when prescribed",
            "when was prescribed",
            "prescribed when",
            "started when",
            "prescription date",
        ]),
        prescriber: scoreIntent(normalized, [
            "who prescribed",
            "which doctor prescribed",
            "what doctor prescribed",
            "prescriber",
            "prescribed by",
        ]),
        medication_count: scoreIntent(normalized, [
            "how many medication",
            "how many med",
            "how many drug",
            "number of medication",
        ]),
        // Enhanced: Care plan specific questions
        care_plan_status: scoreIntent(normalized, [
            "status",
            "active",
            "inactive",
            "plan status",
        ]),
        has_condition: scoreIntent(normalized, [
            "does have",
            "is there",
            "has condition",
            "diagnosed with",
        ]),
        diabetes: scoreIntent(normalized, [
            "diabetes",
            "diabetic",
            "blood sugar",
            "glucose",
            "hemoglobin a1c",
        ]),
        blood_pressure: scoreIntent(normalized, [
            "blood pressure",
            "hypertension",
            "systolic",
            "diastolic",
        ]),
        cholesterol: scoreIntent(normalized, [
            "cholesterol",
            "lipid",
            "ldl",
            "hdl",
            "triglyceride",
        ]),
        immunizations: scoreIntent(normalized, [
            "vaccine",
            "vaccination",
            "immunization",
            "shot",
        ]),
        appointments: scoreIntent(normalized, [
            "appointment",
            "visit",
            "scheduled",
            "next",
            "upcoming",
        ]),
        // Enhanced: Provider/doctor questions
        doctor: scoreIntent(normalized, [
            "doctor",
            "physician",
            "provider",
            "treating",
            "who is treating",
            "healthcare provider",
        ]),
        // Enhanced: Visit/note questions
        last_visit: scoreIntent(normalized, [
            "last visit",
            "recent visit",
            "latest visit",
            "most recent visit",
            "last appointment",
        ]),
        note_content: scoreIntent(normalized, [
            "what did doctor say",
            "what was noted",
            "what did say about",
            "what was documented",
        ]),
        medical_history: scoreIntent(normalized, [
            "history",
            "medical",
            "surgery",
            "past",
            "condition",
        ]),
        family_history: scoreIntent(normalized, [
            "family",
            "hereditary",
            "genetic",
            "mother",
            "father",
        ]),
        social_history: scoreIntent(normalized, [
            "smoke",
            "alcohol",
            "exercise",
            "lifestyle",
        ]),
        emergency_contact: scoreIntent(normalized, [
            "emergency",
            "contact",
            "call",
            "reach",
        ]),
        care_plans: scoreIntent(normalized, [
            "care plan",
            "treatment plan",
            "plan",
            "managing",
        ]),
        contact_info: scoreIntent(normalized, ["phone", "email", "address", "contact"]),
        diagnosis: scoreIntent(normalized, [
            "diagnosis",
            "condition",
            "disease",
            "problem",
        ]),
        history: scoreIntent(normalized, [
            "notes",
            "note",
            "history",
            "visit",
            "encounter",
            "records",
            "chart",
            "documentation",
        ]),
        summary: scoreIntent(normalized, [
            "summary",
            "overview",
            "everything",
            "all about",
            "tell me about",
            "comprehensive",
        ]),
    };
    // Add bonus points for exact matches
    if (matchesSynonyms(normalized, "medications"))
        intentScores.medications += 3;
    if (matchesSynonyms(normalized, "allergies"))
        intentScores.allergies += 3;
    if (matchesSynonyms(normalized, "blood pressure"))
        intentScores.blood_pressure += 3;
    if (matchesSynonyms(normalized, "a1c"))
        intentScores.diabetes += 3;
    if (matchesSynonyms(normalized, "cholesterol"))
        intentScores.cholesterol += 3;
    if (matchesSynonyms(normalized, "immunizations"))
        intentScores.immunizations += 3;
    if (matchesSynonyms(normalized, "appointment"))
        intentScores.appointments += 3;
    if (matchesSynonyms(normalized, "diabetes"))
        intentScores.diabetes += 3;
    if (matchesSynonyms(normalized, "clinical notes"))
        intentScores.history += 3;
    if (matchesSynonyms(normalized, "care plans"))
        intentScores.care_plans += 3;
    if (matchesSynonyms(normalized, "summary"))
        intentScores.summary += 3;
    // Find highest scoring intent
    let maxScore = 0;
    let primaryIntent = "general";
    for (const [intent, score] of Object.entries(intentScores)) {
        if (score > maxScore) {
            maxScore = score;
            primaryIntent = intent;
        }
    }
    // Calculate confidence (0-100%)
    const totalWords = normalized.split(" ").length;
    const confidence = Math.min(100, (maxScore / Math.max(totalWords, 1)) * 100);
    return {
        primary: primaryIntent,
        confidence,
        normalized,
        questionType,
        hasTimeContext: hasTimeContext(normalized),
        isTrend: isTrendQuestion(normalized),
        isNegated: isNegated(normalized),
    };
}
/**
 * Handle multi-part questions by detecting "and"
 */
function isMultiPartQuestion(query) {
    return query.includes(" and ") || query.includes(" & ") || query.includes(" + ");
}
/**
 * Split multi-part questions
 */
function splitMultiPartQuestion(query) {
    return query.split(/\s+(?:and|&|\+)\s+/i).map((q) => q.trim());
}
/**
 * Extract specific entities from the query (medication names, dates, numbers)
 */
function extractEntities(query) {
    const entities = {
        medications: [],
        dates: [],
        numbers: [],
        conditions: [],
    };
    // Common medication patterns (this is a basic implementation)
    const medicationPatterns = [
        /\b(metformin|lisinopril|atorvastatin|aspirin|insulin|levothyroxine|amlodipine|omeprazole|losartan|gabapentin)\b/gi,
    ];
    for (const pattern of medicationPatterns) {
        const matches = query.match(pattern);
        if (matches) {
            entities.medications.push(...matches.map((m) => m.toLowerCase()));
        }
    }
    // Extract dates using chrono for natural language parsing
    const chronoParsed = chrono.parse(query);
    if (chronoParsed.length > 0) {
        // Add the text of each parsed date/time reference
        entities.dates.push(...chronoParsed.map(p => p.text));
    }
    // Extract numbers
    const numberPattern = /\b\d+(\.\d+)?\b/g;
    const numberMatches = query.match(numberPattern);
    if (numberMatches) {
        entities.numbers = numberMatches.map(parseFloat);
    }
    // Extract common conditions
    const conditionPatterns = [
        /\b(diabetes|hypertension|asthma|copd|depression|anxiety|heart disease|kidney disease|cancer)\b/gi,
    ];
    for (const pattern of conditionPatterns) {
        const matches = query.match(pattern);
        if (matches) {
            entities.conditions.push(...matches.map((m) => m.toLowerCase()));
        }
    }
    return entities;
}
/**
 * Determine question complexity
 */
function getQueryComplexity(query) {
    let score = 0;
    const reasons = [];
    // Check query length
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 15) {
        score += 2;
        reasons.push('Long query');
    }
    else if (wordCount > 8) {
        score += 1;
        reasons.push('Moderate length query');
    }
    // Check for multi-part questions
    if (isMultiPartQuestion(query)) {
        score += 2;
        reasons.push('Multi-part question');
    }
    // Check for temporal context
    if (hasTimeContext(query)) {
        score += 1;
        reasons.push('Temporal context');
    }
    // Check for trend analysis
    if (isTrendQuestion(query)) {
        score += 2;
        reasons.push('Trend analysis requested');
    }
    // Check for comparison keywords
    if (query.match(/\b(compare|versus|vs|difference|better|worse)\b/i)) {
        score += 2;
        reasons.push('Comparison requested');
    }
    // Check for why/how questions (require explanation)
    if (query.match(/^(why|how)\b/i)) {
        score += 1;
        reasons.push('Explanation required');
    }
    // Determine level based on score
    let level;
    if (score >= 4) {
        level = 'complex';
    }
    else if (score >= 2) {
        level = 'moderate';
    }
    else {
        level = 'simple';
    }
    return { level, score, reasons };
}
/**
 * Detect if this is a follow-up question
 */
function isFollowUpQuestion(query) {
    const followUpIndicators = [
        /^(what about|how about|and)\b/i,
        /\b(also|too|as well|additionally)\b/i,
        /^(that|those|it|them)\b/i, // Pronoun reference
    ];
    return followUpIndicators.some((pattern) => pattern.test(query));
}
/**
 * Calculate time window from query dates
 * Returns [start_ISO, end_ISO] format as per spec
 *
 * Handles:
 * - "three months ago" → [3 months ago, now]
 * - "past 60 days" → [60 days ago, now]
 * - "last visit" → [inferred date, now]
 * - "on July 11, 2025" → [July 11 00:00, July 12 00:00]
 */
function calculateTimeWindow(dates, query) {
    if (dates.length === 0)
        return undefined;
    const lowerQuery = query.toLowerCase();
    // Try to parse the first date found
    const parsed = chrono.parse(dates[0])[0];
    if (!parsed)
        return undefined;
    let start;
    let end;
    // Handle relative dates with "ago" (e.g., "three months ago")
    if (/\d+\s+(day|week|month|year)s?\s+ago/i.test(lowerQuery)) {
        start = parsed.start.date(); // The calculated past date
        end = new Date(); // Now
    }
    // Handle "last X" or "past X" (e.g., "last visit", "past 60 days")
    else if (/\b(last|past|previous)\b/i.test(lowerQuery)) {
        start = parsed.start.date();
        end = new Date();
    }
    // Handle "in the last X" (e.g., "in the last month")
    else if (/\bin\s+the\s+last\b/i.test(lowerQuery)) {
        start = parsed.start.date();
        end = new Date();
    }
    // Handle absolute dates (e.g., "on July 11, 2025")
    else {
        start = parsed.start.date();
        // If end date provided, use it; otherwise add 1 day
        end = parsed.end?.date() || new Date(start.getTime() + 24 * 60 * 60 * 1000);
    }
    return [start.toISOString(), end.toISOString()];
}
/**
 * Enhanced intent detection with more context
 */
function analyzeQuery(query) {
    const intent = detectIntent(query);
    const entities = extractEntities(query);
    const complexity = getQueryComplexity(query);
    const isFollowUp = isFollowUpQuestion(query);
    const isMultiPart = isMultiPartQuestion(query);
    // Calculate time window in spec-compliant format
    const time_window = calculateTimeWindow(entities.dates, query);
    // Debug logging for time windows
    if (time_window) {
        const [start, end] = time_window;
        const startDate = new Date(start).toLocaleDateString();
        const endDate = new Date(end).toLocaleDateString();
        console.log(`⏰ Time window detected: ${startDate} → ${endDate}`);
        console.log(`   ISO format: ${start} → ${end}`);
    }
    // Generate suggestions for improving the query or providing better context
    const suggestions = [];
    if (complexity.level === 'complex' && !entities.dates.length && hasTimeContext(query)) {
        suggestions.push('Consider specifying a date range for more precise results');
    }
    if (intent.confidence < 50) {
        suggestions.push('Query intent unclear - results may be broad');
    }
    if (isMultiPart) {
        suggestions.push('Multi-part question detected - will address all parts');
    }
    if (isFollowUp && !isMultiPart) {
        suggestions.push('Follow-up question detected - using previous context may help');
    }
    return {
        intent,
        entities,
        complexity,
        isFollowUp,
        isMultiPart,
        suggestions,
        time_window,
    };
}
//# sourceMappingURL=enhanced-query-understanding.js.map