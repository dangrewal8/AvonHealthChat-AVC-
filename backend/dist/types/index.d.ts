/**
 * TypeScript Type Definitions
 * Avon Health RAG System Backend
 */
export interface QueryRequest {
    query: string;
    patient_id: string;
    options?: QueryOptions;
    conversation_history?: ConversationMessage[];
}
export interface QueryOptions {
    detail_level?: number;
    max_results?: number;
    include_structured?: boolean;
}
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface UIResponse {
    query_id: string;
    short_answer: string;
    detailed_summary: string;
    structured_extractions: StructuredExtraction[];
    provenance: FormattedProvenance[];
    confidence: ConfidenceScore;
    metadata: ResponseMetadata;
}
export interface StructuredExtraction {
    type: 'medication' | 'condition' | 'procedure' | 'measurement' | 'date' | 'patient_info' | 'demographic';
    value: string;
    relevance: number;
    confidence: number;
    source_artifact_id: string;
    supporting_text?: string;
}
export interface FormattedProvenance {
    artifact_id: string;
    artifact_type: 'condition' | 'care_plan' | 'medication' | 'note';
    snippet: string;
    occurred_at: string;
    relevance_score: number;
    char_offsets: [number, number];
    source_url: string;
}
export interface ConfidenceScore {
    overall: number;
    breakdown: {
        retrieval: number;
        reasoning: number;
        extraction: number;
    };
    explanation: string;
}
export interface ResponseMetadata {
    patient_id: string;
    query_time: string;
    processing_time_ms: number;
    artifacts_searched: number;
    chunks_retrieved: number;
    detail_level: number;
    reasoning_method?: string;
    reasoning_chain?: string[];
}
export interface AvonHealthCredentials {
    client_id: string;
    client_secret: string;
    base_url: string;
    account: string;
    user_id: string;
}
export interface AvonHealthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}
export interface AvonHealthJWTRequest {
    account: string;
    user_id: string;
}
export interface AvonHealthJWTResponse {
    jwt_token: string;
    expires_in: number;
}
/**
 * Avon Health API Types - UPDATED to match actual API structure
 * These match the real fields returned by /v2/care_plans, /v2/medications, /v2/notes
 */
export interface CarePlan {
    id: string;
    object: string;
    patient: string;
    score: number;
    care_plan_template: string;
    care_plan_template_version: string;
    name: string;
    share_with_patient: boolean;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    assigned_to: string;
    is_entered_in_error: boolean | null;
    external_id: string | null;
    entered_in_error: {
        marked_by: string;
        reason: string | null;
        marked_at: string | null;
    };
    request_signature_from: any[];
    sections: any[];
    signers: any[];
    reviews: any[];
    comments: any[];
    addendums: any[];
    status_history: any[];
}
export interface Medication {
    id: string;
    object: string;
    patient: string;
    source: string | null;
    name: string;
    strength: string;
    ndc: string | null;
    sig: string | null;
    active: boolean;
    start_date: string | null;
    end_date: string | null;
    comment: string | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    drug_id: string | null;
    quantity: string | null;
    dose_form: string | null;
    refills: number | null;
    last_filled_at: string | null;
    status: string | null;
    external_accounts: {
        dosespot?: string | null;
        [key: string]: any;
    };
}
export interface ClinicalNote {
    id: string;
    object: string;
    patient: string;
    score: number;
    note_template: string;
    note_template_version: string;
    appointment: string | null;
    insurance_claim: string | null;
    name: string;
    share_with_patient: boolean | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    appointment_occurrence: string | null;
    is_entered_in_error: boolean | null;
    external_id: string | null;
    superbill: string | null;
    psychotherapy_note: boolean | null;
    appointment_required: boolean | null;
    entered_in_error: {
        marked_by: string;
        reason: string | null;
        marked_at: string | null;
    };
    sections: NoteSection[];
}
export interface NoteSection {
    id: string;
    object: string;
    name: string;
    logic: any;
    answers: NoteAnswer[];
}
export interface NoteAnswer {
    id: string;
    type: string;
    name?: string;
    value?: any;
    score?: number;
    [key: string]: any;
}
/**
 * EXPANDED AVON HEALTH API TYPES
 * Additional endpoints for comprehensive query support
 */
export interface Patient {
    id: string;
    object: string;
    mrn: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    gender: string;
    email: string;
    phone: string;
    date_of_birth: string;
    ssn: string;
    caregiver: string;
    caregiver_only: boolean;
    timezone: string;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    race: string | null;
    ethnicity: string | null;
    preferred_language: string | null;
    sex: string | null;
    sexual_orientation: string | null;
    preferred_name: string;
    pronouns: string | null;
    note: string | null;
    has_no_known_allergies: boolean | null;
    alternate_phone: string | null;
    copay: number | null;
    status_history: any[];
    addresses: any[];
    custom_data: any;
    emergency_contacts: any[];
    guarantors: any[];
    medical_centers: any[];
    care_team_members: any[];
    peer_groups: any[];
    caregivers: any[];
    external_accounts: any;
}
export interface Allergy {
    id: string;
    object: string;
    patient: string;
    source: string | null;
    name: string;
    code_type: string | null;
    code: string | null;
    severity: string | null;
    reaction_type: string | null;
    reaction: string | null;
    active: boolean;
    onset_date: string | null;
    comment: string | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    end_date: string | null;
    allergen_id: string | null;
    external_accounts: {
        dosespot?: string | null;
        [key: string]: any;
    };
}
export interface Condition {
    id: string;
    object: string;
    patient: string;
    source: string | null;
    name: string;
    active: boolean;
    onset_date: string | null;
    end_date: string | null;
    comment: string | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    description: string | null;
}
export interface Vitals {
    id: string;
    object: string;
    patient: string;
    source: string | null;
    height: string | null;
    weight: string | null;
    blood_pressure: string | null;
    temperature: string | null;
    pulse: string | null;
    respiratory_rate: string | null;
    oxygen_saturation: string | null;
    pain: string | null;
    comment: string | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
}
export interface FamilyHistory {
    id: string;
    object: string;
    patient: string;
    source: string | null;
    relationship: string;
    diagnoses: Array<{
        id: string;
        active: boolean;
        end_date: string | null;
        diagnosis: string;
        onset_date: string | null;
        description: string;
    }>;
    comment: string | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
}
export interface Appointment {
    id: string;
    object: string;
    generated_from: string | null;
    generated_from_type: string | null;
    appointment_type: string;
    name: string;
    description: string;
    group: boolean;
    internal: boolean;
    start_time: string;
    end_time: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    host: string;
    reference_patients: any[];
    charged_externally: boolean | null;
    interaction_type: string;
    visit_note: string | null;
    insurance_claim: string | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    timezone: string | null;
    external_id: string | null;
    service_facility: string | null;
    attendees: any[];
    video_call: any | null;
    status_history: any[];
    recurrence_rules: any[];
    location: any | null;
    type: string | null;
    recurrenceId: string | null;
    patient: string | null;
    charged_while_booking: boolean;
    charge_after_appointment: boolean;
    insurance_claims: any[];
}
export interface Document {
    id: string;
    object: string;
    patient: string;
    sections: any[];
    score: number;
    type: string;
    document_template: string;
    document_template_version: string;
    name: string;
    filename: string | null;
    file: string | null;
    share_with_patient: boolean | null;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    is_entered_in_error: boolean | null;
    external_id: string | null;
    use_letterhead: boolean | null;
    signers: any[];
    reviews: any[];
    comments: any[];
    addendums: any[];
    tags: any[];
    entered_in_error: any;
}
export interface FormResponse {
    id: string;
    object: string;
    patient: string;
    score: number;
    form: string;
    form_version: string;
    sections: any[];
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
}
export interface InsurancePolicy {
    id: string;
    object: string;
    patient: string;
    type: string;
    created_by: string;
    created_at: string;
    last_updated_at: string;
    account: string;
    [key: string]: any;
}
export interface VectorDocument {
    id: string;
    text: string;
    embedding?: number[];
    metadata: DocumentMetadata;
}
export interface DocumentMetadata {
    patient_id: string;
    artifact_id: string;
    artifact_type: 'condition' | 'care_plan' | 'medication' | 'note';
    occurred_at: string;
    source_url: string;
    chunk_index?: number;
    total_chunks?: number;
}
export interface SearchResult {
    document: VectorDocument;
    score: number;
    char_offsets?: [number, number];
}
export interface OllamaEmbeddingRequest {
    model: string;
    prompt: string;
}
export interface OllamaEmbeddingResponse {
    embedding: number[];
}
export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    system?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}
export interface OllamaGenerateResponse {
    response: string;
    model: string;
    created_at: string;
    done: boolean;
}
export interface AppConfig {
    port: number;
    nodeEnv: string;
    avonHealth: AvonHealthCredentials;
    ollama: {
        baseUrl: string;
        embeddingModel: string;
        llmModel: string;
        maxTokens: number;
        temperature: number;
    };
    vectorDb: {
        type: 'faiss' | 'chromadb';
        dimension: number;
        indexPath: string;
    };
    cache: {
        enabled: boolean;
        ttlSeconds: number;
    };
}
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
//# sourceMappingURL=index.d.ts.map