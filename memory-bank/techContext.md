# Technical Context: Medical Note Transcription App

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
   - Version: Latest

### Backend Technologies

1. **Supabase Platform**
   - **Storage**: For audio file storage
   - **PostgreSQL**: For transcription data
   - **Edge Functions**: For serverless event handling
   - **Realtime**: Optional for status updates
   - Version: Latest

2. **Python FastAPI**
   - Microservice framework for transcription service
   - High performance and easy API development
   - Asynchronous request handling
   - OpenAPI documentation
   - Version: Latest

3. **OpenAI Whisper API**
   - State-of-the-art speech recognition
   - Multilingual support
   - Robust to background noise
   - Cost-effective at $0.006/minute
   - Version: whisper-1

4. **pydub**
   - Audio processing library for Python
   - Splitting long audio files
   - Format conversion if needed
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

3. **Supabase Account**
   - Required for storage and database
   - Setup: [Supabase Dashboard](https://supabase.com/dashboard)

4. **OpenAI Account**
   - Required for Whisper API access
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
   // lib/supabase.js
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   
   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

3. **Transcription Service Setup**
   ```bash
   # Create directory for service
   mkdir transcription-service
   cd transcription-service
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install fastapi uvicorn openai pydub requests python-dotenv
   
   # Start development server
   uvicorn main:app --reload
   ```

4. **Environment Variables**
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

1. **Whisper API Constraints**
   - 25MB file size limit per request
   - Rate limits based on OpenAI account tier
   - Cost considerations for long recordings

2. **Supabase Limits**
   - Storage quotas based on plan
   - Database connection limits
   - Edge Function execution time limits

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

## Dependencies and External Services

### Core Dependencies

1. **Frontend Dependencies**
   - next: ^15.0.0
   - react: ^18.0.0
   - react-dom: ^18.0.0
   - recorder-js: ^latest
   - @supabase/supabase-js: ^latest
   - shadcn/ui: ^latest

2. **Backend Dependencies**
   - fastapi: ^latest
   - uvicorn: ^latest
   - openai: ^latest
   - pydub: ^latest
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
   - Cost: $0.006 per minute of audio

3. **Vercel**
   - Account required
   - Free tier available for development
   - Production tier recommended for deployment

4. **Heroku** (or similar)
   - Account required
   - Free tier may be limited for production use
   - Paid tier recommended for reliable service

## Documentation Resources

1. **Next.js Documentation**
   - [Next.js Docs](https://nextjs.org/docs)

2. **Supabase Documentation**
   - [Supabase Docs](https://supabase.com/docs)
   - [Storage Quickstart](https://supabase.com/docs/guides/storage/quickstart)
   - [Edge Functions](https://supabase.com/docs/guides/functions)

3. **OpenAI Documentation**
   - [Whisper API Docs](https://platform.openai.com/docs/api-reference/audio/createTranscription)
   - [Whisper API FAQ](https://help.openai.com/en/articles/7031512-whisper-api-faq)

4. **FastAPI Documentation**
   - [FastAPI Docs](https://fastapi.tiangolo.com/)

5. **Deployment Documentation**
   - [Vercel Deployment](https://vercel.com/docs/deployment)
   - [Heroku Python Deployment](https://devcenter.heroku.com/categories/python-support)
