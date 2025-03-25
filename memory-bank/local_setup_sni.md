## Local Setup Instructions: Structured Note Generation Service

These instructions describe how to set up and run the Structured Note Generation Service locally.

### Prerequisites

1.  **Python and pip:** Required for the FastAPI application.
2.  **OpenAI Account:** Required for GPT-4o Transcribe API access.
3.  **Supabase Account:** Required for database access.

### Setup

1.  **Create a project directory:**
    ```bash
    mkdir structured-notes-service
    cd structured-notes-service
    ```

2.  **Create main.py:**
    ```python
    import os
    import sys
    import tempfile
    import subprocess
    import math
    from pathlib import Path
    from typing import Optional, List
    from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, Form
    from pydantic import BaseModel
    from dotenv import load_dotenv
    import openai
    import requests
    import json
    from supabase import create_client

    # Load environment variables
    load_dotenv()

    # Initialize OpenAI client
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")

    openai_client = openai.OpenAI(api_key=openai_api_key)

    # Initialize Supabase client
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_service_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")

    supabase = create_client(supabase_url, supabase_service_key)

    # Initialize FastAPI app
    app = FastAPI(
        title="Structured Note Generation Service",
        description="A service for generating structured medical notes using OpenAI's GPT models",
        version="1.0.0",
    )

    class StructureNoteRequest(BaseModel):
        transcription_text: str

    class StructureNoteResponse(BaseModel):
        structured_note: str

    async def generate_structured_note(transcription_text: str) -> str:
        """Generates structured note using OpenAI API."""
        prompt = f"""
        You are a medical assistant tasked with structuring a doctor's note into a specific format. Given the following transcribed note:

        {transcription_text}

        Output the structured note in this exact format:

        Note d’urgence :

        Patient : [sexe, âge]

        Motif : [motif principal de consultation]

        Antécédents médicaux :

        [liste des antécédents médicaux]

        Allergies : [allergies connues, utiliser "Pas d'allergies connues" si aucune]

        Médication actuelle :

        [liste des médicaments actuels]

        Histoire actuelle :

        [description détaillée du problème actuel]

        Examen physique :

        [résultats de l'examen physique - si 'normal' est mentionné, utiliser le format standard]

        Impression clinique :

        [diagnostics probables]

        Plan :

        [examens et traitements prévus]

        Important instructions:
        - If the physical exam is mentioned as 'normal', use exactly this text for Examen physique: 'Examen cardiovasculaire normal\nExamen respiratoire normal\nPas de signes cliniques alarmants'
        - In the Antécédents médicaux section, transform 'hypertension' to 'HTA'.
        - Use "Pas d'allergies connues" for Allergies if no allergies are mentioned, instead of "Ø".
        - Be precise and use exactly the formats requested.
        - Do not invent information; use only what is present in the note.

        Please provide the structured note in French.
        """
        try:
            response = await openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a helpful medical assistant."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating structured note: {e}")
            return "Error generating structured note" # Fallback message in case of error

    @app.post("/structure-note", response_model=StructureNoteResponse)
    async def structure_note(request: StructureNoteRequest):
        """Endpoint to generate structured note for a given transcription."""
        structured_note_content = await generate_structured_note(request.transcription_text)
        return {"structured_note": structured_note_content}

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    if __name__ == "__main__":
        import uvicorn
        port = int(os.environ.get("PORT", 8002)) # Use a different port (e.g., 8002) to avoid conflicts
        host = os.environ.get("HOST", "0.0.0.0")
        uvicorn.run("main:app", host=host, port=port, reload=True)
    ```

3.  **Create requirements.txt:**
    ```
    fastapi==0.110.0
    uvicorn==0.27.1
    openai==1.68.2
    requests==2.31.0
    python-dotenv==1.0.1
    supabase==2.0.0 # Or the latest version you are using
    ```

4.  **Create .env:**
    ```
    OPENAI_API_KEY=your-openai-api-key
    SUPABASE_URL=your-supabase-url
    SUPABASE_SERVICE_KEY=your-supabase-service-key
    PORT=8002 # Use a different port (e.g., 8002) to avoid conflicts
    HOST=0.0.0.0
    ```

5.  **Set up the virtual environment and install dependencies:**
    ```bash
    cd structured-notes-service
    python3 -m venv venv
    source venv/bin/activate   # Or . venv/bin/activate
    pip install -r requirements.txt
    ```

6.  **Start the FastAPI application:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8002
    ```

7.  **Test the new service:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"transcription_text": "Un homme de 55 ans qui est venu pour DRS. Ses antécédents, il y a MCAS, MPOC, hypertension, dyslipidémie, pas d'allergie, il prend des médicaments de l'aspirine, du Lipitor. À l'histoire, il y a une DRS depuis 8 heures ce matin qui dure de manière constante avec l'essoufflement, pas de nausées, vomissements, pas de mal de tête. C'est la deuxième fois que ça y arrive en un mois, il n'y a pas de fièvre. L'examen physique est normal, donc je pense à un syndrome coronain aigu, on va donner de l'aspirine puis faire un ECG, une échographie."}' http://localhost:8002/structure-note
    ```

After following these steps, the Structured Note Generation Service should be running locally and accessible.
