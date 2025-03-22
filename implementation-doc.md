### Key Points
- It seems likely that using Next.js 15 with App Router, shadcn/ui, and Recorder.js is the best method for the frontend, given its support for modern web development and audio recording.
- Research suggests Supabase Storage and PostgreSQL, along with Edge Functions, are ideal for storing audio and managing transcription workflows, offering scalability and integration.
- The evidence leans toward using OpenAI's Whisper API for transcription, handled by a Python FastAPI microservice, especially for splitting long audios exceeding 25MB.
- It appears deploying on Vercel for the frontend and a separate platform like Heroku for FastAPI ensures scalability, though the transcription service setup may require additional configuration.

### Frontend Setup
The frontend should be built using **Next.js 15 with App Router** for its server-side rendering capabilities, ensuring a responsive experience. Integrate **shadcn/ui** for a modern, dark-mode-ready component library to enhance usability. For audio recording, **Recorder.js** is recommended, supporting 16-bit PCM/WAV format, the highest quality in browsers, with clear controls for start, stop, and timing.

### Audio Storage and Transcription
Store audio files in **Supabase Storage** ([Storage Quickstart Supabase Docs](https://supabase.com/docs/guides/storage/quickstart)), using the JS client for uploads, which integrates seamlessly with Next.js. Set up a Database Webhook on the `storage.objects` table for INSERT events to trigger a Supabase Edge Function, which then calls a **Python FastAPI microservice** for transcription. This microservice uses OpenAI's Whisper API ([Whisper API Documentation OpenAI Platform](https://platform.openai.com/docs/api-reference/audio/createTranscription)), handling long audios by splitting them into chunks if over 25MB, and stores results in Supabase PostgreSQL.

### Deployment Strategy
Deploy the Next.js frontend on **Vercel** ([Vercel Deployment Documentation](https://vercel.com/docs/deployment)) for easy scaling and hosting, leveraging its serverless capabilities. The FastAPI transcription microservice should be deployed on a platform like Heroku, ensuring it can handle longer processing times for transcription tasks.

---

### Comprehensive Implementation Guide for Medical Note Transcription App (MVP)

This guide provides a detailed, step-by-step approach to implementing the Medical Note Transcription App (MVP) as outlined in the Product Requirement Document (PRD), leveraging the specified tech stack and official documentation from OpenAI, Supabase, and Vercel. The app aims to record high-quality audio, store it securely, transcribe it on the backend, and display the transcription, focusing on scalability and usability, particularly for mobile devices like Safari on iOS. Each step includes clear, concrete instructions and a validation test to ensure correct implementation, designed for AI developers familiar with the technologies involved.

#### 1. Set Up the Development Environment

The initial setup ensures all necessary tools and dependencies are installed, creating a foundation for development.

- **1.1 Install Node.js and npm**: Ensure Node.js is installed (version compatible with Next.js 15, e.g., Node.js 18 or later, as of March 22, 2025). Install npm if not already present.  
  - **Validation**: Run `node -v` and `npm -v` in the terminal to confirm the versions are correct, ensuring compatibility with modern web development standards.

- **1.2 Install Python and pip**: Ensure Python is installed (version compatible with FastAPI, e.g., Python 3.8 or later). Install pip if not already present.  
  - **Validation**: Run `python --version` and `pip --version` to confirm the versions, ensuring the environment supports FastAPI and related libraries.

- **1.3 Set Up Supabase Account**: Create a new project on the Supabase platform ([Supabase Dashboard for Webhooks](https://supabase.com/dashboard/project/_/integrations/hooks)). Note down the Supabase URL and API key from the dashboard for later use.  
  - **Validation**: Log in to the Supabase dashboard and verify that the project is created, with the URL and API key accessible, ensuring integration readiness.

- **1.4 Set Up OpenAI Account**: Create an account on the OpenAI platform ([Whisper API FAQ OpenAI Help Center](https://help.openai.com/en/articles/7031512-whisper-api-faq)). Obtain an API key for the Whisper API, essential for transcription services.  
  - **Validation**: Log in to the OpenAI dashboard and confirm that you can access and copy the API key, ensuring transcription capabilities are enabled.

- **1.5 Install Global Tools**: Install `create-next-app` for initializing Next.js projects: `npm install -g create-next-app`. Optionally, install the Supabase CLI for managing Supabase resources: `npm install -g supabase`, though not strictly necessary for this MVP.  
  - **Validation**: Run `create-next-app --version` (and `supabase --version` if installed) to confirm the tools are installed, ensuring project initialization is streamlined.

#### 2. Frontend Development

The frontend focuses on building a responsive interface for recording and uploading audio, using modern frameworks and libraries.

- **2.1 Initialize Next.js Project**: Run `npx create-next-app@latest medical-note-transcriber --use-npm` to create a new Next.js project. Navigate to the project directory: `cd medical-note-transcriber`.  
  - **Validation**: Check that the project structure is created correctly, including the `app` directory for App Router, ensuring the foundation for server-side rendering is in place ([Next.js Official Documentation](https://nextjs.org/docs)).

- **2.2 Install Dependencies**: Install required packages: `npm install shadcn/ui` for UI components, `npm install recorder-js` for audio recording, and `npm install @supabase/supabase-js` for Supabase client integration.  
  - **Validation**: Open `package.json` and verify that the packages are listed under dependencies, ensuring all necessary libraries are available for development.

- **2.3 Set Up Supabase Client**: Create a file `lib/supabase.js` in the project root. Add the configuration with the Supabase URL and API key (replace placeholders with actual values from Step 1.3).  
  - **Validation**: Ensure the file is created and contains the correct Supabase URL and key, ensuring connectivity for storage and database operations.

- **2.4 Implement Audio Recording**: Create a new page, e.g., `app/record/page.js`, for recording functionality. Use Recorder.js to handle audio recording in 16-bit PCM/WAV format, the highest quality in browsers. Add UI elements (e.g., buttons) for starting, stopping, and uploading recordings, and display a real-time timer.  
  - **Validation**: Test recording by starting and stopping the recorder; ensure audio is captured and can be previewed, ensuring functionality for users.

- **2.5 Implement Audio Upload**: After stopping the recording, convert the recorded audio to a file or blob. Use the Supabase client to upload the file to Supabase Storage (bucket `medical-notes`, to be created in Step 3.1).  
  - **Validation**: After uploading, check the Supabase Storage bucket (e.g., via dashboard) to confirm the file is present, ensuring storage integration works.

#### 3. Audio Storage

Storage setup ensures audio files are securely stored and accessible for transcription.

- **3.1 Create Supabase Storage Bucket**: In the Supabase dashboard, navigate to Storage > Buckets > Create a new bucket. Name it `medical-notes` and set access permissions as needed (for MVP, keep it private to align with future security needs, though not enforced yet).  
  - **Validation**: Verify the bucket is created in the Supabase dashboard, ensuring a dedicated space for audio files ([Storage Quickstart Supabase Docs](https://supabase.com/docs/guides/storage/quickstart)).

#### 4. Set Up Supabase Edge Function

Edge Functions automate the transcription process by triggering on audio uploads, ensuring backend processing.

- **4.1 Create Edge Function**: In the Supabase dashboard, go to Functions > Create a new function. Name it, e.g., `transcription-trigger`. Configure it to trigger on storage events (specifically, when a new file is uploaded to the `medical-notes` bucket). The function should call the FastAPI transcription service with the uploaded file's URL (URL to be set in Step 8.3 after deployment).  
  - **Validation**: Ensure the function is created and deployed successfully in the dashboard, ensuring automation readiness ([Developing Edge Functions Locally Supabase Docs](https://supabase.com/docs/guides/functions/quickstart)).

- **4.2 Configure Storage Webhook**: In the Supabase dashboard, go to Settings > Webhooks > Database Webhooks. Create a new webhook for the `storage.objects` table with event type `INSERT`. Set the target URL to the Edge Function's URL (e.g., `https://your-supabase-project/functions/v1/transcription-trigger`, to be updated in Step 8.3).  
  - **Validation**: Test by uploading a file to Supabase Storage and checking if the Edge Function is triggered (can be verified via Supabase logs), ensuring the workflow is connected ([Supabase Dashboard for Webhooks](https://supabase.com/dashboard/project/_/integrations/hooks)).

#### 5. Transcription Microservice

The transcription service handles audio processing using OpenAI's Whisper API, crucial for converting audio to text.

- **5.1 Set Up FastAPI Project**: Create a new directory for the transcription service, e.g., `transcription-service`. Initialize a Python virtual environment: `python -m venv venv`. Activate it and install FastAPI: `pip install fastapi uvicorn`. Install additional dependencies: `pip install openai pydub requests` for audio handling and API calls.  
  - **Validation**: Run `uvicorn --version` to confirm FastAPI is installed, ensuring the service can run locally.

- **5.2 Implement Transcription Endpoint**: Create a file `main.py` in the `transcription-service` directory. Define a POST endpoint `/transcribe` that accepts a JSON body with the audio file URL. The endpoint should download the audio file from Supabase Storage, split it into chunks if over 25MB using `pydub`, transcribe each chunk using the OpenAI Whisper API, combine the transcriptions, and return the full text. Use environment variables for the OpenAI API key.  
  - **Validation**: Use a tool like Postman to send a POST request to the endpoint with a sample audio URL (e.g., a small WAV file); verify that it returns a transcription, ensuring functionality ([Whisper API Documentation OpenAI Platform](https://platform.openai.com/docs/api-reference/audio/createTranscription)).

- **5.3 Handle Long Audio Files**: Ensure the endpoint can handle long audio files (e.g., 90 minutes) by splitting them into manageable chunks (e.g., 10-minute segments) before transcription, using `pydub`.  
  - **Validation**: Test with a long audio file (>25MB) to ensure it is split, transcribed, and combined correctly, ensuring scalability for extended recordings ([Whisper API FAQ OpenAI Help Center](https://help.openai.com/en/articles/7031512-whisper-api-faq)).

#### 6. Store and Retrieve Transcriptions

Storing transcriptions ensures persistence and accessibility for display.

- **6.1 Set Up Supabase Database Table**: In the Supabase dashboard, go to SQL Editor. Run the following SQL to create a table for transcriptions:
  ```sql
  CREATE TABLE transcriptions (
    id SERIAL PRIMARY KEY,
    file_id TEXT UNIQUE,
    transcription_text TEXT,
    status TEXT DEFAULT 'processing'
  );
  ```
  - **Validation**: Query the table in the SQL Editor to confirm it is created, ensuring database readiness ([Supabase Database Docs](https://supabase.com/docs/guides/database)).

- **6.2 Update Transcription in FastAPI**: After transcribing the audio, use the Supabase Python client (`supabase-py`, installed in Step 5.1) to insert the transcription into the `transcriptions` table. Update the `status` to `'completed'` once done.  
  - **Validation**: After processing a test audio, check the `transcriptions` table in Supabase to confirm a new record is added with `status` set to `'completed'`, ensuring data persistence.

#### 7. Display Transcription on Frontend

Displaying transcriptions completes the user experience, ensuring visibility of results.

- **7.1 Implement Polling for Transcription Status**: In the frontend (e.g., `app/record/page.js`), after uploading the audio, retrieve the file ID from the upload response. Periodically query the `transcriptions` table using the Supabase client (e.g., every 5 seconds) to check for `status` `'completed'`. When completed, display the `transcription_text` on the page.  
  - **Validation**: After uploading a test audio, wait for transcription to complete and verify that the transcription is displayed on the page, ensuring user feedback ([Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)).

#### 8. Deployment

Deployment ensures the app is accessible and scalable, with separate handling for frontend and backend services.

- **8.1 Deploy Frontend on Vercel**: Sign up for Vercel ([Vercel Deployment Documentation](https://vercel.com/docs/deployment)) if not already. Connect your GitHub repository or deploy directly from local, following Vercel's guide for Next.js.  
  - **Validation**: Access the deployed URL (e.g., `https://your-app.vercel.app`) and ensure the app loads correctly, ensuring public accessibility.

- **8.2 Deploy FastAPI on Heroku**: Sign up for Heroku ([Heroku Docs](https://devcenter.heroku.com/)) if not already. Create a new app and set up a Procfile with `web: uvicorn main:app --host 0.0.0.0 --port $PORT`. Push your code to Heroku and set environment variables for `OPENAI_API_KEY` and Supabase credentials.  
  - **Validation**: Check Heroku logs for successful deployment and test the `/transcribe` endpoint with Postman, ensuring the service is live and functional.

- **8.3 Update Edge Function with FastAPI URL**: After deploying FastAPI, update the Edge Function code to use the deployed FastAPI service URL (e.g., `https://your-heroku-app.herokuapp.com/transcribe`). Redeploy the Edge Function.  
  - **Validation**: Test by uploading a file through the app; confirm that transcription is triggered and completed, ensuring end-to-end workflow.

#### 9. Test on Mobile Safari

Testing on mobile ensures compatibility, particularly for the target audience using iOS devices.

- **9.1 Test Recording on iOS Safari**: Open the deployed app on an iPhone or iPad using Safari. Attempt to record audio and verify that microphone permissions are requested correctly.  
  - **Validation**: Confirm that recording starts and stops as expected, and audio is uploaded successfully, ensuring mobile usability.

- **9.2 Test Transcription Flow on Mobile**: After uploading from mobile, check if the transcription is processed and displayed correctly. Ensure the UI is responsive and functional on smaller screens.  
  - **Validation**: Verify that the transcription appears on the mobile device after processing, ensuring a seamless user experience.

#### Tables for Reference

| **Component**          | **Technology**            | **Key Method**                                      | **Documentation Reference**                              |
|-------------------------|---------------------------|----------------------------------------------------|---------------------------------------------------------|
| Frontend               | Next.js 15, shadcn/ui     | App Router, component library                     | [Next.js Official Documentation](https://nextjs.org/docs)         |
| Audio Recording        | Recorder.js               | 16-bit PCM/WAV recording                          | [Recorder.js GitHub](https://github.com/mattdiamond/Recorderjs) |
| Storage                | Supabase Storage          | File upload via JS client                         | [Storage Quickstart Supabase Docs](https://supabase.com/docs/guides/storage/quickstart) |
| Database               | Supabase PostgreSQL       | Store transcriptions                              | [Supabase Database Docs](https://supabase.com/docs/guides/database) |
| Edge Functions         | Supabase Edge Functions   | Trigger on storage events                         | [Developing Edge Functions Locally Supabase Docs](https://supabase.com/docs/guides/functions/quickstart) |
| Transcription Service  | Python FastAPI, OpenAI    | Split and transcribe audio                        | [Whisper API Documentation OpenAI Platform](https://platform.openai.com/docs/api-reference/audio/createTranscription) |
| Deployment             | Vercel, Heroku            | Frontend on Vercel, FastAPI on Heroku             | [Vercel Deployment Documentation](https://vercel.com/docs/deployment), [Heroku Docs](https://devcenter.heroku.com/) |

#### Key Citations
- [Storage Quickstart Supabase Docs](https://supabase.com/docs/guides/storage/quickstart)
- [Developing Edge Functions Locally Supabase Docs](https://supabase.com/docs/guides/functions/quickstart)
- [Whisper API Documentation OpenAI Platform](https://platform.openai.com/docs/api-reference/audio/createTranscription)
- [Whisper API FAQ OpenAI Help Center](https://help.openai.com/en/articles/7031512-whisper-api-faq)
- [Supabase Dashboard for Webhooks](https://supabase.com/dashboard/project/_/integrations/hooks)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployment)
- [Heroku Docs](https://devcenter.heroku.com/)
- [Next.js Official Documentation](https://nextjs.org/docs)