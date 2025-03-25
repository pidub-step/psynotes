import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, structured_note } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transcription ID is required' },
        { status: 400 }
      );
    }
    
    // Update the transcription in the database
    const { error } = await supabase
      .from('transcriptions')
      .update({ structured_note })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating transcription:', error);
      return NextResponse.json(
        { error: 'Failed to update transcription' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in update-transcription API:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
