# Medical Note Transcription App

A web application for recording, transcribing, and managing medical notes using OpenAI's GPT-4o Transcribe API.

## Features

- Record high-quality audio notes directly in the browser
- Upload recordings to secure cloud storage
- Automatic transcription using OpenAI's GPT-4o Transcribe API
- View and manage transcriptions
- Mobile-friendly responsive design

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Storage, Database), FastAPI (Transcription Service)
- **APIs**: OpenAI GPT-4o Transcribe API for high-accuracy transcription
- **Audio**: Recorder.js for high-quality WAV recording

## Project Structure

```
medical-note-transcriber/
├── src/                      # Next.js frontend application
│   ├── app/                  # App router pages and API routes
│   │   ├── api/              # API routes
│   │   │   └── transcribe/   # Transcription API endpoint
│   │   ├── record/           # Recording page
│   │   └── transcriptions/   # Transcriptions list page
│   ├── lib/                  # Shared libraries
│   │   └── supabase.ts       # Supabase client
│   └── types/                # TypeScript type definitions
├── transcription-service/    # FastAPI transcription service
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
└── scripts/                  # Utility scripts
    └── setup-supabase.js     # Script to set up Supabase resources
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- ffmpeg (required for audio processing)
- Supabase account
- OpenAI API key

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd medical-note-transcriber
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

Edit `.env.local` to add your Supabase and OpenAI credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. Supabase Setup

Run the setup script to create the necessary Supabase resources:

```bash
cd scripts
npm install
npm run setup-supabase
```

Alternatively, you can manually create:
- A storage bucket named `medical-notes`
- A table named `transcriptions` with the following schema:
  ```sql
  CREATE TABLE transcriptions (
    id SERIAL PRIMARY KEY,
    file_id TEXT UNIQUE,
    transcription_text TEXT,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

### 4. Transcription Service Setup

#### Install ffmpeg

ffmpeg is required for audio processing in the transcription service.

**macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) or install with Chocolatey:
```bash
choco install ffmpeg
```

#### Set up the Python environment

```bash
cd transcription-service

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit the `.env` file to add your OpenAI API key.

### 5. Running the Application

#### Start the Next.js frontend

```bash
npm run dev
```

#### Start the transcription service

```bash
cd transcription-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

The application will be available at http://localhost:3000

## Usage

1. Navigate to the home page
2. Click "Start Recording" to record a new medical note
3. Record your note and click "Stop Recording" when finished
4. Review the recording and click "Upload" to save and transcribe
5. View your transcriptions on the "Transcriptions" page

## Deployment

### Frontend Deployment (Vercel)

The Next.js frontend can be deployed to Vercel:

```bash
npm install -g vercel
vercel
```

### Transcription Service Deployment (Heroku)

The FastAPI transcription service can be deployed to Heroku:

```bash
# Install Heroku CLI
heroku create medical-note-transcriber-service
git subtree push --prefix transcription-service heroku main
```

Remember to set the environment variables in your deployment platforms.

## License

MIT
