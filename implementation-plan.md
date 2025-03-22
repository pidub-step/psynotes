### Key Points
- It seems likely that using Next.js 15 with App Router, shadcn/ui, and Recorder.js is the best method for the frontend, given its support for modern web development and audio recording.
- Research suggests Supabase Storage and PostgreSQL, along with Edge Functions, are ideal for storing audio and managing transcription workflows, offering scalability and integration.
- The evidence leans toward using OpenAI's Whisper API for transcription, handled by a Python FastAPI microservice, especially for splitting long audios exceeding 25MB.
- It appears deploying on Vercel for the frontend and a separate platform like Heroku for FastAPI ensures scalability, though the transcription service setup may require additional configuration.

### Frontend Development
The frontend should be built using **Next.js 15 with App Router** for its server-side rendering capabilities, ensuring a responsive experience. Integrate **shadcn/ui** for a modern, dark-mode-ready component library to enhance usability. For audio recording, **Recorder.js** is recommended, supporting 16-bit PCM/WAV format, the highest quality in browsers, with clear controls for start, stop, and timing.

### Audio Storage and Transcription Workflow
Store audio files in **Supabase Storage**, using the JS client for uploads, which integrates seamlessly with Next.js. Set up a Database Webhook on the `storage.objects` table for INSERT events to trigger a Supabase Edge Function, which then calls a **Python FastAPI microservice** for transcription. This microservice uses OpenAI's Whisper API, handling long audios by splitting them into chunks if over 25MB, and stores results in Supabase PostgreSQL.

### Deployment Strategy
Deploy the Next.js frontend on **Vercel** for easy scaling and hosting, leveraging its serverless capabilities. The FastAPI transcription microservice should be deployed on a platform like Heroku, ensuring it can handle longer processing times for transcription tasks.

---

### Comprehensive Implementation Guide for Medical Note Transcription App

This guide provides a detailed, step-by-step approach to implementing the Medical Note Transcription App (MVP) as outlined in the Product Requirement Document (PRD), leveraging the specified tech stack and official documentation from OpenAI, Supabase, and Vercel. The app aims to record high-quality audio, store it securely, transcribe it on the backend, and display the transcription, focusing on scalability and usability, particularly for mobile devices like Safari on iOS.

#### 1. Frontend Setup and Audio Recording

The frontend is built using **Next.js 15 with App Router**, chosen for its modern server-side rendering and routing capabilities, ensuring a responsive experience across devices. To set up, initialize a new project with `npx create-next-app@latest --use-npm my-app` and structure pages under the `app` directory for the App Router.

For UI components, integrate **shadcn/ui**, a modern component library with built-in dark mode support, enhancing user experience. Install it via `npm install shadcn/ui` and use its components for buttons, modals, and forms to create a clean interface for recording, uploading, and displaying transcriptions.

Audio recording is handled by **Recorder.js**, which supports capturing audio in 16-bit PCM/WAV format, the highest quality available in browsers. Install it with `npm install recorder-js`. Implement recording functionality with start, stop, and pause controls, displaying a real-time timer for user awareness. Example code for recording:

```javascript
import Recorder from 'recorder-js';

const recordAudio = () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new Recorder(stream);
  recorder.record();
  // Stop after 90 minutes (5400 seconds)
  setTimeout(() => recorder.stop(), 5400 * 1000);
  return recorder;
};
```

Ensure compatibility with Safari on iOS by handling microphone permissions appropriately.

#### 2. Audio Storage in Supabase

After recording, upload the WAV file to **Supabase Storage** using the Supabase JS client, which integrates well with Next.js. First, create a bucket (e.g., `medical-notes`) in Supabase Storage for organizing audio files. Upload files with metadata for tracking, such as timestamps or user IDs.

Example code for uploading:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('your-supabase-url', 'your-supabase-key');

const uploadAudio = async (file) => {
  const { data, error } = await supabase.storage.from('medical-notes').upload(`audio-${Date.now()}.wav`, file);
  if (error) throw error;
  return data;
};
```

Refer to the Supabase Storage quickstart guide for detailed steps: [Storage Quickstart](https://supabase.com/docs/guides/storage/quickstart).

#### 3. Triggering Transcription with Supabase Edge Functions

To automate transcription, set up a **Database Webhook** on the `storage.objects` table for INSERT events, triggered when a new audio file is uploaded. This webhook calls a Supabase Edge Function, which is distributed globally for low latency.

Configure the webhook via the Supabase Dashboard at [Supabase Dashboard](https://supabase.com/dashboard/project/_/integrations/hooks) or using SQL:

```sql
INSERT INTO database_webhooks (id, name, target_url, table_name, event_type)
VALUES ('transcription-webhook', 'Transcription Trigger', 'https://your-edge-function-url', 'storage.objects', 'INSERT');
```

The Edge Function, written in TypeScript with Deno, receives the event data, including the file path or ID. It then calls the transcription microservice, passing the file URL. Example Edge Function:

```typescript
export default async function (req: Request) {
  const { data } = await req.json();
  const fileUrl = data.new.path;
  const response = await fetch('https://your-fastapi-service.com/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileUrl }),
  });
  return new Response('Transcription triggered', { status: 200 });
}
```

For development, use `supabase functions serve --env-file ./.env` to run locally, as detailed in [Developing Edge Functions Locally](https://supabase.com/docs/guides/functions/quickstart).

#### 4. Transcription Microservice with FastAPI and OpenAI Whisper API

The transcription process is handled by a **Python FastAPI** microservice, deployed separately for flexibility in handling longer tasks. This service receives the file URL from the Edge Function, downloads the audio from Supabase Storage, and processes it for transcription.

Given the OpenAI Whisper API has a 25MB file size limit, handle large files (e.g., 90-minute recordings) by splitting them into chunks. Use `pydub` for audio splitting, installing it via `pip install pydub`. Example service implementation:

```python
from fastapi import FastAPI
import requests
from pydub import AudioSegment
import os

app = FastAPI()

@app.post("/transcribe")
async def transcribe(file_url: str):
    response = requests.get(file_url)
    audio_data = response.content

    # Split if larger than 25MB
    if len(audio_data) > 25 * 1024 * 1024:
        audio = AudioSegment.from_file(io.BytesIO(audio_data))
        chunks = [audio[i:i+600000] for i in range(0, len(audio), 600000)]  # 10-minute chunks
    else:
        chunks = [audio_data]

    transcriptions = []
    for chunk in chunks:
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"},
            files={"file": chunk},
            data={"model": "whisper-1", "language": "fr-CA"}
        )
        transcriptions.append(response.json()["text"])

    full_transcription = " ".join(transcriptions)

    # Store in Supabase (implementation depends on client setup)
    return {"transcription": full_transcription}
```

For OpenAI Whisper API usage, refer to [Whisper API Documentation](https://platform.openai.com/docs/api-reference/audio/createTranscription). Ensure the API key is stored securely as an environment variable.

#### 5. Storing and Retrieving Transcription

Store transcriptions in **Supabase PostgreSQL** for persistence and retrieval. Create a table for transcriptions:

```sql
CREATE TABLE transcriptions (
  id SERIAL PRIMARY KEY,
  file_id TEXT UNIQUE,
  transcription_text TEXT,
  status TEXT DEFAULT 'processing'
);
```

After transcription, insert the result into this table, updating the status to "completed". The frontend can then query this table to retrieve transcriptions.

#### 6. Displaying Transcription on Frontend

The frontend can poll the `transcriptions` table every few seconds to check for completion or use Supabase Realtime for real-time updates. Example polling code:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase.from('transcriptions').select('*').eq('file_id', 'your-file-id');
    if (data.length > 0 && data[0].status === 'completed') {
      setTranscription(data[0].transcription_text);
    }
  }, 5000); // Poll every 5 seconds
  return () => clearInterval(interval);
}, []);
```

For Realtime, refer to [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime).

#### 7. Deployment Strategy

- **Frontend on Vercel**: Deploy the Next.js application on Vercel for scalability and ease of use. Use the Vercel CLI with `vercel --prod`. Refer to [Vercel Deployment Documentation](https://vercel.com/docs/deployment).

- **Supabase**: Leverage Supabase for storage, database, and edge functions, which are managed services requiring no separate deployment.

- **FastAPI Service**: Deploy the FastAPI transcription microservice on a platform like Heroku, Railway, or Fly.io, which support Python. Example deployment on Heroku involves creating a `Procfile` with `web: uvicorn main:app --host 0.0.0.0 --port $PORT` and pushing to the Heroku repository.

#### 8. Considerations for Long Audios and Scalability

Given 90-minute recordings may exceed 25MB, splitting audio in the FastAPI service is crucial. This approach ensures compliance with OpenAI Whisper API limits, as detailed in [Whisper API FAQ](https://help.openai.com/en/articles/7031512-whisper-api-faq). For scalability, consider queue management with BullMQ for Node.js, though for the MVP, sequential processing may suffice given low expected traffic.

#### Tables for Reference

| **Component**          | **Technology**            | **Key Method**                                      | **Documentation Reference**                              |
|-------------------------|---------------------------|----------------------------------------------------|---------------------------------------------------------|
| Frontend               | Next.js 15, shadcn/ui     | App Router, component library                     | [Next.js Documentation](https://nextjs.org/docs)         |
| Audio Recording        | Recorder.js               | 16-bit PCM/WAV recording                          | [Recorder.js GitHub](https://github.com/mattdiamond/Recorderjs) |
| Storage                | Supabase Storage          | File upload via JS client                         | [Storage Quickstart](https://supabase.com/docs/guides/storage/quickstart) |
| Database               | Supabase PostgreSQL       | Store transcriptions                              | [Supabase Database Docs](https://supabase.com/docs/guides/database) |
| Edge Functions         | Supabase Edge Functions   | Trigger on storage events                         | [Edge Functions Guide](https://supabase.com/docs/guides/functions) |
| Transcription Service  | Python FastAPI, OpenAI    | Split and transcribe audio                        | [Whisper API Docs](https://platform.openai.com/docs/api-reference/audio/createTranscription) |
| Deployment             | Vercel, Heroku            | Frontend on Vercel, FastAPI on Heroku             | [Vercel Deployment](https://vercel.com/docs/deployment), [Heroku Docs](https://devcenter.heroku.com/) |

---

### Key Citations
- [Storage Quickstart Supabase Docs](https://supabase.com/docs/guides/storage/quickstart)
- [Developing Edge Functions Locally Supabase Docs](https://supabase.com/docs/guides/functions/quickstart)
- [Whisper API Documentation OpenAI Platform](https://platform.openai.com/docs/api-reference/audio/createTranscription)
- [Whisper API FAQ OpenAI Help Center](https://help.openai.com/en/articles/7031512-whisper-api-faq)
- [Supabase Dashboard for Webhooks](https://supabase.com/dashboard/project/_/integrations/hooks)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployment)
- [Next.js Official Documentation](https://nextjs.org/docs)