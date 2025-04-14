# Implementation Plan: Structured Medical Note Formatting Feature

This implementation plan provides step-by-step instructions for AI developers to add the Structured Medical Note Formatting feature to the Medical Note Transcription App. The feature generates structured notes from transcribed audio using OpenAI's GPT model, stores them in Supabase, and provides a user interface for viewing, editing, and copying the structured notes. The plan leverages the existing tech stack—Next.js 15 (App Router) on Vercel, FastAPI on Koyeb, Supabase PostgreSQL with Realtime, and OpenAI GPT-4—and ensures the system can handle very long notes. Each step is small, specific, and includes a test to validate correct implementation.

---

## Step 1: Add a New Column to the Supabase Database

**Instructions:**
1. Log into the Supabase dashboard using your credentials.
2. Navigate to your project and select the "transcriptions" table from the list of tables.
3. Click the "Add Column" button in the table editor.
4. Enter "structured_note" as the column name and select "text" as the data type.
5. Click "Save" to apply the changes to the table.

**Test:**
- Open the "transcriptions" table in the Supabase dashboard and confirm the "structured_note" column is listed.
- Manually insert a test row with sample data (e.g., a short transcription and a placeholder structured note like "Test note").
- Retrieve the test row and verify the "structured_note" field contains the text you entered.

---

## Step 2: Extend the FastAPI Service to Generate Structured Notes

**Instructions:**
1. Open the FastAPI project directory on your development machine.
2. Ensure the `openai` and `supabase` Python packages are installed in your environment (e.g., check requirements.txt or install manually).
3. Add a new endpoint `/structure-note/{transcription_id}` to the main FastAPI application file.
4. Configure the endpoint to:
   - Accept `transcription_id` as a URL parameter.
   - Use the Supabase Python client to query the "transcriptions" table and fetch the `transcription` field for the given `transcription_id`.
   - Create a prompt for the OpenAI API that includes the transcription text and specific formatting instructions (e.g., convert "hypertension" to "HTA", handle "normal" physical exams).
   - Call the OpenAI API asynchronously to generate the structured note using the prompt.
   - Update the "structured_note" field in the "transcriptions" table with the API response using the Supabase client.
5. Add basic error handling (e.g., log errors if the transcription isn’t found or the API fails, and store an error message in "structured_note").

**Test:**
- Start the FastAPI service locally and send a test request to `/structure-note/{transcription_id}` using a tool like Postman or curl, with a valid `transcription_id`.
- Check the Supabase "transcriptions" table and confirm the "structured_note" field for that `transcription_id` is updated with a properly formatted note.
- Review the FastAPI logs to ensure no errors occurred during the process.

---

## Step 3: Create a Supabase Edge Function to Trigger Structuring

**Instructions:**
1. In the Supabase dashboard, go to the "Functions" section under your project.
2. Click "New Function" to create a new Edge Function.
3. Name the function (e.g., "trigger-structure-note") and configure it to trigger on `INSERT` events in the "transcriptions" table.
4. Set up the function to:
   - Extract the `id` from the newly inserted transcription row.
   - Send an HTTP POST request to the FastAPI `/structure-note/{transcription_id}` endpoint, replacing `{transcription_id}` with the extracted `id`.
5. Deploy the Edge Function and ensure it’s active.

**Test:**
- Manually insert a new row into the "transcriptions" table with a sample transcription text (e.g., via the Supabase dashboard or app).
- Check the Supabase Function logs to confirm the Edge Function was triggered.
- Verify that the FastAPI endpoint was called and the "structured_note" field in the "transcriptions" table is updated with the structured note.

---

## Step 4: Modify the Next.js Frontend to Display and Interact with Structured Notes

**Instructions:**
1. Open the Next.js project directory and locate the transcriptions page component (e.g., `pages/transcriptions.tsx` or `app/transcriptions/page.tsx`).
2. For each transcription in the list, add a "View Structured Note" button next to it.
3. Set the button’s `onClick` action to open a new window with the URL `/structured-note/[id]`, where `[id]` is the transcription’s ID.
4. Create a new page at `pages/structured-note/[id].tsx` (or `app/structured-note/[id]/page.tsx` if using App Router).
5. In the new page:
   - Extract the `transcription_id` from the URL using Next.js dynamic routing.
   - Use the Supabase JavaScript client to query the "transcriptions" table and fetch the `structured_note` for the `transcription_id`.
   - Display the structured note in an editable textarea element.
   - Add a "Save" button that updates the `structured_note` field in Supabase with the edited text when clicked.
   - Add a "Copy" button that copies the structured note to the clipboard using the browser’s Clipboard API.
   - Set up a Supabase Realtime subscription to listen for updates to the `structured_note` field and refresh the textarea when changes occur.
6. Style the new window to be responsive and user-friendly (e.g., ensure the textarea and buttons are readable on mobile).

**Test:**
- Run the Next.js app locally and upload a new transcription via the app.
- Confirm the "View Structured Note" button appears next to the transcription on the transcriptions page.
- Click the button and verify a new window opens with the structured note in an editable textarea.
- Edit the note, click "Save," and check the Supabase "transcriptions" table to ensure the `structured_note` field reflects the changes.
- Click "Copy," paste the text elsewhere (e.g., a text editor), and confirm it matches the structured note.
- Open the same structured note in another window, edit it, and verify the changes appear in real-time in the first window.

---

## Step 5: Deploy Updated Services

**Instructions:**
1. In the FastAPI project, prepare it for deployment:
   - Commit all changes and push them to your repository.
   - Deploy to Koyeb using your usual deployment process.
   - Set environment variables in the deployment settings for `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY`.
2. In the Next.js project:
   - Commit all changes and push them to your repository.
   - Deploy to Vercel using the Vercel dashboard or CLI.
   - Set environment variables in Vercel for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Verify the deployed URLs for both services are accessible.

**Test:**
- Visit the deployed Next.js app URL in a browser.
- Record a new audio note, wait for transcription and structuring, and click "View Structured Note."
- Ensure the new window opens with the structured note, and test editing and saving changes.
- Confirm all functionality works across different devices and browsers (e.g., Chrome on desktop, Safari on iOS).

---

## Step 6: Optimize for Large Transcriptions

**Instructions:**
1. In the FastAPI service, adjust the `/structure-note/{transcription_id}` endpoint to handle large transcriptions:
   - Check the length of the transcription text and, if it exceeds a threshold (e.g., 10,000 characters), split it into smaller chunks.
   - Process each chunk with the OpenAI API separately or adjust the prompt to fit within token limits.
   - Combine the results into a single structured note and update Supabase.
2. Monitor performance on the deployed FastAPI service:
   - Review logs for response times with large inputs.
   - Increase resources (e.g., upgrade Koyeb instance size) if processing takes too long.

**Test:**
- Create a very long transcription (e.g., simulate a 90-minute recording) and insert it into the "transcriptions" table.
- Trigger the structuring process and verify it completes without errors in under 5 minutes.
- Check the Supabase "transcriptions" table to ensure the "structured_note" field contains a complete, correctly formatted note.
- Review FastAPI logs for any performance issues or timeouts.

---

## Additional Notes
- **Error Handling:** Ensure each component (FastAPI, Edge Function, Next.js) logs errors and provides user feedback (e.g., "Processing failed" in the UI) if something goes wrong.
- **Security:** Double-check that API keys and credentials are stored securely in environment variables and not exposed in client-side code or repositories.
- **User Experience:** Add loading indicators in the Next.js app while the structured note is being generated or saved, especially for long notes.

This plan ensures a robust, user-friendly implementation of the Structured Medical Note Formatting feature, with validation at every step to confirm correctness.
