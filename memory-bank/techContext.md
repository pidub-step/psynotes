Technical Context: Medical Note Transcription App

## Technology Stack

The Medical Note Transcription App uses a modern technology stack designed for scalability, performance, and developer productivity:

### Frontend Technologies

1. **Next.js 15 (App Router)**
   - Server-side rendering for improved performance
   - App Router for modern routing capabilities
   - API routes for backend functionality
   - TypeScript support for type safety
   - Version: 15.x

2. **shadcn/ui**
   - Modern component library
   - Built-in dark mode support
   - Accessible UI components
   - Customizable design system
   - Version: Latest

3. **Recorder.js**
   - High-quality audio recording in browsers
   - 16-bit PCM/WAV format support
   - Cross-browser compatibility
   - Version: Latest

4. **Supabase JavaScript Client**
   - Integration with Supabase services
   - Storage operations for audio files
   - Database operations for transcriptions
   - Realtime subscriptions for live updates
   - Version: Latest

### Backend Technologies

1. **Supabase Platform**
   - **Storage**: For audio file storage
   - **PostgreSQL**: For transcription data
   - **Edge Functions**: For serverless event handling
   - **Realtime**: For real-time status updates
   - Version: Latest

2. **Python FastAPI**
   - Microservice framework for transcription service
   - High performance and easy API development
   - Asynchronous request handling
   - OpenAPI documentation
   - Version: Latest

3. **OpenAI GPT-4o Transcribe API**
   - State-of-the-art speech recognition
   - Two model options:
     - gpt-4o-transcribe: Higher accuracy, more features
     - gpt-4o-mini-transcribe: Faster, more cost-effective
   - Multilingual support
   - Robust to background noise
   - Version: Latest

4. **ffmpeg**
   - Audio processing library
   - Splitting long audio files
   - Format conversion if needed
   - High-quality audio processing
   - Version: Latest

### Deployment Platforms

1. **Vercel**
   - Frontend hosting
   - Serverless functions
   - CI/CD integration
   - Edge network for global performance
   - Version: Latest

2. **Heroku** (or similar)
   - Transcription service hosting
   - Support for longer-running processes
   - Python runtime environment
   - Version: Latest

## Development Environment Setup

### Prerequisites

1. **Node.js and npm**
   - Required for Next.js development
   - Recommended version: Node.js 18.x or later
   - Installation: [Node.js Download](https://nodejs.org/)

2. **Python and pip**
   - Required for FastAPI development
   - Recommended version: Python 3.8 or later
   - Installation: [Python Download](https://www.python.org/downloads/)

3. **ffmpeg**
   - Required for audio processing
   - Installation: `brew install ffmpeg` (macOS) or equivalent for other platforms
   - Verify installation: `ffmpeg -version`

4. **Supabase Account**
   - Required for storage and database
   - Setup: [Supabase Dashboard](https://supabase.com/dashboard)

5. **OpenAI Account**
   - Required for GPT-4o Transcribe API access
   - Setup: [OpenAI Platform](https://platform.openai.com/)

### Local Development Setup

1. **Frontend Setup**
   ```bash
   # Create Next.js project
   npx create-next-app@latest medical-note-transcriber --use-npm
   cd medical-note-transcriber

   # Install dependencies
   npm install shadcn/ui
   npm install recorder-js
   npm install @supabase/supabase-js

   # Start development server
   npm run dev
   ```

2. **Supabase Configuration**
   ```javascript
   // lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

3. **Supabase Realtime Setup**
   ```javascript
   // Example Realtime subscription
   const subscription = supabase
     .channel('transcriptions-changes')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'transcriptions'
     }, (payload) => {
       // Handle INSERT event
       setTranscriptions(current => [payload.new as Transcription, ...current]);
     })
     .on('postgres_changes', {
       event: 'UPDATE',
       schema: 'public',
       table: 'transcriptions'
     }, (payload) => {
       // Handle UPDATE event
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
       // Handle DELETE event
       setTranscriptions(current =>
         current.filter(item => item.id !== payload.old.id)
       );
     })
     .subscribe();
   ```

4. **Transcription Service Setup**
   ```bash
   # Create directory for service
   mkdir transcription-service
   cd transcription-service

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install fastapi uvicorn openai requests python-dotenv

   # Start development server
   uvicorn main:app --reload
   ```

5. **Environment Variables**
   - Frontend (.env.local):
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
   - Transcription Service (.env):
     ```
     OPENAI_API_KEY=your-openai-api-key
     SUPABASE_URL=your-supabase-url
     SUPABASE_SERVICE_KEY=your-supabase-service-key
     PORT=8000
     HOST=0.0.0.0
     ```

6. **Next.js Configuration**
   ```typescript
   // next.config.ts
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     /* config options here */
     reactStrictMode: false // Disable Strict Mode to prevent double-rendering in development
   };

   export default nextConfig;
   ```

## Technical Constraints and Considerations

### Browser Compatibility

1. **Audio Recording Support**
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - Mobile Safari requires specific handling for permissions
   - Some older browsers may not support high-quality recording

2. **WebRTC Requirements**
   - Secure context (HTTPS) required for production
   - User permission prompts for microphone access

### API Limitations

1. **GPT-4o Transcribe API Constraints**
   - File size limits
   - Rate limits based on OpenAI account tier
   - Cost considerations for long recordings

2. **Supabase Limits**
   - Storage quotas based on plan
   - Database connection limits
   - Edge Function execution time limits
   - Realtime subscription limits

### Performance Considerations

1. **Audio File Size**
   - 16-bit PCM/WAV files are larger than compressed formats
   - 90-minute recording could be substantial in size
   - Upload bandwidth requirements for users

2. **Transcription Processing Time**
   - Longer recordings take more time to process
   - User expectations need to be managed with status indicators

3. **Mobile Device Limitations**
   - Battery impact during long recordings
   - Storage space for temporary files
   - Network reliability for uploads

4. **UI Performance**
   - Realtime updates vs. polling trade-offs
   - React rendering optimizations
   - Optimistic UI updates for better user experience

## Dependencies and External Services

### Core Dependencies

1. **Frontend Dependencies**
   - next: ^15.0.0
   - react: ^18.0.0
   - react-dom: ^18.0.0
   - recorder-js: ^latest
   - @supabase/supabase-js: ^latest
   - shadcn/ui: ^latest
   - lucide-react: ^latest (for icons)

2. **Backend Dependencies**
   - fastapi: ^latest
   - uvicorn: ^latest
   - openai: ^latest
   - ffmpeg: (system dependency)
   - python-dotenv: ^latest
   - requests: ^latest

### External Services

1. **Supabase**
   - Account required
   - Free tier available for development
   - Production tier needed for deployment

2. **OpenAI**
   - Account required
   - API key needed
   - Credit card required for API usage
   - Models: gpt-4o-transcribe, gpt-4o-mini-transcribe

3. **Vercel**
   - Account required
   - Free tier available for development
   - Production tier recommended for deployment

4. **Heroku** (or similar)
   - Account required
   - Free tier may be limited for production use
   - Paid tier recommended for reliable service

## Repository Structure

1. **Single Repository Approach**
   - All project files in one repository
   - No submodules for simpler development workflow
   - Feature branches for new functionality
   - Pull requests for code review and merging

2. **Directory Structure**
   ```
   psynotes/
   ├── medical-note-transcriber/     # Main application
   │   ├── public/                   # Static assets
   │   ├── src/                      # Source code
   │   │   ├── app/                  # Next.js App Router
   │   │   │   ├── api/              # API routes
   │   │   │   ├── record/           # Recording page
   │   │   │   └── transcriptions/   # Transcriptions page
   │   │   ├── lib/                  # Shared utilities
   │   │   └── types/                # TypeScript types
   │   ├── transcription-service/    # Python FastAPI service
   │   │   ├── main.py               # Service entry point
   │   │   └── requirements.txt      # Python dependencies
   │   └── scripts/                  # Utility scripts
   ├── mcp-servers/                  # MCP server implementations
   │   ├── supabase-server/          # Supabase MCP server
   │   └── vercel-server/            # Vercel MCP server
   └── memory-bank/                  # Project documentation
       ├── projectbrief.md           # Project overview
       ├── productContext.md         # Product context
       ├── systemPatterns.md         # System architecture
       ├── techContext.md            # Technical context
       ├── activeContext.md          # Current state
       ├── progress.md               # Progress tracking
       └── .clinerules               # Project intelligence
   ```

## Documentation Resources

1. **Next.js Documentation**
   - [Next.js Docs](https://nextjs.org/docs)

2. **Supabase Documentation**
   - [Supabase Docs](https://supabase.com/docs)
   - [Storage Quickstart](https://supabase.com/docs/guides/storage/quickstart)
   - [Edge Functions](https://supabase.com/docs/guides/functions)
   - [Realtime](https://supabase.com/docs/guides/realtime)

3. **OpenAI Documentation**
   - [GPT-4o Transcribe API Docs](https://platform.openai.com/docs/api-reference/audio)
   - [GPT-4o Models](https://platform.openai.com/docs/models)

4. **FastAPI Documentation**
   - [FastAPI Docs](https://fastapi.tiangolo.com/)

5. **ffmpeg Documentation**
   - [ffmpeg Docs](https://ffmpeg.org/documentation.html)

6. **Deployment Documentation**
   - [Vercel Deployment](https://vercel.com/docs/deployment)
   - [Heroku Python Deployment](https://devcenter.heroku.com/categories/python-support)
