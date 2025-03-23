'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Trash2, Play } from 'lucide-react';
import { useTranscriptions, getFileUrl, deleteTranscription } from '@/lib/hooks';
import { TranscriptionSkeleton } from '@/components/TranscriptionSkeleton';

export default function TranscriptionsPage() {
  const { transcriptions, isLoading, mutate } = useTranscriptions(20);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  // Set up Supabase realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel('transcriptions-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'transcriptions' 
      }, () => {
        // Revalidate data when a new transcription is added
        mutate();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'transcriptions' 
      }, () => {
        // Revalidate data when a transcription is updated
        mutate();
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'transcriptions' 
      }, () => {
        // Revalidate data when a transcription is deleted
        mutate();
      })
      .subscribe();
    
    // Clean up audio when component unmounts
    return () => {
      subscription.unsubscribe();
      if (playingAudio) {
        playingAudio.pause();
        playingAudio.src = '';
      }
    };
  }, [mutate, playingAudio]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Processing</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Error</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };
  
  // Play audio function with better state management
  const playAudio = async (fileId: string) => {
    // Stop any currently playing audio
    if (playingAudio) {
      playingAudio.pause();
      playingAudio.src = '';
    }
    
    const url = await getFileUrl(fileId);
    if (url) {
      const audio = new Audio(url);
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
      });
      
      setPlayingAudio(audio);
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setPlayingAudio(null);
      });
    }
  };
  
  // Handle transcription deletion
  const handleDeleteTranscription = async (id: number, fileId: string) => {
    if (!confirm('Are you sure you want to delete this transcription? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingId(id);
      
      // Optimistically update UI
      mutate(
        transcriptions.filter(item => item.id !== id),
        false // Don't revalidate yet
      );
      
      await deleteTranscription(id, fileId);
      
      // Revalidate after successful deletion
      mutate();
      
    } catch (err) {
      console.error('Error deleting transcription:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to delete transcription. Please try again later.'
      );
      // Revalidate to restore correct state
      mutate();
    } finally {
      setDeletingId(null);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center p-6 pt-16 lg:pt-6">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transcriptions</h1>
          <Link 
            href="/record" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Record New
          </Link>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <TranscriptionSkeleton />
        ) : transcriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500 mb-4">No transcriptions found</p>
            <Link 
              href="/record" 
              className="text-blue-600 hover:underline"
            >
              Record your first medical note
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptions.map((transcription) => (
              <div key={transcription.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {transcription.file_id.replace(/^medical-note-|\.wav$/g, '').replace(/-/g, ' ')}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {formatDate(transcription.created_at)}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(transcription.status)}
                  </div>
                </div>
                
                {transcription.status === 'completed' && transcription.transcription_text ? (
                  <div className="mb-4 p-4 bg-gray-50 rounded-md">
                    <p className="whitespace-pre-wrap">{transcription.transcription_text}</p>
                  </div>
                ) : transcription.status === 'processing' ? (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-md">
                    <p className="text-yellow-700">Transcription in progress...</p>
                  </div>
                ) : transcription.status === 'error' ? (
                  <div className="mb-4 p-4 bg-red-50 rounded-md">
                    <p className="text-red-700">Error processing transcription</p>
                  </div>
                ) : null}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => playAudio(transcription.file_id)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm flex items-center gap-1"
                    disabled={playingAudio !== null && playingAudio.src.includes(transcription.file_id)}
                  >
                    <Play size={14} />
                    {playingAudio !== null && playingAudio.src.includes(transcription.file_id) 
                      ? 'Playing...' 
                      : 'Play Audio'}
                  </button>
                  <button
                    onClick={() => handleDeleteTranscription(transcription.id, transcription.file_id)}
                    disabled={deletingId === transcription.id}
                    className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${
                      deletingId === transcription.id
                        ? 'bg-red-100 text-red-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-600 hover:bg-red-200 transition-colors'
                    }`}
                  >
                    <Trash2 size={14} />
                    {deletingId === transcription.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}
