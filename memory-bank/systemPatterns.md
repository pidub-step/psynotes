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
        SNM[Structured Note Modal]
    end
    
    subgraph "Storage (Supabase)"
        SB[Storage Bucket]
        PG[PostgreSQL Database]
        RT[Realtime Service]
    end
    
    subgraph "Backend Services"
        EF[Edge Function]
        TS[Transcription Service]
        WA[GPT-4o Transcribe API]
        SNS[Structured Notes Service]
        GA[GPT-4 API]
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
    TD --> SNM
    SNM --> SNS
    SNS --> GA
    SNS --> PG
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
   - Provides button to view structured note

5. **Realtime Subscription (RS)**
   - Subscribes to Supabase Realtime events
   - Updates UI in real-time when transcription status changes
   - Handles individual events for optimized performance

6. **Structured Note Modal (SNM)**
   - Displays structured note in a modal window
   - Provides editing capabilities for the structured note
   - Includes "Save" and "Copy" buttons for user interaction
   - Communicates with Structured Notes Service

### Backend Components

1. **Storage Bucket (SB)**
   - Stores WAV audio files
   - Triggers events on file upload

2. **PostgreSQL Database (PG)**
   - Stores transcription metadata and text
   - Stores structured note text
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
   - Manages communication with GPT-4o Transcribe API
   - Stores transcription results in PostgreSQL
   - Communicates with update-transcription-text API endpoint

6. **GPT-4o Transcribe API (WA)**
   - OpenAI's API for audio transcription (gpt-4o-transcribe or gpt-4o-mini-transcribe)
   - Processes audio chunks and returns text
   - State-of-the-art speech recognition with high accuracy

7. **Structured Notes Service (SNS)**
   - Python FastAPI microservice
   - Transforms raw transcriptions into structured medical notes
   - Uses OpenAI GPT-4 for text analysis and structuring
   - Implements CORS middleware for cross-origin requests
   - Communicates with PostgreSQL database

8. **GPT-4 API (GA)**
   - OpenAI's API for text generation and analysis
   - Processes raw transcriptions and structures them according to predefined format
   - Handles medical terminology and formatting rules

## Data Flow Patterns

### Recording and Transcription Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Storage
    participant EdgeFunction
    participant TranscriptionService
    participant GPT4oAPI
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
    TranscriptionService->>GPT4oAPI: Send Audio Chunk(s)
    GPT4oAPI->>TranscriptionService: Return Transcription(s) from GPT-4o models
    TranscriptionService->>TranscriptionService: Combine if Split
    TranscriptionService->>Database: Store Transcription
    Database->>RealtimeService: Broadcast Change Event
    RealtimeService->>Frontend: Push Update via Subscription
    Frontend->>User: Display Transcription
```

### Structured Notes Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant StructuredNoteModal
    participant StructuredNotesService
    participant GPT4API
    participant Database
    participant RealtimeService
    
    User->>Frontend: Click "View Structured Note"
    Frontend->>StructuredNoteModal: Open Modal
    StructuredNoteModal->>StructuredNotesService: Request Structured Note
    StructuredNotesService->>Database: Fetch Raw Transcription
    StructuredNotesService->>GPT4API: Send Transcription with Formatting Instructions
    GPT4API->>StructuredNotesService: Return Structured Note
    StructuredNotesService->>Database: Store Structured Note
    Database->>RealtimeService: Broadcast Change Event
    RealtimeService->>StructuredNoteModal: Push Update via Subscription
    StructuredNoteModal->>User: Display Structured Note
    User->>StructuredNoteModal: Edit Structured Note
    User->>StructuredNoteModal: Click "Save"
    StructuredNoteModal->>Database: Update Structured Note
    User->>StructuredNoteModal: Click "Copy"
    StructuredNoteModal->>User: Copy to Clipboard
```

## Key Technical Decisions

1. **High-Quality Audio Format**
   - Decision: Use 16-bit PCM/WAV format for audio recording
   - Rationale: Highest quality available in browsers, leading to better transcription accuracy
   - Implementation: Recorder.js library configured for WAV output

2. **Backend Transcription Processing**
   - Decision: Process transcriptions entirely on the backend
   - Rationale: Removes computational burden from client devices, handles longer recordings
   - Implementation: FastAPI microservice with OpenAI GPT-4o Transcribe API integration

3. **Audio File Splitting**
   - Decision: Split audio files exceeding 25MB into chunks
   - Rationale: API has file size limits
   - Implementation: Python pydub library for audio processing

4. **Serverless Architecture**
   - Decision: Use serverless components where possible
   - Rationale: Improved scalability, reduced operational overhead
   - Implementation: Next.js on Vercel, Supabase Edge Functions

5. **Separate Transcription Service**
   - Decision: Deploy transcription service separately from frontend
   - Rationale: Allows for longer processing times and specialized scaling
   - Implementation: FastAPI on Koyeb with Micro instances (0.5 vCPU, 512MB RAM)

6. **Real-time Updates**
   - Decision: Use Supabase Realtime for status updates
   - Rationale: Provides immediate updates without polling, reduces UI flashing
   - Implementation: Supabase Realtime subscription with event-specific handlers

7. **Repository Structure**
   - Decision: Convert submodule to regular directory
   - Rationale: Simplifies development workflow and repository management
   - Implementation: Single repository with all project files

8. **Separate Structured Notes Service**
   - Decision: Create a separate service for structured notes generation
   - Rationale: Separation of concerns, specialized processing for medical notes
   - Implementation: FastAPI microservice on Koyeb with OpenAI GPT-4 integration

9. **CORS Middleware for Structured Notes Service**
   - Decision: Implement CORS middleware in the structured notes service
   - Rationale: Allow cross-origin requests from the frontend
   - Implementation: FastAPI CORSMiddleware with appropriate configuration

10. **Modal Component for Structured Notes**
    - Decision: Display structured notes in a modal component
    - Rationale: Provides focused view while maintaining access to raw transcription
    - Implementation: React modal component with editing capabilities

11. **Environment Variable Handling**
    - Decision: Implement proper environment variable handling
    - Rationale: Secure sensitive information, prevent committing API keys
    - Implementation: .env.example files with placeholders, .gitignore configuration

## Design Patterns

1. **Event-Driven Architecture**
   - Storage events trigger transcription process
   - Database changes broadcast events via Realtime service
   - Asynchronous processing decouples recording from transcription

2. **Microservice Pattern**
   - Separate services for frontend, transcription, and structured notes
   - Clear API boundaries between components
   - Independent scaling and deployment

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

7. **Modal Pattern**
   - Focused UI for specific tasks (structured note editing)
   - Maintains context while providing detailed view
   - Reduces UI clutter and improves user focus

8. **Command Pattern**
   - Encapsulates operations as objects (save, copy)
   - Provides clear user actions with specific outcomes
   - Simplifies UI interaction model

## Technical Constraints

1. **Browser Audio Limitations**
   - Constraint: Browsers limit audio recording quality and format options
   - Mitigation: Use Recorder.js for highest quality available (16-bit PCM/WAV)

2. **File Size Limits**
   - Constraint: APIs have file size limits
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

6. **API Key Security**
   - Constraint: API keys must be kept secure
   - Mitigation: Use environment variables, .env.example files, proper .gitignore configuration
   - Mitigation: Remove sensitive information from git history if accidentally committed

7. **Cross-Origin Requests**
   - Constraint: Browser security prevents cross-origin requests
   - Mitigation: Implement CORS middleware in backend services
   - Mitigation: Configure appropriate CORS headers for all API endpoints
