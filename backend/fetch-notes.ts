import { AvonHealthService } from './src/services/avonhealth.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function fetchNotes() {
  const patientId = 'user_n15wtm6xCNQGrmgfMCGOVaqEq0S2';

  const credentials = {
    client_id: process.env.AVON_CLIENT_ID || '',
    client_secret: process.env.AVON_CLIENT_SECRET || '',
    base_url: process.env.AVON_BASE_URL || 'https://demo-api.avonhealth.com',
    account: process.env.AVON_ACCOUNT || '',
    user_id: patientId,
  };

  const service = new AvonHealthService(credentials);

  console.log('Fetching all medical notes from Avon Health API...\n');

  try {
    const notes = await service.getNotes(patientId);

    console.log(`Total notes found: ${notes.length}\n`);
    console.log('=== ALL MEDICAL NOTES ===\n');

    if (notes.length === 0) {
      console.log('No notes found for this patient.');
    } else {
      notes.forEach((note: any, index: number) => {
        console.log(`\n--- Note ${index + 1} ---`);
        console.log('ID:', note.id);
        console.log('Title:', note.title || 'N/A');
        console.log('Type:', note.type || 'N/A');
        console.log('Created:', note.created_at);
        console.log('Updated:', note.updated_at || 'N/A');
        console.log('Author:', note.created_by || 'N/A');
        console.log('Patient:', note.patient);
        console.log('\nContent:');
        console.log('---');
        console.log(note.content || note.text || 'N/A');
        console.log('---');
      });

      console.log('\n\n=== FULL JSON DATA ===\n');
      console.log(JSON.stringify(notes, null, 2));
    }
  } catch (error: any) {
    console.error('Error fetching notes:', error.message);
  }
}

fetchNotes();
