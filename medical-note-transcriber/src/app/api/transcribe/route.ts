import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.file_id) {
      return NextResponse.json(
        { error: 'file_id is required' },
        { status: 400 }
      );
    }
    
    // Get language parameter, default to English if not provided
    const language = body.language || 'en';
    
    // Get a signed URL for the file
    const { data: urlData, error: urlError } = await supabase.storage
      .from('medical-notes')
      .createSignedUrl(body.file_id, 60 * 5); // 5 minutes expiry
    
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      throw new Error(urlError.message);
    }
    
    // Call the transcription service
    const response = await fetch('http://localhost:8000/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: body.file_id,
        file_url: urlData.signedUrl,
        language: language,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to start transcription');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
