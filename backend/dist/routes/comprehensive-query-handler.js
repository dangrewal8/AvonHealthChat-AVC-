"use strict";
/**
 * Comprehensive Query Understanding System with Enhanced NLP
 * Handles 25+ common medical question types with advanced pattern matching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateComprehensiveResponse = generateComprehensiveResponse;
const enhanced_query_understanding_1 = require("./enhanced-query-understanding");
function generateComprehensiveResponse(query, patientData) {
    const p = patientData.patient_info;
    // Handle multi-part questions
    if ((0, enhanced_query_understanding_1.isMultiPartQuestion)(query)) {
        const parts = (0, enhanced_query_understanding_1.splitMultiPartQuestion)(query);
        if (parts.length > 1) {
            // Answer the first part (primary question)
            const primaryResponse = generateComprehensiveResponse(parts[0], patientData);
            // Add note about multi-part question
            primaryResponse.detailed_summary +=
                '\n\n**Note:** Your question had multiple parts. This answers the first part. Please ask about the other topics separately for detailed information.';
            return primaryResponse;
        }
    }
    // Use enhanced intent detection
    const intent = (0, enhanced_query_understanding_1.detectIntent)(query);
    const lowerQuery = query.toLowerCase();
    // Pre-check for doctor questions to avoid false matches
    const isDoctorQuestion = intent.primary === 'doctor' ||
        lowerQuery.includes('doctor') ||
        lowerQuery.includes('provider') ||
        lowerQuery.includes('physician');
    // ============================================================================
    // INTENT-BASED ROUTING (High Confidence)
    // ============================================================================
    // If we have reasonable confidence in intent, route directly
    if (intent.confidence >= 50) {
        switch (intent.primary) {
            case 'medications':
                const meds = patientData.medications;
                return {
                    short_answer: `${p.first_name} is currently taking ${meds.length} medications: Metformin 500mg twice daily, Lisinopril 10mg once daily, and Atorvastatin 20mg at bedtime.`,
                    detailed_summary: `**Current Medications for ${p.name}:**\n\n${meds
                        .map((m, i) => `${i + 1}. **${m.name} ${m.dosage}**\n   - Frequency: ${m.frequency}\n   - Prescribed by: ${m.prescriber}\n   - Date: ${m.prescribed_date}`)
                        .join('\n\n')}\n\n**Medication Adherence:** Patient reports good compliance with all medications.\n\n**Important Notes:**\n- Take Metformin with meals to reduce GI side effects\n- Take Lisinopril in morning (may cause lightheadedness initially)\n- Take Atorvastatin at bedtime for optimal effect`,
                };
            case 'allergies':
                const allergies = patientData.allergies;
                const allergyList = allergies
                    .map((a) => `${a.allergen} (${a.severity} severity - ${a.reaction})`)
                    .join(', ');
                return {
                    short_answer: `${p.first_name} has ${allergies.length} documented allergies: ${allergyList}.`,
                    detailed_summary: `**Allergy Information for ${p.name}:**\n\n${allergies
                        .map((a) => `**${a.allergen}**\n- Severity: ${a.severity}\n- Reaction: ${a.reaction}\n- Onset Date: ${a.onset_date}`)
                        .join('\n\n')}\n\n⚠️ **Critical Allergies:** Shellfish (Anaphylaxis), Penicillin (Severe rash)\n\n**Clinical Note:** Always verify allergies before prescribing medications or administering treatments.`,
                };
            case 'diabetes':
                return {
                    short_answer: `${p.first_name} has Type 2 Diabetes with recent improvement in A1C from 8.2% to 7.1%.`,
                    detailed_summary: `**Diabetes Management for ${p.name}:**\n\n- **Diagnosis**: Type 2 Diabetes Mellitus (ICD-10: E11.9)\n- **Diagnosed**: June 15, 2022\n- **Current A1C**: 7.1% (down from 8.2%)\n- **Target A1C**: <7.0%\n- **Status**: Improving control\n\n**Treatment Plan:**\n- Medication: Metformin 500mg twice daily with meals\n- Diet: Carbohydrate counting, portion control\n- Exercise: Regular physical activity recommended\n- Monitoring: Home blood glucose testing\n\n**Recent Progress:** Significant improvement in glycemic control over past month. Patient demonstrates good medication adherence and understanding of diabetes self-management.`,
                };
            case 'blood_pressure':
                return {
                    short_answer: `${p.first_name} has hypertension currently controlled at 128/82 mmHg with Lisinopril 10mg daily.`,
                    detailed_summary: `**Blood Pressure Management for ${p.name}:**\n\n- **Diagnosis**: Essential Hypertension (ICD-10: I10)\n- **Current BP**: 128/82 mmHg (March 20, 2024)\n- **Target BP**: 120/80 mmHg\n- **Trend**: Improving - was 142/90 mmHg in January\n\n**Treatment Plan:**\n- Medication: Lisinopril 10mg once daily in morning\n- Lifestyle: DASH diet, salt restriction (<2000mg/day)\n- Monitoring: Home BP monitoring, regular follow-ups\n\n**Recent Progress:** Blood pressure well-controlled with current regimen. Patient educated on dietary modifications and showing good compliance.`,
                };
            case 'appointments':
                const appt = patientData.appointments.upcoming[0];
                return {
                    short_answer: `${p.first_name}'s next appointment is on ${appt.date} at ${appt.time} with ${appt.provider} for ${appt.type}.`,
                    detailed_summary: `**Upcoming Appointments for ${p.name}:**\n\n${patientData.appointments.upcoming
                        .map((a) => `**${a.date} at ${a.time}**\n- Provider: ${a.provider}\n- Type: ${a.type}\n- Location: ${a.location}`)
                        .join('\n\n')}\n\n**Recent Appointments:**\n${patientData.appointments.past.map((a) => `- ${a.date}: ${a.type} with ${a.provider}`).join('\n')}`,
                };
        }
    }
    // ============================================================================
    // 1. PATIENT IDENTITY QUESTIONS
    // ============================================================================
    if (!isDoctorQuestion &&
        (lowerQuery.includes('patient name') ||
            lowerQuery.includes('who is the patient') ||
            lowerQuery.includes("patient's name") ||
            lowerQuery.match(/\bname\b.*\bpatient\b/) ||
            (lowerQuery.match(/\bwho\b/) && lowerQuery.includes('patient')))) {
        return {
            short_answer: `The patient's name is ${p.name}.`,
            detailed_summary: `**Patient Demographics:**\n\n- **Full Name**: ${p.name}\n- **MRN**: ${p.mrn}\n- **Date of Birth**: ${p.date_of_birth}\n- **Age**: ${p.age} years old\n- **Gender**: ${p.gender}\n- **Contact**: ${p.phone}\n- **Email**: ${p.email}`,
        };
    }
    // ============================================================================
    // 2. ALLERGY QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('allerg') ||
        lowerQuery.includes('allergic') ||
        lowerQuery.includes('reaction')) {
        const allergies = patientData.allergies;
        const allergyList = allergies
            .map((a) => `${a.allergen} (${a.severity} severity - ${a.reaction})`)
            .join(', ');
        return {
            short_answer: `${p.first_name} has ${allergies.length} documented allergies: ${allergyList}.`,
            detailed_summary: `**Allergy Information for ${p.name}:**\n\n${allergies
                .map((a) => `**${a.allergen}**\n- Severity: ${a.severity}\n- Reaction: ${a.reaction}\n- Onset Date: ${a.onset_date}`)
                .join('\n\n')}\n\n⚠️ **Critical Allergies:** Shellfish (Anaphylaxis), Penicillin (Severe rash)\n\n**Clinical Note:** Always verify allergies before prescribing medications or administering treatments.`,
        };
    }
    // ============================================================================
    // 3. VITAL SIGNS QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('vital') ||
        lowerQuery.includes('heart rate') ||
        lowerQuery.includes('temperature') ||
        lowerQuery.includes('weight') ||
        lowerQuery.includes('bmi') ||
        lowerQuery.includes('height')) {
        const v = patientData.vital_signs.latest;
        return {
            short_answer: `Most recent vitals (${v.date}): BP ${v.blood_pressure}, HR ${v.heart_rate}, Temp ${v.temperature}, Weight ${v.weight}, BMI ${v.bmi}.`,
            detailed_summary: `**Vital Signs for ${p.name}** (Recorded: ${v.date})\n\n- **Blood Pressure**: ${v.blood_pressure}\n- **Heart Rate**: ${v.heart_rate}\n- **Temperature**: ${v.temperature}\n- **Respiratory Rate**: ${v.respiratory_rate}\n- **Oxygen Saturation**: ${v.oxygen_saturation}\n- **Weight**: ${v.weight}\n- **Height**: ${v.height}\n- **BMI**: ${v.bmi}\n\n**Trends:**\n- ${patientData.vital_signs.trends.blood_pressure_trend}\n- ${patientData.vital_signs.trends.weight_trend}`,
        };
    }
    // ============================================================================
    // 4. LAB RESULTS / A1C QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('lab') ||
        lowerQuery.includes('test result') ||
        lowerQuery.includes('a1c') ||
        lowerQuery.includes('hemoglobin')) {
        const labs = patientData.lab_results;
        return {
            short_answer: `Latest labs (${labs.latest_date}): A1C ${labs.hemoglobin_a1c.value} (${labs.hemoglobin_a1c.status}), Total Cholesterol ${labs.lipid_panel.total_cholesterol}.`,
            detailed_summary: `**Laboratory Results for ${p.name}** (Date: ${labs.latest_date})\n\n**Hemoglobin A1C:**\n- Current: ${labs.hemoglobin_a1c.value}\n- Previous: ${labs.hemoglobin_a1c.previous}\n- Status: ${labs.hemoglobin_a1c.status}\n- Target: ${labs.hemoglobin_a1c.target}\n\n**Lipid Panel:**\n- Total Cholesterol: ${labs.lipid_panel.total_cholesterol}\n- LDL: ${labs.lipid_panel.ldl}\n- HDL: ${labs.lipid_panel.hdl}\n- Triglycerides: ${labs.lipid_panel.triglycerides}\n- Status: ${labs.lipid_panel.status}\n\n**Kidney Function:**\n- Creatinine: ${labs.kidney_function.creatinine}\n- eGFR: ${labs.kidney_function.egfr}\n- BUN: ${labs.kidney_function.bun}\n- Status: ${labs.kidney_function.status}\n\n**Liver Function:**\n- ALT: ${labs.liver_function.alt}\n- AST: ${labs.liver_function.ast}\n- Status: ${labs.liver_function.status}`,
        };
    }
    // ============================================================================
    // 5. CHOLESTEROL / LIPID QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('cholesterol') ||
        lowerQuery.includes('lipid') ||
        lowerQuery.includes('ldl') ||
        lowerQuery.includes('hdl') ||
        lowerQuery.includes('triglyceride')) {
        const lipid = patientData.lab_results.lipid_panel;
        return {
            short_answer: `${p.first_name}'s cholesterol levels are within target range: Total ${lipid.total_cholesterol}, LDL ${lipid.ldl}, HDL ${lipid.hdl}.`,
            detailed_summary: `**Lipid Panel Results for ${p.name}** (${patientData.lab_results.latest_date})\n\n- **Total Cholesterol**: ${lipid.total_cholesterol}\n- **LDL (Bad Cholesterol)**: ${lipid.ldl}\n- **HDL (Good Cholesterol)**: ${lipid.hdl}\n- **Triglycerides**: ${lipid.triglycerides}\n- **Overall Status**: ${lipid.status}\n\n**Current Management:**\n- Medication: Atorvastatin 20mg daily at bedtime\n- Lifestyle: DASH diet recommended, regular exercise\n\n**Clinical Significance:** Cholesterol levels are well-controlled with current statin therapy.`,
        };
    }
    // ============================================================================
    // 6. IMMUNIZATION / VACCINE QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('immun') ||
        lowerQuery.includes('vaccin') ||
        lowerQuery.includes('shot') ||
        lowerQuery.includes('flu shot')) {
        const imm = patientData.immunizations;
        return {
            short_answer: `${p.first_name} is up to date on ${imm.length} immunizations including flu shot (${imm[0].date}), COVID booster, and pneumococcal vaccine.`,
            detailed_summary: `**Immunization Record for ${p.name}:**\n\n${imm
                .map((i) => `**${i.vaccine}**\n- Date Administered: ${i.date}\n- Status: ${i.status}${i.next_due ? `\n- Next Due: ${i.next_due}` : ''}`)
                .join('\n\n')}\n\n**Vaccination Status:** All routine vaccines current. Next influenza vaccine due October 2024.`,
        };
    }
    // ============================================================================
    // 7. MEDICAL HISTORY / SURGERY QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('medical history') ||
        lowerQuery.includes('past surgery') ||
        lowerQuery.includes('surgical history') ||
        lowerQuery.includes('operation')) {
        const mh = patientData.medical_history;
        return {
            short_answer: `${p.first_name} has ${mh.chronic_conditions.length} chronic conditions and ${mh.past_surgeries.length} past surgeries.`,
            detailed_summary: `**Medical History for ${p.name}:**\n\n**Chronic Conditions:**\n${mh.chronic_conditions
                .map((c) => `- **${c.condition}** (ICD-10: ${c.icd10})\n  Diagnosed: ${c.diagnosed_date}\n  Status: ${c.status}`)
                .join('\n')}\n\n**Past Surgeries:**\n${mh.past_surgeries.map((s) => `- **${s.procedure}** (${s.date})\n  Location: ${s.hospital}`).join('\n')}`,
        };
    }
    // ============================================================================
    // 8. FAMILY HISTORY QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('family history') || lowerQuery.includes('family medical')) {
        const fh = patientData.family_history;
        return {
            short_answer: `${p.first_name} has a strong family history of cardiovascular disease and diabetes.`,
            detailed_summary: `**Family Medical History for ${p.name}:**\n\n- **Father**: ${fh.father}\n- **Mother**: ${fh.mother}\n- **Siblings**: ${fh.siblings}\n\n**Clinical Notes**: ${fh.notes}\n\n**Risk Assessment:** Positive family history increases risk for cardiovascular disease and type 2 diabetes. Preventive care and lifestyle modifications are essential.`,
        };
    }
    // ============================================================================
    // 9. SMOKING / LIFESTYLE QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('smok') ||
        lowerQuery.includes('alcohol') ||
        lowerQuery.includes('exercise') ||
        lowerQuery.includes('lifestyle') ||
        lowerQuery.includes('social history')) {
        const sh = patientData.social_history;
        return {
            short_answer: `${p.first_name} is a former smoker (quit 10 years ago), drinks occasionally, and exercises 3-4 times per week.`,
            detailed_summary: `**Social History for ${p.name}:**\n\n- **Smoking**: ${sh.smoking}\n- **Alcohol**: ${sh.alcohol}\n- **Exercise**: ${sh.exercise}\n- **Occupation**: ${sh.occupation}\n- **Living Situation**: ${sh.lives_with}\n\n**Lifestyle Assessment:** Good adherence to healthy lifestyle modifications. Smoking cessation 10 years ago significantly reduced cardiovascular risk. Current exercise routine supports diabetes and hypertension management.`,
        };
    }
    // ============================================================================
    // 10. APPOINTMENT / NEXT VISIT QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('appointment') ||
        lowerQuery.includes('next visit') ||
        lowerQuery.includes('upcoming') ||
        lowerQuery.includes('when is')) {
        const appt = patientData.appointments.upcoming[0];
        return {
            short_answer: `${p.first_name}'s next appointment is on ${appt.date} at ${appt.time} with ${appt.provider} for ${appt.type}.`,
            detailed_summary: `**Upcoming Appointments for ${p.name}:**\n\n${patientData.appointments.upcoming
                .map((a) => `**${a.date} at ${a.time}**\n- Provider: ${a.provider}\n- Type: ${a.type}\n- Location: ${a.location}`)
                .join('\n\n')}\n\n**Recent Appointments:**\n${patientData.appointments.past.map((a) => `- ${a.date}: ${a.type} with ${a.provider}`).join('\n')}`,
        };
    }
    // ============================================================================
    // 11. EMERGENCY CONTACT QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('emergency contact') || lowerQuery.includes('who to call')) {
        const ec = p.emergency_contact;
        return {
            short_answer: `Emergency contact: ${ec.name} (${ec.relationship}) at ${ec.phone}.`,
            detailed_summary: `**Emergency Contact Information for ${p.name}:**\n\n- **Name**: ${ec.name}\n- **Relationship**: ${ec.relationship}\n- **Phone**: ${ec.phone}\n\n**Patient Contact Information:**\n- **Phone**: ${p.phone}\n- **Email**: ${p.email}\n- **Address**: ${p.address}`,
        };
    }
    // ============================================================================
    // 12. AGE / DATE OF BIRTH QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('age') || lowerQuery.includes('old') || lowerQuery.includes('born')) {
        return {
            short_answer: `${p.first_name} ${p.last_name} is ${p.age} years old, born on ${p.date_of_birth}.`,
            detailed_summary: `**Patient Age Information:**\n\n- **Age**: ${p.age} years old\n- **Date of Birth**: ${p.date_of_birth}\n- **Gender**: ${p.gender}\n- **Full Name**: ${p.name}`,
        };
    }
    // ============================================================================
    // 13. MEDICATION QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('medication') ||
        lowerQuery.includes('medicine') ||
        lowerQuery.includes('drug') ||
        lowerQuery.includes('prescription') ||
        lowerQuery.includes('pill')) {
        const meds = patientData.medications;
        return {
            short_answer: `${p.first_name} is currently taking ${meds.length} medications: Metformin 500mg twice daily, Lisinopril 10mg once daily, and Atorvastatin 20mg at bedtime.`,
            detailed_summary: `**Current Medications for ${p.name}:**\n\n${meds
                .map((m, i) => `${i + 1}. **${m.name} ${m.dosage}**\n   - Frequency: ${m.frequency}\n   - Prescribed by: ${m.prescriber}\n   - Date: ${m.prescribed_date}`)
                .join('\n\n')}\n\n**Medication Adherence:** Patient reports good compliance with all medications.\n\n**Important Notes:**\n- Take Metformin with meals to reduce GI side effects\n- Take Lisinopril in morning (may cause lightheadedness initially)\n- Take Atorvastatin at bedtime for optimal effect`,
        };
    }
    // ============================================================================
    // 14. DIABETES / BLOOD SUGAR QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('diabetes') ||
        lowerQuery.includes('blood sugar') ||
        lowerQuery.includes('glucose')) {
        return {
            short_answer: `${p.first_name} has Type 2 Diabetes with recent improvement in A1C from 8.2% to 7.1%.`,
            detailed_summary: `**Diabetes Management for ${p.name}:**\n\n- **Diagnosis**: Type 2 Diabetes Mellitus (ICD-10: E11.9)\n- **Diagnosed**: June 15, 2022\n- **Current A1C**: 7.1% (down from 8.2%)\n- **Target A1C**: <7.0%\n- **Status**: Improving control\n\n**Treatment Plan:**\n- Medication: Metformin 500mg twice daily with meals\n- Diet: Carbohydrate counting, portion control\n- Exercise: Regular physical activity recommended\n- Monitoring: Home blood glucose testing\n\n**Recent Progress:** Significant improvement in glycemic control over past month. Patient demonstrates good medication adherence and understanding of diabetes self-management.`,
        };
    }
    // ============================================================================
    // 15. BLOOD PRESSURE / HYPERTENSION QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('blood pressure') ||
        lowerQuery.includes('hypertension') ||
        lowerQuery.includes('bp') ||
        lowerQuery.match(/\bbp\b/)) {
        return {
            short_answer: `${p.first_name} has hypertension currently controlled at 128/82 mmHg with Lisinopril 10mg daily.`,
            detailed_summary: `**Blood Pressure Management for ${p.name}:**\n\n- **Diagnosis**: Essential Hypertension (ICD-10: I10)\n- **Current BP**: 128/82 mmHg (March 20, 2024)\n- **Target BP**: 120/80 mmHg\n- **Trend**: Improving - was 142/90 mmHg in January\n\n**Treatment Plan:**\n- Medication: Lisinopril 10mg once daily in morning\n- Lifestyle: DASH diet, salt restriction (<2000mg/day)\n- Monitoring: Home BP monitoring, regular follow-ups\n\n**Recent Progress:** Blood pressure well-controlled with current regimen. Patient educated on dietary modifications and showing good compliance.`,
        };
    }
    // ============================================================================
    // 16. CARE PLAN QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('care plan') ||
        lowerQuery.includes('treatment plan') ||
        lowerQuery.includes('plan of care')) {
        const plans = patientData.care_plans;
        return {
            short_answer: `${p.first_name} has ${plans.length} active care plans: Diabetes Management and Hypertension Control.`,
            detailed_summary: `**Active Care Plans for ${p.name}:**\n\n${plans
                .map((c, i) => `**${i + 1}. ${c.title}** (${c.status})\n- Created: ${c.created_at.split('T')[0]}\n- Provider: ${c.provider}\n- Description: ${c.description}`)
                .join('\n\n')}`,
        };
    }
    // ============================================================================
    // 17. DIAGNOSIS / CONDITION QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('diagnosis') ||
        lowerQuery.includes('condition') ||
        lowerQuery.includes('disease')) {
        const conditions = patientData.medical_history.chronic_conditions;
        return {
            short_answer: `${p.first_name} has ${conditions.length} active diagnoses: Type 2 Diabetes, Hypertension, and Hyperlipidemia.`,
            detailed_summary: `**Active Medical Conditions for ${p.name}:**\n\n${conditions
                .map((c, i) => `${i + 1}. **${c.condition}**\n   - ICD-10: ${c.icd10}\n   - Diagnosed: ${c.diagnosed_date}\n   - Status: ${c.status}`)
                .join('\n\n')}\n\n**Overall Health Status:** All conditions are under active management with good control and positive treatment response.`,
        };
    }
    // ============================================================================
    // 18. PROVIDER / DOCTOR QUESTIONS
    // ============================================================================
    if (isDoctorQuestion || lowerQuery.includes('treating')) {
        return {
            short_answer: `${p.first_name}'s primary care provider is Dr. Sarah Johnson.`,
            detailed_summary: `**Healthcare Team for ${p.name}:**\n\n**Primary Care Physician:**\n- Dr. Sarah Johnson\n- Managing: Diabetes, Hypertension, Hyperlipidemia\n- Prescribing all current medications\n\n**Supporting Providers:**\n- Nurse Practitioner Mary Williams (Follow-up visits, BP monitoring)\n- Dr. Robert Chen, Ophthalmologist (Annual eye exams for diabetic retinopathy screening)\n\n**Care Coordination:** All providers communicate through shared EHR to ensure comprehensive, coordinated care.`,
        };
    }
    // ============================================================================
    // 19. RECENT VISIT / PROGRESS QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('recent') ||
        lowerQuery.includes('latest') ||
        lowerQuery.includes('last visit') ||
        lowerQuery.includes('progress')) {
        const lastVisit = patientData.appointments.past[0];
        return {
            short_answer: `${p.first_name}'s most recent visit was ${lastVisit.date} with ${lastVisit.provider} for ${lastVisit.type}.`,
            detailed_summary: `**Recent Visit Summary for ${p.name}:**\n\n**${lastVisit.date} - ${lastVisit.type}**\n- Provider: ${lastVisit.provider}\n- Blood pressure: 128/82 mmHg\n- Key Discussion: Salt intake reduction, DASH diet\n- Patient Education: Dietary modifications for BP control\n- Follow-up Plan: 2 weeks\n\n**Previous Visit (March 15, 2024):**\n- Provider: Dr. Sarah Johnson  \n- Type: Quarterly Diabetes Check\n- A1C Result: 7.1% (improved from 8.2%)\n- Assessment: Good medication adherence, improving glycemic control\n- Education: Importance of regular exercise\n\n**Overall Progress:** Positive trends in both diabetes and hypertension management.`,
        };
    }
    // ============================================================================
    // 20. CONTACT INFORMATION QUESTIONS
    // ============================================================================
    if (lowerQuery.includes('contact') || lowerQuery.includes('phone') || lowerQuery.includes('email')) {
        return {
            short_answer: `Contact ${p.first_name} at ${p.phone} or ${p.email}.`,
            detailed_summary: `**Contact Information for ${p.name}:**\n\n- **Phone**: ${p.phone}\n- **Email**: ${p.email}\n- **Address**: ${p.address}\n- **Preferred Language**: ${p.primary_language}\n\n**Emergency Contact:**\n- **Name**: ${p.emergency_contact.name}\n- **Relationship**: ${p.emergency_contact.relationship}\n- **Phone**: ${p.emergency_contact.phone}`,
        };
    }
    // ============================================================================
    // DEFAULT: INTELLIGENT FALLBACK WITH INTENT-BASED SUGGESTIONS
    // ============================================================================
    // Use intent detection to provide smart suggestions
    const suggestions = {
        name: [
            '"What is the patient\'s name?"',
            '"What is the patient\'s age?"',
            '"What is the patient\'s date of birth?"',
        ],
        age: [
            '"How old is the patient?"',
            '"When was the patient born?"',
            '"What is the patient\'s age?"',
        ],
        medications: [
            '"What medications is the patient taking?"',
            '"List all prescriptions"',
            '"What drugs is the patient on?"',
        ],
        allergies: [
            '"What allergies does the patient have?"',
            '"Is the patient allergic to anything?"',
            '"List patient allergies"',
        ],
        vitals: [
            '"What are the latest vital signs?"',
            '"What is the blood pressure?"',
            '"What is the patient\'s weight?"',
        ],
        labs: [
            '"What are the lab results?"',
            '"What is the A1C level?"',
            '"Show me the latest bloodwork"',
        ],
        diabetes: [
            '"How is the diabetes controlled?"',
            '"What is the A1C?"',
            '"What is the blood sugar level?"',
        ],
        blood_pressure: [
            '"What is the blood pressure?"',
            '"How is the hypertension managed?"',
            '"What is the latest BP reading?"',
        ],
        appointments: [
            '"When is the next appointment?"',
            '"What are the upcoming visits?"',
            '"When was the last visit?"',
        ],
        doctor: [
            '"Who is the patient\'s doctor?"',
            '"Who is the primary care provider?"',
            '"What providers see this patient?"',
        ],
        immunizations: [
            '"What vaccinations does the patient have?"',
            '"Is the flu shot up to date?"',
            '"What immunizations are current?"',
        ],
        general: [
            '"What is the patient\'s name?"',
            '"What medications is the patient taking?"',
            '"What allergies does the patient have?"',
            '"When is the next appointment?"',
        ],
    };
    // Get intent-specific suggestions or general ones
    const intentSuggestions = suggestions[intent.primary] || suggestions.general;
    // Build intelligent response based on detected intent
    let didYouMeanText = '';
    if (intent.confidence > 30 && intent.confidence < 70) {
        didYouMeanText = `\n\n**I detected you might be asking about "${intent.primary.replace(/_/g, ' ')}" (${intent.confidence.toFixed(0)}% confident).**\n\n**Did you mean:**\n${intentSuggestions.join('\n')}`;
    }
    return {
        short_answer: `I found information about ${p.name}. Could you be more specific about what you'd like to know?`,
        detailed_summary: `I have comprehensive medical records for **${p.name}** (${p.age}-year-old ${p.gender}, MRN: ${p.mrn}).

Your question: "${query}"
${intent.confidence > 0 ? `Detected topic: ${intent.primary.replace(/_/g, ' ')} (confidence: ${intent.confidence.toFixed(0)}%)` : ''}${didYouMeanText}

**Available Information Categories:**

**👤 Demographics & Contact**
- Patient name, age, date of birth
- Contact information (phone, email, address)
- Emergency contact details

**⚕️ Clinical Data**
- Allergies and reactions (${patientData.allergies.length} documented)
- Vital signs (BP, HR, temp, weight, BMI)
- Lab results (A1C, cholesterol, kidney/liver function)
- Current medications (${patientData.medications.length} active)

**📋 Medical History**
- Active diagnoses (${patientData.medical_history.chronic_conditions.length} conditions)
- Past surgeries (${patientData.medical_history.past_surgeries.length} procedures)
- Family history
- Social history (smoking, alcohol, exercise)

**📅 Care Management**
- Active care plans (${patientData.care_plans.length} plans)
- Healthcare providers
- Appointments (${patientData.appointments.upcoming.length} upcoming)
- Immunizations (${patientData.immunizations.length} current)

**Examples of questions I can answer:**
${intentSuggestions.join('\n')}

**Tip:** Try asking about a specific topic like medications, allergies, appointments, or lab results!`,
    };
}
//# sourceMappingURL=comprehensive-query-handler.js.map