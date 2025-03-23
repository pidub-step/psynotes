import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 lg:p-8">
      <div className="max-w-5xl w-full items-center justify-center flex flex-col">
        <h1 className="text-3xl lg:text-4xl font-bold mb-6 text-center">Medical Note Transcription App</h1>
        
        <p className="text-lg lg:text-xl mb-8 text-center max-w-2xl">
          Record high-quality audio notes and get them transcribed automatically.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link 
            href="/record" 
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            Start Recording
          </Link>
          
          <Link 
            href="/transcriptions" 
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
          >
            View Transcriptions
          </Link>
        </div>
      </div>
    </div>
  );
}
