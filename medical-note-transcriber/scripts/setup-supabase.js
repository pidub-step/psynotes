// This script sets up the Supabase storage bucket for medical notes

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using service role key for admin operations');

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSupabase() {
  try {
    // Create the medical-notes bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'medical-notes');
    
    if (!bucketExists) {
      console.log('Creating medical-notes bucket...');
      const { error: createError } = await supabase.storage.createBucket('medical-notes', {
        public: false
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('medical-notes bucket created successfully!');
    } else {
      console.log('medical-notes bucket already exists.');
    }
    
    // Create the transcriptions table if it doesn't exist
    console.log('Creating transcriptions table...');
    
    try {
      // Execute a direct SQL query to create the table
      const { error: tableError } = await supabase.from('transcriptions').select('id').limit(1);
      
      if (tableError && tableError.code === '42P01') { // Table doesn't exist
        console.log('Table does not exist, creating it...');
        
        const createTableQuery = `
          CREATE TABLE transcriptions (
            id SERIAL PRIMARY KEY,
            file_id TEXT UNIQUE,
            transcription_text TEXT,
            status TEXT DEFAULT 'processing',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        // We can't execute arbitrary SQL directly with the Supabase client
        // So we'll just provide instructions for the user
        console.log('Please create the transcriptions table manually in the Supabase dashboard SQL editor with this query:');
        console.log(createTableQuery);
      } else {
        console.log('transcriptions table already exists.');
      }
    } catch (err) {
      console.warn('Could not check if transcriptions table exists:', err.message);
      console.log('Please create the transcriptions table manually in the Supabase dashboard SQL editor with this query:');
      console.log(`
        CREATE TABLE IF NOT EXISTS transcriptions (
          id SERIAL PRIMARY KEY,
          file_id TEXT UNIQUE,
          transcription_text TEXT,
          status TEXT DEFAULT 'processing',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
    
    console.log('Supabase setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Supabase:', error.message);
    process.exit(1);
  }
}

setupSupabase();
