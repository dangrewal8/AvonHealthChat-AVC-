"use strict";
/**
 * Avon Health API Service
 * Handles OAuth2 authentication and EMR data fetching
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvonHealthService = void 0;
const axios_1 = __importDefault(require("axios"));
class AvonHealthService {
    constructor(credentials) {
        this.accessToken = null;
        this.tokenExpiry = 0;
        this.jwtToken = null;
        this.jwtExpiry = 0;
        this.credentials = credentials;
        this.client = axios_1.default.create({
            baseURL: credentials.base_url,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Get OAuth2 Bearer Token (with caching)
     * Uses client credentials flow to obtain access token
     */
    async getAccessToken() {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        try {
            console.log('🔐 Obtaining OAuth2 access token...');
            const response = await this.client.post('/v2/auth/token', {
                grant_type: 'client_credentials',
                client_id: this.credentials.client_id,
                client_secret: this.credentials.client_secret,
            });
            this.accessToken = response.data.access_token;
            // Set expiry to 90% of actual expiry to allow for refresh time
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000 * 0.9);
            console.log('✅ Access token obtained successfully');
            console.log(`   Expires in: ${response.data.expires_in} seconds (~${Math.round(response.data.expires_in / 3600)} hours)`);
            return this.accessToken;
        }
        catch (error) {
            console.error('❌ OAuth2 token error:', error.response?.data || error.message);
            throw new Error(`Failed to authenticate with Avon Health API: ${error.message}`);
        }
    }
    /**
     * Get JWT Token for user-level authentication (with caching)
     * Requires bearer token first
     */
    async getJWTToken() {
        // Return cached JWT if still valid
        if (this.jwtToken && Date.now() < this.jwtExpiry) {
            return this.jwtToken;
        }
        try {
            // First get the bearer token
            const bearerToken = await this.getAccessToken();
            console.log('🔐 Step 2: Generating JWT token for user...');
            console.log(`   User ID: ${this.credentials.user_id}`);
            const response = await this.client.post('/v2/auth/get-jwt', { id: this.credentials.user_id }, {
                headers: {
                    Authorization: `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.data || !response.data.jwt) {
                throw new Error('JWT token not returned in response');
            }
            const jwt = response.data.jwt;
            this.jwtToken = jwt;
            // JWT tokens typically have 24hr expiry like bearer tokens
            this.jwtExpiry = Date.now() + (86400 * 1000 * 0.9);
            console.log('✅ JWT token generated successfully');
            return jwt;
        }
        catch (error) {
            console.error('❌ JWT generation error:', error.response?.data || error.message);
            throw new Error(`Failed to generate JWT: ${error.message}`);
        }
    }
    /**
     * Make authenticated request to Avon Health API using TWO-KEY authentication
     * Key 1: Bearer token (organization-level)
     * Key 2: JWT token (user-level) in x-jwt header
     */
    async authenticatedRequest(method, endpoint, data) {
        // Get both tokens
        const bearerToken = await this.getAccessToken();
        const jwtToken = await this.getJWTToken();
        try {
            console.log(`📡 Making ${method.toUpperCase()} request to ${endpoint}`);
            console.log(`   Using TWO-KEY authentication (Bearer + JWT)`);
            const headers = {
                Authorization: `Bearer ${bearerToken}`,
                'x-jwt': jwtToken,
                'Content-Type': 'application/json',
            };
            // Add account header for sandbox environment
            if (this.credentials.account) {
                headers['account'] = this.credentials.account;
                console.log(`   Sandbox account: ${this.credentials.account}`);
            }
            const response = await this.client.request({
                method,
                url: endpoint,
                headers,
                data,
            });
            console.log(`✅ Request successful: ${endpoint}`);
            return response.data;
        }
        catch (error) {
            console.error(`❌ Avon Health API error (${endpoint}):`);
            console.error(`   Status: ${error.response?.status}`);
            console.error(`   Message: ${error.response?.data?.message || error.message}`);
            console.error(`   Details:`, error.response?.data);
            if (error.response?.status === 401) {
                console.error('   ⚠️  Authentication failed');
                console.error('   ⚠️  Check: Bearer token, JWT token, account header');
            }
            throw new Error(`API request failed: ${error.message}`);
        }
    }
    /**
     * Fetch care plans for a patient
     * API returns data in format: { object: "list", data: [...] }
     * CRITICAL: API returns ALL records across ALL patients - must filter client-side
     */
    async getCarePlans(patientId) {
        console.log(`🔍 Fetching care plans${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/care_plans`);
        // Extract data array from response
        let carePlans = response.data || [];
        const totalCount = carePlans.length;
        // CRITICAL: Filter by patient field - API returns ALL records from database
        if (patientId) {
            carePlans = carePlans.filter((cp) => cp.patient === patientId);
            console.log(`   ✅ Filtered to ${carePlans.length} care plan(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${carePlans.length} total care plan(s) (NO PATIENT FILTER - returning all records)`);
        }
        return carePlans;
    }
    /**
     * Fetch medications for a patient
     * API returns data in format: { object: "list", data: [...] }
     * CRITICAL: API returns ALL records across ALL patients - must filter client-side
     */
    async getMedications(patientId) {
        console.log(`🔍 Fetching medications${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/medications`);
        let medications = response.data || [];
        const totalCount = medications.length;
        // CRITICAL: Filter by patient field - API returns ALL records from database
        if (patientId) {
            medications = medications.filter((med) => med.patient === patientId);
            console.log(`   ✅ Filtered to ${medications.length} medication(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${medications.length} total medication(s) (NO PATIENT FILTER - returning all records)`);
        }
        return medications;
    }
    /**
     * Fetch clinical notes for a patient
     * API returns data in format: { object: "list", data: [...] }
     * CRITICAL: API returns ALL records across ALL patients - must filter client-side
     */
    async getNotes(patientId) {
        console.log(`🔍 Fetching notes${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/notes`);
        let notes = response.data || [];
        const totalCount = notes.length;
        // CRITICAL: Filter by patient field - API returns ALL records from database
        if (patientId) {
            notes = notes.filter((note) => note.patient === patientId);
            console.log(`   ✅ Filtered to ${notes.length} note(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${notes.length} total note(s) (NO PATIENT FILTER - returning all records)`);
        }
        return notes;
    }
    /**
     * Fetch patient demographics
     * CRITICAL: Returns patient name, age, gender, contact info
     */
    async getPatients(patientId) {
        console.log(`🔍 Fetching patient demographics${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/patients`);
        let patients = response.data || [];
        const totalCount = patients.length;
        if (patientId) {
            patients = patients.filter((p) => p.id === patientId);
            console.log(`   ✅ Filtered to ${patients.length} patient(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${patients.length} total patient(s) (NO PATIENT FILTER - returning all records)`);
        }
        return patients;
    }
    /**
     * Fetch allergies for a patient
     */
    async getAllergies(patientId) {
        console.log(`🔍 Fetching allergies${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/allergies`);
        let allergies = response.data || [];
        const totalCount = allergies.length;
        if (patientId) {
            allergies = allergies.filter((a) => a.patient === patientId);
            console.log(`   ✅ Filtered to ${allergies.length} allergy/allergies for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${allergies.length} total allergy/allergies (NO PATIENT FILTER - returning all records)`);
        }
        return allergies;
    }
    /**
     * Fetch conditions for a patient
     */
    async getConditions(patientId) {
        console.log(`🔍 Fetching conditions${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/conditions`);
        let conditions = response.data || [];
        const totalCount = conditions.length;
        if (patientId) {
            conditions = conditions.filter((c) => c.patient === patientId);
            console.log(`   ✅ Filtered to ${conditions.length} condition(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${conditions.length} total condition(s) (NO PATIENT FILTER - returning all records)`);
        }
        return conditions;
    }
    /**
     * Fetch vitals for a patient
     */
    async getVitals(patientId) {
        console.log(`🔍 Fetching vitals${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/vitals`);
        let vitals = response.data || [];
        const totalCount = vitals.length;
        if (patientId) {
            vitals = vitals.filter((v) => v.patient === patientId);
            console.log(`   ✅ Filtered to ${vitals.length} vital(s) record(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${vitals.length} total vital(s) record(s) (NO PATIENT FILTER - returning all records)`);
        }
        return vitals;
    }
    /**
     * Fetch family history for a patient
     */
    async getFamilyHistory(patientId) {
        console.log(`🔍 Fetching family history${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/family_histories`);
        let familyHistory = response.data || [];
        const totalCount = familyHistory.length;
        if (patientId) {
            familyHistory = familyHistory.filter((fh) => fh.patient === patientId);
            console.log(`   ✅ Filtered to ${familyHistory.length} family history record(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${familyHistory.length} total family history record(s) (NO PATIENT FILTER - returning all records)`);
        }
        return familyHistory;
    }
    /**
     * Fetch appointments for a patient
     */
    async getAppointments(patientId) {
        console.log(`🔍 Fetching appointments${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/appointments`);
        let appointments = response.data || [];
        const totalCount = appointments.length;
        if (patientId) {
            appointments = appointments.filter((a) => a.patient === patientId || a.reference_patients?.includes(patientId));
            console.log(`   ✅ Filtered to ${appointments.length} appointment(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${appointments.length} total appointment(s) (NO PATIENT FILTER - returning all records)`);
        }
        return appointments;
    }
    /**
     * Fetch documents for a patient
     */
    async getDocuments(patientId) {
        console.log(`🔍 Fetching documents${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/documents`);
        let documents = response.data || [];
        const totalCount = documents.length;
        if (patientId) {
            documents = documents.filter((d) => d.patient === patientId);
            console.log(`   ✅ Filtered to ${documents.length} document(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${documents.length} total document(s) (NO PATIENT FILTER - returning all records)`);
        }
        return documents;
    }
    /**
     * Fetch form responses for a patient
     */
    async getFormResponses(patientId) {
        console.log(`🔍 Fetching form responses${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/form_responses`);
        let formResponses = response.data || [];
        const totalCount = formResponses.length;
        if (patientId) {
            formResponses = formResponses.filter((fr) => fr.patient === patientId);
            console.log(`   ✅ Filtered to ${formResponses.length} form response(s) for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${formResponses.length} total form response(s) (NO PATIENT FILTER - returning all records)`);
        }
        return formResponses;
    }
    /**
     * Fetch insurance policies for a patient
     */
    async getInsurancePolicies(patientId) {
        console.log(`🔍 Fetching insurance policies${patientId ? ` for patient_id: ${patientId}` : ''}`);
        const response = await this.authenticatedRequest('get', `/v2/insurance_policies`);
        let insurancePolicies = response.data || [];
        const totalCount = insurancePolicies.length;
        if (patientId) {
            insurancePolicies = insurancePolicies.filter((ip) => ip.patient === patientId);
            console.log(`   ✅ Filtered to ${insurancePolicies.length} insurance policy/policies for patient ${patientId} (from ${totalCount} total)`);
        }
        else {
            console.log(`   ⚠️  Found ${insurancePolicies.length} total insurance policy/policies (NO PATIENT FILTER - returning all records)`);
        }
        return insurancePolicies;
    }
    /**
     * Fetch all EMR data for a patient - COMPREHENSIVE
     */
    async getAllPatientData(patientId) {
        try {
            const [patients, carePlans, medications, notes, allergies, conditions, vitals, familyHistory, appointments, documents, formResponses, insurancePolicies,] = await Promise.all([
                this.getPatients(patientId),
                this.getCarePlans(patientId),
                this.getMedications(patientId),
                this.getNotes(patientId),
                this.getAllergies(patientId),
                this.getConditions(patientId),
                this.getVitals(patientId),
                this.getFamilyHistory(patientId),
                this.getAppointments(patientId),
                this.getDocuments(patientId),
                this.getFormResponses(patientId),
                this.getInsurancePolicies(patientId),
            ]);
            return {
                patient: patients.length > 0 ? patients[0] : null,
                care_plans: carePlans,
                medications: medications,
                notes: notes,
                allergies: allergies,
                conditions: conditions,
                vitals: vitals,
                family_history: familyHistory,
                appointments: appointments,
                documents: documents,
                form_responses: formResponses,
                insurance_policies: insurancePolicies,
            };
        }
        catch (error) {
            console.error('Failed to fetch patient data:', error.message);
            throw error;
        }
    }
    /**
     * Health check - tests TWO-KEY authentication
     */
    async healthCheck() {
        try {
            console.log('🏥 Testing Avon Health API TWO-KEY authentication...');
            // Test Step 1: Get bearer token (organization-level)
            await this.getAccessToken();
            // Test Step 2: Get JWT token (user-level)
            await this.getJWTToken();
            console.log('✅ TWO-KEY authentication successful (Bearer + JWT)');
            return true;
        }
        catch (error) {
            console.error('❌ Authentication failed:', error.message);
            return false;
        }
    }
    /**
     * Test patient data retrieval with different patient_id patterns
     * Helps debug 401 errors by trying common patient_id formats
     */
    async testPatientIdFormats(baseId) {
        const testId = baseId || this.credentials.user_id;
        console.log('\n🧪 Testing different patient_id formats...');
        console.log(`   Base ID: ${testId}`);
        const testPatterns = [
            { name: 'user_id as-is', id: testId },
            { name: 'patient_ prefix', id: `patient_${testId}` },
            { name: 'user_ prefix', id: `user_${testId}` },
            { name: 'numeric only', id: testId.replace(/\D/g, '') },
        ];
        for (const pattern of testPatterns) {
            try {
                console.log(`\n   Testing: ${pattern.name} (${pattern.id})`);
                await this.getCarePlans(pattern.id);
                console.log(`   ✅ SUCCESS with ${pattern.name}`);
                console.log(`   → Use patient_id: ${pattern.id}`);
                return; // Stop on first success
            }
            catch (error) {
                console.log(`   ❌ Failed with ${pattern.name}: ${error.message}`);
            }
        }
        console.log('\n   ⚠️  All patterns failed. Check Avon Health API documentation for correct patient_id format');
    }
}
exports.AvonHealthService = AvonHealthService;
//# sourceMappingURL=avonhealth.service.js.map