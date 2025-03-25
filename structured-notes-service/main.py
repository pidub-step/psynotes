import os
import sys
import tempfile
import subprocess
import math
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class StructureNoteRequest(BaseModel):
    transcription_text: str

class StructureNoteResponse(BaseModel):
    structured_note: str

async def generate_structured_note(transcription_text: str) -> str:
    """Generates structured note using OpenAI API."""
    prompt = """
    You are a medical assistant tasked with structuring a doctor's note into a specific format. Given the following transcribed note:

    {}

    Output the structured note in this exact format:

    Note d'urgence :

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
    """.format(transcription_text)
    
    try:
        response = openai_client.chat.completions.create(
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
