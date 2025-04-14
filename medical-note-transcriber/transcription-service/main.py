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
import re

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")

openai_client = openai.OpenAI(api_key=openai_api_key)

# Initialize FastAPI app
app = FastAPI(
    title="Medical Note Transcription Service",
    description="A service for transcribing medical audio notes using OpenAI's latest GPT-4o Transcribe API with language selection",
    version="1.0.1",
)

class TranscriptionRequest(BaseModel):
    file_id: str
    file_url: Optional[str] = None
    language: Optional[str] = "en"  # Default to English if not specified

class TranscriptionResponse(BaseModel):
    message: str
    file_id: str
    status: str

def split_audio(audio_path, chunk_size_mb=24) -> List[str]:
    """Split audio file into chunks under the size limit."""
    try:
        # Get file size in MB
        file_size = Path(audio_path).stat().st_size / (1024 * 1024)
        if file_size <= chunk_size_mb:
            return [audio_path]
            
        # Calculate duration and chunk duration
        probe = subprocess.run([
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            audio_path
        ], capture_output=True, text=True)
        
        total_duration = float(probe.stdout.strip())
        chunk_duration = (chunk_size_mb / file_size) * total_duration
        num_chunks = math.ceil(total_duration / chunk_duration)
        
        print(f"[*] Splitting audio into {num_chunks} chunks...")
        chunks = []
        for i in range(num_chunks):
            start_time = i * chunk_duration
            chunk_path = f"{audio_path}.chunk{i}.wav"
            
            subprocess.run([
                'ffmpeg', '-i', audio_path,
                '-ss', str(start_time),
                '-t', str(chunk_duration),
                '-c:a', 'pcm_s16le',  # High-quality WAV encoding
                '-ar', '44100',  # 44.1kHz sample rate for high quality
                '-ac', '2',  # Stereo
                '-y',
                chunk_path
            ], check=True, capture_output=True)
            
            chunks.append(chunk_path)
            
        return chunks
    except Exception as e:
        print(f"Error splitting audio: {str(e)}")
        return []

def post_process_transcription(text: str) -> str:
    """Apply post-processing corrections to transcription."""
    corrections = {
        r'toxicoïde affecté': 'trouble schizo-affectif',
        r'mammiférien': 'membre inférieur',
        r'planète générale': "pas d'état général",
        r'syndrome coronaire régulier': 'syndrome coronarien',
        r'coup de coeur': 'cou, coeur',
        r'MCRS': 'MC1S',
        r'VRS': 'MVAS',
    }
    
    processed_text = text
    for error, correction in corrections.items():
        processed_text = re.sub(error, correction, processed_text, flags=re.IGNORECASE)
    
    return processed_text

async def transcribe_chunk(chunk_path: str) -> Optional[str]:
    """Transcribe a single audio chunk using OpenAI API."""
    try:
        with open(chunk_path, "rb") as audio_file:
            transcription = openai_client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=audio_file,
                language="fr",  # Changed from fr-CA to fr
                prompt="""Ce qui suit est une transcription médicale en français. 
                Le texte contient des abréviations et termes médicaux spécifiques comme:
                MPOC (maladie pulmonaire obstructive chronique)
                MCAS/MC1S (maladie coronarienne athérosclérotique)
                MVAS (maladie vasculaire athérosclérotique)
                TRS (trouble respiratoire du sommeil)
                État général
                Syndrome coronarien
                Schizo-affectif
                Membre inférieur
                
                Points importants:
                - Distinguer entre 'état général' et 'état générale'
                - 'Membre inférieur' et non 'mammifère'
                - 'Syndrome coronarien' et non 'syndrome coronaire'
                - Préserver la précision des abréviations médicales
                """,
                response_format="text"
            )
            # Apply post-processing
            return post_process_transcription(transcription.text)
    except Exception as e:
        print(f"Error transcribing chunk: {str(e)}")
        return None

async def transcribe_audio_file(audio_path: str, language: str = "fr") -> Optional[str]:
    """Process and transcribe complete audio file."""
    try:
        # Optimize audio for speech recognition
        optimized_audio = optimize_audio_for_speech(audio_path)
        
        # Split if larger than 25MB (OpenAI's limit)
        chunks = split_audio(optimized_audio) if os.path.getsize(optimized_audio) > 25 * 1024 * 1024 else [optimized_audio]
        
        transcriptions = []
        for chunk in chunks:
            text = await transcribe_chunk(chunk)
            if text:
                transcriptions.append(text)
            
        return " ".join(transcriptions) if transcriptions else None
        
    except Exception as e:
        print(f"Error processing audio file: {str(e)}")
        return None

def optimize_audio_for_speech(audio_path: str) -> str:
    """Optimize audio file for medical speech recognition."""
    output_path = f"{audio_path}_optimized.wav"
    try:
        subprocess.run([
            'ffmpeg', '-i', audio_path,
            '-ar', '22050',      # Increased sample rate for better clarity
            '-ac', '1',          # Keep mono
            '-c:a', 'pcm_s16le', # 16-bit PCM encoding
            '-af', 'highpass=f=50,lowpass=f=8000,volume=1.5', # Audio filters
            '-q:a', '0',         # Highest quality
            output_path
        ], check=True, capture_output=True)
        return output_path
    except Exception as e:
        print(f"Error optimizing audio: {str(e)}")
        return audio_path  # Return original if optimization fails

@app.get("/")
async def root():
    return {"message": "Medical Note Transcription Service is running"}

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(request: TranscriptionRequest, background_tasks: BackgroundTasks):
    # Validate request
    if not request.file_id:
        raise HTTPException(status_code=400, detail="file_id is required")
    
    if not request.file_url:
        raise HTTPException(status_code=400, detail="file_url is required")
    
    # Queue transcription task in background
    background_tasks.add_task(
        process_transcription, 
        file_id=request.file_id,
        file_url=request.file_url,
        language=request.language
    )
    
    return {
        "message": "Transcription queued successfully",
        "file_id": request.file_id,
        "status": "processing"
    }

@app.post("/transcribe-upload")
async def transcribe_upload(
    file: UploadFile = File(...),
    file_id: str = Form(...)
):
    """Endpoint for direct file upload and transcription"""
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name
        
        # Process transcription
        transcription_text = await transcribe_audio_file(temp_file_path)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        if not transcription_text:
            raise HTTPException(status_code=500, detail="Failed to transcribe audio")
        
        return {
            "message": "Transcription completed successfully",
            "file_id": file_id,
            "transcription_text": transcription_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_transcription(file_id: str, file_url: str, language: str = "fr-CA"):
    """Process the transcription in the background"""
    try:
        print(f"Starting transcription for {file_id}")
        
        # Create a temporary file to store the audio
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file_path = temp_file.name
            
            # Download the file
            response = requests.get(file_url)
            temp_file.write(response.content)
        
        try:
            # Transcribe the file - now passing only one argument
            transcription_text = await transcribe_audio_file(temp_file_path)
            
            if not transcription_text:
                raise Exception("Failed to transcribe audio")
            
            # Update the transcription status
            print(f"Transcription completed for {file_id}: {transcription_text[:100]}...")
            
            # Send the result back to the frontend
            try:
                # Get the frontend URL from environment variable
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
                update_url = f"{frontend_url}/api/update-transcription-text"
                print(f"Calling update API at {update_url} with file_id: {file_id}")
                
                payload = {
                    "file_id": file_id,
                    "transcription_text": transcription_text,
                    "status": "completed"
                }
                print(f"Request payload: {json.dumps(payload)}")
                
                response = requests.post(
                    update_url,
                    json=payload
                )
                
                print(f"Update API response status: {response.status_code}")
                print(f"Update API response body: {response.text}")
                
                if response.status_code != 200:
                    print(f"Failed to update transcription status: {response.text}")
                else:
                    print(f"Successfully updated transcription status for {file_id}")
            except Exception as e:
                print(f"Error updating transcription status: {str(e)}")
                print(f"Exception type: {type(e).__name__}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                
        except Exception as e:
            print(f"Transcription error for {file_id}: {str(e)}")
            
            # Update status to error
            try:
                update_url = "http://localhost:3000/api/update-transcription-text"
                requests.post(
                    update_url,
                    json={
                        "file_id": file_id,
                        "status": "error"
                    }
                )
            except:
                pass
            
            raise e
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    except Exception as e:
        print(f"Error processing transcription: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
