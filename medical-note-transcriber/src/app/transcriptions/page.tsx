'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

interface Transcription {
  id: number;
  file_id: string;
  transcription_text: string | null;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
}

export default function TranscriptionsPage() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTranscriptions(data as Transcription[]);
    } catch (err: unknown) {
      console.error('Error fetching transcriptions:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load transcriptions. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchTranscriptions();
    
    // Set up a subscription to listen for changes
    const subscription = supabase
      .channel('transcriptions-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'transcriptions' 
      }, (payload) => {
        console.log('Received Supabase Realtime INSERT event:', payload);
        // Add new transcription to the beginning of the list
        setTranscriptions(current => [payload.new as Transcription, ...current]);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'transcriptions' 
      }, (payload) => {
        console.log('Received Supabase Realtime UPDATE event:', payload);
        // Update the specific transcription in the list
        setTranscriptions(current => 
          current.map(item => 
            item.id === payload.new.id ? (payload.new as Transcription) : item
          )
        );
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'transcriptions' 
      }, (payload) => {
        console.log('Received Supabase Realtime DELETE event:', payload);
        // Remove the deleted transcription from the list
        setTranscriptions(current => 
          current.filter(item => item.id !== payload.old.id)
        );
      })
      .subscribe((status) => {
        console.log('Supabase Realtime subscription status:', status);
      });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
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
  
  const getFileUrl = async (fileId: string) => {
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
  };
  
  const playAudio = async (fileId: string) => {
    const url = await getFileUrl(fileId);
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  };
  
  const deleteTranscription = async (id: number, fileId: string) => {
    if (!confirm('Are you sure you want to delete this transcription? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingId(id);
      
      // Optimistically update UI by removing the item immediately
      setTranscriptions(current => current.filter(item => item.id !== id));
      
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
      
      console.log('Transcription deleted successfully');
      
    } catch (err) {
      console.error('Error deleting transcription:', err);
      // If deletion fails, fetch all transcriptions again to restore the correct state
      fetchTranscriptions();
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to delete transcription. Please try again later.'
      );
    } finally {
      setDeletingId(null);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center p-6">
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
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
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
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
                  >
                    Play Audio
                  </button>
                  <button
                    onClick={() => deleteTranscription(transcription.id, transcription.file_id)}
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
        
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="text-blue-600 hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
