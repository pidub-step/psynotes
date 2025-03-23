'use client';

import Link from 'next/link';
import { Mic, FileText } from 'lucide-react';
import { ShineBorder } from '@/components/ShineBorder';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 pt-16 lg:pt-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Medical Note Transcriber</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Record and transcribe your medical notes with ease
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/record" className="block">
            <div className="relative bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg overflow-hidden h-full">
              <ShineBorder 
                borderWidth={2} 
                duration={10} 
                shineColor={["#3b82f6", "#6366f1", "#8b5cf6"]} 
              />
              <div className="flex flex-col items-center text-center h-full">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                  <Mic size={32} className="text-blue-600 dark:text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Record Note</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Record a new medical note using your microphone
                </p>
                <div className="mt-auto">
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Start Recording
                  </span>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/transcriptions" className="block">
            <div className="relative bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg overflow-hidden h-full">
              <ShineBorder 
                borderWidth={2} 
                duration={10} 
                shineColor={["#10b981", "#059669", "#047857"]} 
              />
              <div className="flex flex-col items-center text-center h-full">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full mb-4">
                  <FileText size={32} className="text-green-600 dark:text-green-300" />
                </div>
                <h2 className="text-2xl font-bold mb-2">View Transcriptions</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Access and manage your transcribed medical notes
                </p>
                <div className="mt-auto">
                  <span className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    View Transcriptions
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2025 Medical Note Transcriber. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
