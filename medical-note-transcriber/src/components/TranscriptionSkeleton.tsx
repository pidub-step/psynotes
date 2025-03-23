'use client';

export function TranscriptionSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
