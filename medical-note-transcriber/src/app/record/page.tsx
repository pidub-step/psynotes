'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RecordingCard } from '@/components/RecordingCard';

import type Recorder from 'recorder-js';

// Recorder.js is a client-side library, so we need to import it dynamically
let RecorderClass: typeof Recorder | null = null;

export default function RecordPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("fr"); // Default to French
  
  const recorderRef = useRef<Recorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load Recorder.js dynamically on the client side
  useEffect(() => {
    const loadRecorder = async () => {
      try {
        RecorderClass = (await import('recorder-js')).default;
      } catch (err) {
        console.error('Failed to load Recorder.js:', err);
        setError('Failed to load audio recording library. Please try again later.');
      }
    };
    
    loadRecorder();
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || ((window as unknown) as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Initialize recorder
      if (!RecorderClass || !audioContextRef.current) {
        throw new Error('Recorder or AudioContext not initialized');
      }
      recorderRef.current = new RecorderClass(audioContextRef.current);
      await recorderRef.current.init(stream);
      
      // Start recording
      recorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err: unknown) {
      console.error('Recording error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to start recording. Please check microphone permissions.'
      );
    }
  };
  
  const stopRecording = async () => {
    if (!recorderRef.current) return;
    
    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop recording and get audio data
      const { blob } = await recorderRef.current.stop();
      setAudioBlob(blob);
      setIsRecording(false);
      
      // Clean up
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
    } catch (err: unknown) {
      console.error('Error stopping recording:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to process recording.'
      );
    }
  };
  
  const uploadRecording = async () => {
    if (!audioBlob) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Generate a unique file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `medical-note-${timestamp}.wav`;
      
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('medical-notes')
        .upload(fileName, audioBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'audio/wav'
        });
      
      if (error) throw error;
      
      // Create a record in the transcriptions table
      const { error: insertError } = await supabase
        .from('transcriptions')
        .insert({
          file_id: fileName,
          status: 'processing'
        });
      
      if (insertError) throw insertError;
      
      // Trigger transcription process
      try {
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_id: fileName,
            language: language,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Transcription API error:', errorData);
          // Continue anyway, as the file is uploaded and we can try transcription later
        }
      } catch (transcriptionError) {
        console.error('Failed to trigger transcription:', transcriptionError);
        // Continue anyway, as the file is uploaded and we can try transcription later
      }
      
      // Redirect to transcriptions page
      router.push('/transcriptions');
      
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to upload recording.'
      );
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center p-6 pt-16 lg:pt-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Record Medical Note</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
          <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRecording || isUploading}
          >
            <option value="fr">Français (Canada)</option>
            <option value="en">English</option>
          </select>
        </div>
        
        {!audioBlob ? (
          <RecordingCard
            isRecording={isRecording}
            recordingTime={recordingTime}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            disabled={isUploading}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
            <div className="mb-4">
              <audio 
                src={URL.createObjectURL(audioBlob)} 
                controls 
                className="w-full"
              />
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setRecordingTime(0);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Discard
              </button>
              
              <button
                onClick={uploadRecording}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        )}
        
        {isUploading && (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full relative"
                style={{ width: `${uploadProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse"></div>
              </div>
            </div>
            <p className="text-center mt-2">Uploading... {uploadProgress}%</p>
          </div>
        )}
        
        <div className="text-center mt-6">
          <Link 
            href="/transcriptions"
            className="text-blue-600 hover:underline"
          >
            View Transcriptions
          </Link>
        </div>
      </div>
    </div>
  );
}
