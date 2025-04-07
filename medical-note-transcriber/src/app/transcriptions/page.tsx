'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Trash2, Play, Pause, FileText } from 'lucide-react';
import { useTranscriptions, getFileUrl, deleteTranscription as deleteTranscriptionApi, Transcription } from '@/lib/hooks';
import { TranscriptionSkeleton } from '@/components/TranscriptionSkeleton';
import { StructuredNoteModal } from '@/components/StructuredNoteModal';

interface AudioPlayerProps {
  url: string;
  onEnded: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Start playing by default
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded();
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    // Start playing automatically
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    });

    // Clean up
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url, onEnded]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={togglePlayPause}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="text-xs text-gray-500">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function TranscriptionsPage() {
  const { transcriptions, isLoading, mutate } = useTranscriptions(20);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isStructuredNoteModalOpen, setIsStructuredNoteModalOpen] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<number | null>(null);

  // Set up Supabase realtime subscription
  useEffect(() => {
    console.log('Setting up Supabase realtime subscription');

    const subscription = supabase
      .channel('transcriptions-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transcriptions'
      }, (payload) => {
        console.log('Received INSERT event:', payload);
        // Optimistically update the UI with the new transcription
        if (payload.new) {
          mutate((currentData) => {
            if (!currentData) return currentData;
            // Add the new transcription to the beginning of the list
            return [payload.new as Transcription, ...currentData];
          }, false); // false means don't revalidate with the server yet
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transcriptions'
      }, (payload) => {
        console.log('Received UPDATE event:', payload);
        // Optimistically update the specific transcription that changed
        if (payload.new) {
          mutate((currentData) => {
            if (!currentData) return currentData;
            // Replace the updated transcription in the list
            return currentData.map(item =>
              item.id === payload.new.id ? (payload.new as Transcription) : item
            );
          }, false); // false means don't revalidate with the server yet
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'transcriptions'
      }, (payload) => {
        console.log('Received DELETE event:', payload);
        // Optimistically remove the deleted transcription
        if (payload.old) {
          mutate((currentData) => {
            if (!currentData) return currentData;
            // Filter out the deleted transcription
            return currentData.filter(item => item.id !== payload.old.id);
          }, false); // false means don't revalidate with the server yet
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to transcriptions changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to transcriptions changes');
          setError('Failed to connect to real-time updates. Please refresh the page.');
        }
      });

    // Add a fallback polling mechanism in case realtime fails
    const pollingInterval = setInterval(() => {
      // Only poll if there are processing transcriptions
      if (transcriptions.some(t => t.status === 'processing')) {
        console.log('Polling for updates due to processing transcriptions');
        mutate();
      }
    }, 10000); // Poll every 10 seconds

    // Clean up when component unmounts
    return () => {
      console.log('Cleaning up Supabase realtime subscription');
      subscription.unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [mutate, transcriptions]);

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
    // If the same file is already playing, don't do anything
    if (playingFileId === fileId && audioUrl) {
      return;
    }

    // If a different file is playing, stop it first
    if (playingFileId && playingFileId !== fileId) {
      setPlayingFileId(null);
      setAudioUrl(null);
    }

    const url = await getFileUrl(fileId);
    if (url) {
      setPlayingFileId(fileId);
      setAudioUrl(url);
    }
  };

  const handleAudioEnded = () => {
    setPlayingFileId(null);
    setAudioUrl(null);
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

      await deleteTranscriptionApi(id, fileId);

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

                <div className="space-y-3">
                  {playingFileId === transcription.file_id && audioUrl ? (
                    <AudioPlayer
                      url={audioUrl}
                      onEnded={handleAudioEnded}
                    />
                  ) : (
                    <button
                      onClick={() => playAudio(transcription.file_id)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm flex items-center gap-1"
                    >
                      <Play size={14} />
                      Play Audio
                    </button>
                  )}

                  <div className="flex gap-2">
                    {transcription.status === 'completed' && transcription.transcription_text && (
                      <button
                        onClick={() => {
                          setSelectedTranscription(transcription.id);
                          setIsStructuredNoteModalOpen(true);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center gap-1"
                      >
                        <FileText size={14} />
                        View Structured Note
                      </button>
                    )}

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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Structured Note Modal */}
      {selectedTranscription && (
        <StructuredNoteModal
          isOpen={isStructuredNoteModalOpen}
          onClose={() => {
            setIsStructuredNoteModalOpen(false);
            setSelectedTranscription(null);
          }}
          transcriptionId={selectedTranscription}
          transcriptionText={
            transcriptions.find(t => t.id === selectedTranscription)?.transcription_text || null
          }
          structuredNote={
            transcriptions.find(t => t.id === selectedTranscription)?.structured_note || null
          }
          onUpdate={() => {
            // Revalidate data when the structured note is updated
            mutate();
          }}
        />
      )}
    </div>
  );
}
