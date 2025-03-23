# System Patterns: Medical Note Transcription App

## System Architecture

The Medical Note Transcription App follows a modern, distributed architecture with clear separation of concerns:

```mermaid
graph TD
    subgraph "Frontend (Next.js)"
        UI[User Interface]
        RC[Recording Component]
        UC[Upload Component]
        TD[Transcription Display]
        RS[Realtime Subscription]
    end
    
    subgraph "Storage (Supabase)"
        SB[Storage Bucket]
        PG[PostgreSQL Database]
        RT[Realtime Service]
    end
    
    subgraph "Backend Services"
        EF[Edge Function]
        TS[Transcription Service]
        WA[Whisper API]
    end
    
    UI --> RC
    RC --> UC
    UC --> SB
    SB --> EF
    EF --> TS
    TS --> WA
    TS --> PG
    PG --> RT
    RT --> RS
    RS --> TD
```

## Component Relationships

### Frontend Components

1. **User Interface (UI)**
   - Container for all frontend components
   - Manages application state and routing
   - Implements responsive design for desktop and mobile

2. **Recording Component (RC)**
   - Handles audio recording using Recorder.js
   - Captures 16-bit PCM/WAV format audio
   - Provides recording controls and timer display

3. **Upload Component (UC)**
   - Manages file upload to Supabase Storage
   - Displays upload progress
   - Handles upload errors and retries

4. **Transcription Display (TD)**
   - Retrieves transcription from PostgreSQL
   - Displays transcription text with appropriate formatting
   - Shows transcription status (processing, completed)

5. **Realtime Subscription (RS)**
   - Subscribes to Supabase Realtime events
   - Updates UI in real-time when transcription status changes
   - Handles individual events for optimized performance

### Backend Components

1. **Storage Bucket (SB)**
   - Stores WAV audio files
   - Triggers events on file upload

2. **PostgreSQL Database (PG)**
   - Stores transcription metadata and text
   - Maintains relationship between audio files and transcriptions

3. **Realtime Service (RT)**
   - Broadcasts database changes as events
   - Enables real-time updates without polling
   - Supports filtering by event type (INSERT, UPDATE, DELETE)

4. **Edge Function (EF)**
   - Triggered by storage events
   - Calls transcription service with file URL

5. **Transcription Service (TS)**
   - Python FastAPI microservice
   - Handles audio file processing
   - Manages communication with Whisper API
   - Stores transcription results in PostgreSQL

6. **Whisper API (WA)**
   - OpenAI's API for audio transcription
   - Processes audio chunks and returns text

## Data Flow Patterns

### Recording and Transcription Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Storage
    participant EdgeFunction
    participant TranscriptionService
    participant WhisperAPI
    participant Database
    participant RealtimeService
    
    User->>Frontend: Start Recording
    Frontend->>Frontend: Record Audio (WAV)
    User->>Frontend: Stop Recording
    Frontend->>Storage: Upload Audio File
    Storage->>EdgeFunction: Trigger on Upload
    EdgeFunction->>TranscriptionService: Send File URL
    TranscriptionService->>Storage: Download Audio
    TranscriptionService->>TranscriptionService: Split if >25MB
    TranscriptionService->>WhisperAPI: Send Audio Chunk(s)
    WhisperAPI->>TranscriptionService: Return Transcription(s)
    TranscriptionService->>TranscriptionService: Combine if Split
    TranscriptionService->>Database: Store Transcription
    Database->>RealtimeService: Broadcast Change Event
    RealtimeService->>Frontend: Push Update via Subscription
    Frontend->>User: Display Transcription
```

## Key Technical Decisions

1. **High-Quality Audio Format**
   - Decision: Use 16-bit PCM/WAV format for audio recording
   - Rationale: Highest quality available in browsers, leading to better transcription accuracy
   - Implementation: Recorder.js library configured for WAV output

2. **Backend Transcription Processing**
   - Decision: Process transcriptions entirely on the backend
   - Rationale: Removes computational burden from client devices, handles longer recordings
   - Implementation: FastAPI microservice with OpenAI Whisper API integration

3. **Audio File Splitting**
   - Decision: Split audio files exceeding 25MB into chunks
   - Rationale: Whisper API has a 25MB file size limit
   - Implementation: Python pydub library for audio processing

4. **Serverless Architecture**
   - Decision: Use serverless components where possible
   - Rationale: Improved scalability, reduced operational overhead
   - Implementation: Next.js on Vercel, Supabase Edge Functions

5. **Separate Transcription Service**
   - Decision: Deploy transcription service separately from frontend
   - Rationale: Allows for longer processing times and specialized scaling
   - Implementation: FastAPI on Heroku or similar platform

6. **Real-time Updates**
   - Decision: Use Supabase Realtime for status updates
   - Rationale: Provides immediate updates without polling, reduces UI flashing
   - Implementation: Supabase Realtime subscription with event-specific handlers

7. **Repository Structure**
   - Decision: Convert submodule to regular directory
   - Rationale: Simplifies development workflow and repository management
   - Implementation: Single repository with all project files

## Design Patterns

1. **Event-Driven Architecture**
   - Storage events trigger transcription process
   - Database changes broadcast events via Realtime service
   - Asynchronous processing decouples recording from transcription

2. **Microservice Pattern**
   - Separate services for frontend and transcription
   - Clear API boundaries between components

3. **Observer Pattern**
   - Frontend subscribes to database changes via Realtime
   - UI updates automatically when data changes
   - Replaces polling with push-based updates

4. **Repository Pattern**
   - Abstraction layer for database operations
   - Centralizes data access logic

5. **State Management**
   - Frontend maintains application state (recording, uploading, transcribing)
   - Clear state transitions with appropriate UI feedback
   - Optimistic UI updates for immediate feedback

6. **Optimistic UI Pattern**
   - Update UI immediately before server confirmation
   - Fallback to server state if operation fails
   - Provides responsive user experience

## Technical Constraints

1. **Browser Audio Limitations**
   - Constraint: Browsers limit audio recording quality and format options
   - Mitigation: Use Recorder.js for highest quality available (16-bit PCM/WAV)

2. **File Size Limits**
   - Constraint: Whisper API has a 25MB file size limit
   - Mitigation: Split audio files into chunks and combine transcriptions

3. **Mobile Browser Compatibility**
   - Constraint: Safari on iOS has specific requirements for audio recording
   - Mitigation: Test thoroughly on iOS devices, implement appropriate permissions handling

4. **Processing Time**
   - Constraint: Transcription of long audio files takes time
   - Mitigation: Clear status indicators, asynchronous processing, real-time updates

5. **UI Performance**
   - Constraint: Frequent updates can cause UI flashing
   - Mitigation: Use Realtime subscriptions with optimized event handling
   - Mitigation: Disable React Strict Mode in development for smoother experience
