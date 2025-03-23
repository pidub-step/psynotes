'use client'

import { ShineBorder } from './ShineBorder';
import { cn } from '@/lib/utils';

interface RecordingCardProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export function RecordingCard({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  disabled = false
}: RecordingCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg overflow-hidden">
        <ShineBorder 
          borderWidth={2} 
          duration={10} 
          shineColor={isRecording ? ["#ef4444", "#f97316", "#f59e0b"] : ["#3b82f6", "#6366f1", "#8b5cf6"]} 
        />
        
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="text-6xl font-mono font-bold tracking-wider">
            {formatTime(recordingTime)}
          </div>
          
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={disabled}
            className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
              isRecording 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-blue-500 hover:bg-blue-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isRecording ? (
              <span className="w-6 h-6 bg-white rounded-sm"></span>
            ) : (
              <span className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1"></span>
            )}
            <span className={cn(
              "absolute inset-0 rounded-full bg-white/20",
              isRecording ? "animate-ping opacity-75" : "opacity-0"
            )}></span>
          </button>
          
          <p className="text-sm text-gray-500">
            {isRecording ? "Recording in progress..." : "Click to start recording"}
          </p>
        </div>
      </div>
    </div>
  );
}
