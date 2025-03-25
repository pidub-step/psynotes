'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, Copy, FileText } from 'lucide-react';
import { updateStructuredNote, generateStructuredNote } from '@/lib/hooks';

interface StructuredNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptionId: number;
  transcriptionText: string | null;
  structuredNote: string | null;
  onUpdate: () => void;
}

export const StructuredNoteModal: React.FC<StructuredNoteModalProps> = ({
  isOpen,
  onClose,
  transcriptionId,
  transcriptionText,
  structuredNote,
  onUpdate,
}) => {
  const [note, setNote] = useState(structuredNote || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Reset state when modal opens/closes or structured note changes
  useEffect(() => {
    setNote(structuredNote || '');
    setError(null);
    setCopySuccess(false);
    setSaveSuccess(false);
  }, [isOpen, structuredNote]);
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [note]);
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSaveSuccess(false);
      
      await updateStructuredNote(transcriptionId, note);
      
      setSaveSuccess(true);
      onUpdate();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save structured note');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(note).then(
      () => {
        setCopySuccess(true);
        // Reset success message after 3 seconds
        setTimeout(() => {
          setCopySuccess(false);
        }, 3000);
      },
      () => {
        setError('Failed to copy to clipboard');
      }
    );
  };
  
  const handleGenerate = async () => {
    if (!transcriptionText) {
      setError('No transcription text available');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const generatedNote = await generateStructuredNote(transcriptionText);
      
      if (generatedNote) {
        setNote(generatedNote);
      } else {
        setError('Failed to generate structured note');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate structured note');
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Structured Note</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {!note && !isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
              <FileText size={48} className="text-gray-400" />
              <p className="text-gray-500">No structured note available</p>
              {transcriptionText && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  Generate Structured Note
                </button>
              )}
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Generating structured note...</p>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-full min-h-[300px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono whitespace-pre-wrap"
              placeholder="Structured note content..."
            />
          )}
        </div>
        
        {error && (
          <div className="px-4 py-2 bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {(saveSuccess || copySuccess) && (
          <div className="px-4 py-2 bg-green-100 text-green-700 text-sm">
            {saveSuccess ? 'Structured note saved successfully!' : ''}
            {copySuccess ? 'Copied to clipboard!' : ''}
          </div>
        )}
        
        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={handleCopy}
            disabled={!note || isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400 flex items-center gap-2"
          >
            <Copy size={16} />
            Copy
          </button>
          <button
            onClick={handleSave}
            disabled={!note || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center gap-2"
          >
            <Save size={16} />
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
