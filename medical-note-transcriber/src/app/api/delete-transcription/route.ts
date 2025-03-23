import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request
    if (!body.id || !body.file_id) {
      return NextResponse.json(
        { error: 'id and file_id are required' },
        { status: 400 }
      );
    }
    
    // Delete the audio file from storage
    const { error: storageError } = await supabase.storage
      .from('medical-notes')
      .remove([body.file_id]);
    
    if (storageError) {
      console.error('Error deleting audio file:', storageError);
      // Continue with deleting the transcription record even if file deletion fails
    }
    
    // Delete the transcription record from the database
    const { error: dbError } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', body.id);
    
    if (dbError) {
      throw new Error(dbError.message);
    }
    
    return NextResponse.json({
      message: 'Transcription deleted successfully',
      id: body.id,
      file_id: body.file_id
    });
  } catch (error) {
    console.error('Delete transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
