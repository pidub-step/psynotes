# Project Brief: Medical Note Transcription App (MVP)

## Project Definition

The Medical Note Transcription App is a full-stack web application designed to help doctors efficiently record and transcribe medical notes. The application focuses on capturing high-quality audio recordings and processing transcriptions entirely on the backend, providing a streamlined experience for medical professionals.

## Core Requirements

1. **High-Quality Audio Recording**
   - Capture audio in the highest-quality format available in browsers (16-bit PCM/WAV)
   - Provide simple recording controls (start, stop)
   - Display recording timer for user awareness

2. **Backend Transcription Processing**
   - Process audio transcriptions entirely on the backend
   - Use OpenAI's GPT-4o Transcribe models for accurate medical transcription
   - Handle long recordings (up to 90 minutes) by splitting into manageable chunks

3. **Efficient Storage**
   - Store audio recordings in Supabase Storage
   - Store transcription results in Supabase PostgreSQL
   - Maintain relationship between audio files and their transcriptions

4. **Simple User Interface**
   - Clean, responsive design that works on both desktop and mobile devices
   - Intuitive controls for recording and viewing transcriptions
   - Clear status indicators for upload and transcription progress

## Target Audience

The primary users are doctors who need a straightforward tool to transcribe medical notes. The app prioritizes usability and functionality across desktop and mobile devices, with particular attention to compatibility with Safari on iOS.

## MVP Scope

### Included
- Audio recording in high-quality format
- Backend transcription using OpenAI GPT-4o Transcribe models
- Audio storage in Supabase
- Transcription display
- Basic user interface with recording controls
- Support for both desktop and mobile browsers

### Excluded
- User authentication and security features
- Patient data management
- Integration with electronic health record (EHR) systems
- Advanced editing of transcriptions
- Multi-language support (beyond what GPT-4o Transcribe models provide)

## Success Criteria

1. Audio is recorded in 16-bit PCM/WAV format
2. Transcription is processed entirely on the backend
3. Users can record, upload, and view transcriptions without barriers
4. The app functions correctly on both desktop and mobile browsers
5. The system can handle recordings up to 90 minutes in length

This project brief serves as the foundation for the Medical Note Transcription App MVP, focusing on core functionality while keeping the scope manageable.
