import useSWR from 'swr';
import { supabase } from './supabase';

export interface Transcription {
  id: number;
  file_id: string;
  transcription_text: string | null;
  structured_note: string | null;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
}

// Fetcher function for SWR
const fetcher = async (key: string) => {
  // Parse the key to extract parameters
  const [, table, limit] = key.split('/'); // Skip the first element
  const limitNum = limit ? parseInt(limit) : 20; // Default limit to 20 records
  
  const { data, error } = await supabase
    .from(table)
    .select('id, file_id, status, created_at, transcription_text, structured_note')
    .order('created_at', { ascending: false })
    .limit(limitNum);
  
  if (error) throw error;
  return data;
};

export function useTranscriptions(limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<Transcription[]>(
    `supabase/transcriptions/${limit}`,
    fetcher,
    {
      revalidateOnFocus: false, // Don't revalidate when window gets focus
      revalidateOnReconnect: true, // Revalidate when browser regains connection
      refreshInterval: 0, // Don't poll for updates (we'll use Supabase realtime)
      dedupingInterval: 2000, // Deduplicate requests within 2 seconds
    }
  );
  
  return {
    transcriptions: data || [],
    isLoading,
    isError: error,
    mutate, // Function to manually revalidate data
  };
}

// Fetcher function for getting a signed URL
export async function getFileUrl(fileId: string) {
  try {
    const { data, error } = await supabase.storage
      .from('medical-notes')
      .createSignedUrl(fileId, 60);
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (err) {
    console.error('Error getting file URL:', err);
    return null;
  }
}

// Function to delete a transcription
export async function deleteTranscription(id: number, fileId: string) {
  const response = await fetch('/api/delete-transcription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, file_id: fileId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete transcription');
  }
  
  return true;
}

// Function to update a structured note
export async function updateStructuredNote(id: number, structuredNote: string) {
  const response = await fetch('/api/update-transcription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, structured_note: structuredNote }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update structured note');
  }
  
  return true;
}

// Function to generate a structured note
export async function generateStructuredNote(transcriptionText: string) {
  try {
    const response = await fetch('http://localhost:8002/structure-note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcription_text: transcriptionText }),
      mode: 'cors', // Add CORS mode
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate structured note');
    }
    
    const data = await response.json();
    return data.structured_note;
  } catch (err) {
    console.error('Error generating structured note:', err);
    return null;
  }
}
