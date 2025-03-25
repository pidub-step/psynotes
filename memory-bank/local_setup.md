## Local Setup Instructions: Medical Note Transcription App

These instructions describe how to start the Medical Note Transcription App locally for development and testing.

### Prerequisites

1.  **Node.js and npm:** Required for the frontend.
2.  **Python and pip:** Required for the backend transcription service.
3.  **ffmpeg:** Required for audio processing in the backend.
4.  **Supabase Account:** Required for storage and database.
5.  **OpenAI Account:** Required for GPT-4o Transcribe API access.

### Starting the Application

Follow these steps to start the frontend and backend services:

#### 1. Frontend (Next.js)

1.  **Navigate to the frontend directory:**
    ```bash
    cd medical-note-transcriber
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically on `http://localhost:3000`.

#### 2. Backend (FastAPI Transcription Service)

1.  **Navigate to the backend directory:**
    ```bash
    cd medical-note-transcriber/transcription-service
    ```

2.  **Create and activate a virtual environment (if you haven't already):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate   # Or . venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the FastAPI application:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    This will start the FastAPI transcription service, typically on `http://localhost:8000`.

#### 3. Environment Variables

Ensure that the necessary environment variables are set in the following files:

*   **Frontend (`medical-note-transcriber/.env.local`):**
    ```
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

*   **Backend (`medical-note-transcriber/transcription-service/.env`):**
    ```
    OPENAI_API_KEY=your-openai-api-key
    SUPABASE_URL=your-supabase-url
    SUPABASE_SERVICE_KEY=your-supabase-service-key
    PORT=8000
    HOST=0.0.0.0
    ```

Replace `your-supabase-url`, `your-supabase-anon-key`, `your-openai-api-key`, and `your-supabase-service-key` with your actual Supabase and OpenAI credentials.

#### 4. VSCode Configuration (Important!)

If you are using VSCode, ensure that VSCode is configured to use the correct Python interpreter from the virtual environment (`venv`) for the transcription service. This is crucial for VSCode to recognize the installed dependencies and avoid "Import could not be resolved" errors.

To do this:

1.  Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
2.  Type `Python: Select Interpreter` and select the command.
3.  Choose the interpreter located inside the `medical-note-transcriber/transcription-service` directory, named `venv`: `./venv/bin/python`.

After following these steps, the Medical Note Transcription App should be running locally and accessible in your browser.
