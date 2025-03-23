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
    
    // Prepare update data
    const updateData: { status: string; transcription_text?: string } = {
      status: body.status || 'error'
    };
    
    // Add transcription text if provided
    if (body.transcription_text) {
      updateData.transcription_text = body.transcription_text;
    }
    
    // Update the transcription in Supabase
    const { error } = await supabase
      .from('transcriptions')
      .update(updateData)
      .eq('file_id', body.file_id);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({
      message: 'Transcription updated successfully',
      file_id: body.file_id,
      status: updateData.status
    });
  } catch (error) {
    console.error('Update transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
