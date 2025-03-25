import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_id, transcription_text, status } = body;
    
    if (!file_id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }
    
    // Update the transcription in the database
    const { data, error } = await supabase
      .from('transcriptions')
      .update({ transcription_text, status })
      .eq('file_id', file_id)
      .select('id');
    
    if (error) {
      console.error('Error updating transcription:', error);
      return NextResponse.json(
        { error: 'Failed to update transcription' },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, id: data[0].id });
  } catch (err) {
    console.error('Error in update-transcription-text API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
