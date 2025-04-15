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
from medical_abbreviations import (
    get_french_medical_prompt,
    post_process_transcription as enhanced_post_process,
    get_specialty_terms
)

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
    language: Optional[str] = "fr"  # Default to French if not specified
    specialty: Optional[str] = None  # Optional medical specialty for context-specific processing

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

def post_process_transcription(text: str, specialty: str = None) -> str:
    """
    Apply post-processing corrections to transcription.
    This is a wrapper around the enhanced post-processing function from medical_abbreviations.py
    """
    return enhanced_post_process(text, specialty)

async def transcribe_chunk(chunk_path: str, language: str = "fr", specialty: str = None) -> Optional[str]:
    """
    Transcribe a single audio chunk using OpenAI API.
    
    Args:
        chunk_path: Path to the audio chunk file
        language: Language code (e.g., "fr" for French)
        specialty: Optional medical specialty for context-specific processing
    
    Returns:
        Transcribed text or None if an error occurred
    """
    try:
        # Determine the best model based on audio characteristics and language
        model = determine_best_model(chunk_path, language)
        
        with open(chunk_path, "rb") as audio_file:
            # Get the appropriate prompt based on language and specialty
            if language.startswith("fr"):
                prompt = get_french_medical_prompt(specialty)
            else:  # Default to English prompt or add more languages as needed
                prompt = """The following is a medical transcription in English.
                The text contains specific medical abbreviations and terms.
                Prioritize accuracy for medical terminology, drug names, and dosages.
                Prioritize accuracy for medical terminology."""

            transcription = openai_client.audio.transcriptions.create(
                model=model,
                file=audio_file,
                language=language,
                prompt=prompt,
                response_format="text"
            )
            
            # Apply enhanced post-processing with specialty context
            return post_process_transcription(transcription, specialty)
    except Exception as e:
        print(f"Error transcribing chunk: {str(e)}")
        return None

def determine_best_model(audio_path: str, language: str) -> str:
    """
    Determine the best transcription model based on audio characteristics and language.
    
    Args:
        audio_path: Path to the audio file
        language: Language code
        
    Returns:
        Model name to use for transcription
    """
    # Default to gpt-4o-transcribe
    default_model = "gpt-4o-transcribe"
    
    # For French, we might want to use a different model or approach
    if language.startswith("fr"):
        # Check audio characteristics
        try:
            # Get audio duration
            probe = subprocess.run([
                'ffprobe', '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                audio_path
            ], capture_output=True, text=True)
            
            duration = float(probe.stdout.strip())
            
            # For very short clips (< 10 seconds), we might want to use a different model
            # but for now we'll stick with the default as it's the best available
            
            # In the future, this function could be expanded to select different models
            # based on audio characteristics, specialty, or other factors
            
            return default_model
                
        except Exception as e:
            print(f"Error determining best model: {str(e)}")
            return default_model
    
    return default_model

async def transcribe_audio_file(audio_path: str, language: str = "fr", specialty: str = None) -> Optional[str]:
    """
    Process and transcribe complete audio file.
    
    Args:
        audio_path: Path to the audio file
        language: Language code (e.g., "fr" for French)
        specialty: Optional medical specialty for context-specific processing
        
    Returns:
        Transcribed text or None if an error occurred
    """
    try:
        # Optimize audio for speech recognition, with French-specific optimizations if applicable
        if language.startswith("fr"):
            optimized_audio = optimize_audio_for_french_speech(audio_path)
        else:
            optimized_audio = optimize_audio_for_speech(audio_path)
        
        # Split if larger than 25MB (OpenAI's limit)
        chunks = split_audio(optimized_audio) if os.path.getsize(optimized_audio) > 25 * 1024 * 1024 else [optimized_audio]
        
        transcriptions = []
        for chunk in chunks:
            # Pass the language and specialty parameters to transcribe_chunk
            text = await transcribe_chunk(chunk, language=language, specialty=specialty)
            if text:
                transcriptions.append(text)
            
        return " ".join(transcriptions) if transcriptions else None
        
    except Exception as e:
        print(f"Error processing audio file: {str(e)}")
        return None

def optimize_audio_for_speech(audio_path: str) -> str:
    """
    Optimize audio file for general medical speech recognition.
    
    Args:
        audio_path: Path to the audio file
        
    Returns:
        Path to the optimized audio file
    """
    output_path = f"{audio_path}_optimized.wav"
    try:
        print(f"[*] Optimizing audio: {audio_path}")
        # Use ffmpeg defaults to preserve sample rate and channels when possible
        # Apply filters suitable for speech
        subprocess.run([
            'ffmpeg', '-i', audio_path,
            '-c:a', 'pcm_s16le',  # Ensure 16-bit PCM encoding
            '-af', 'highpass=f=80,lowpass=f=8000,volume=1.5',  # Filters for speech clarity
            '-q:a', '0',          # Highest quality for the codec
            '-y',                 # Overwrite output file if it exists
            output_path
        ], check=True, capture_output=True, text=True)

        print(f"[*] Optimized audio saved to: {output_path}")
        return output_path
    except subprocess.CalledProcessError as e:
        # Log ffmpeg errors for debugging
        print(f"Error optimizing audio with ffmpeg: {str(e)}")
        print(f"ffmpeg stderr: {e.stderr}")
        return audio_path  # Return original path if optimization fails
    except Exception as e:
        print(f"Unexpected error optimizing audio: {str(e)}")
        return audio_path  # Return original path if optimization fails

def optimize_audio_for_french_speech(audio_path: str, accent="quebec") -> str:
    """
    Optimize audio file specifically for French medical speech recognition.
    
    Args:
        audio_path: Path to the audio file
        accent: French accent type (default: "quebec")
        
    Returns:
        Path to the optimized audio file
    """
    output_path = f"{audio_path}_optimized_french.wav"
    
    # Define accent-specific parameters
    accent_params = {
        "quebec": {
            "highpass": "70",  # Slightly lower to capture Quebec accent's lower frequencies
            "lowpass": "8500",  # Slightly higher to capture affrication in Quebec French
            "compand": "0.3,0.8:-60,-60,-30,-20,-20,-15,-10,-10,0,0",  # Dynamic range compression optimized for Quebec accent
        },
        "standard": {
            "highpass": "80",
            "lowpass": "8000",
            "compand": "0.3,0.8:-60,-60,-30,-20,-20,-10,-10,-5,0,0",
        },
    }
    
    # Use the appropriate accent parameters or default to standard French
    params = accent_params.get(accent, accent_params["standard"])
    
    try:
        print(f"[*] Optimizing audio for French speech: {audio_path}")
        
        # Build the ffmpeg filter chain for French speech optimization
        filter_chain = [
            f"highpass=f={params['highpass']}",  # High-pass filter
            f"lowpass=f={params['lowpass']}",    # Low-pass filter
            f"compand={params['compand']}",      # Dynamic range compression
            "volume=1.5",                        # Volume boost
            "equalizer=f=1000:width_type=o:width=1:g=1", # Slight boost to mid frequencies for clarity
            "equalizer=f=2500:width_type=o:width=1:g=2", # Boost to enhance consonant clarity
            "equalizer=f=400:width_type=o:width=1:g=1",  # Slight boost to enhance vowel clarity
        ]
        
        # Execute ffmpeg command with the optimized filter chain
        subprocess.run([
            'ffmpeg', '-i', audio_path,
            '-c:a', 'pcm_s16le',  # 16-bit PCM encoding
            '-ar', '44100',       # 44.1kHz sample rate
            '-af', ','.join(filter_chain),
            '-q:a', '0',          # Highest quality
            '-y',                 # Overwrite output file if it exists
            output_path
        ], check=True, capture_output=True, text=True)
        
        print(f"[*] French-optimized audio saved to: {output_path}")
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"Error optimizing audio for French speech: {str(e)}")
        print(f"ffmpeg stderr: {e.stderr}")
        return audio_path  # Return original path if optimization fails
    except Exception as e:
        print(f"Unexpected error optimizing audio for French speech: {str(e)}")
        return audio_path  # Return original path if optimization fails

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
    
    # Extract specialty from the request if available
    specialty = request.specialty if hasattr(request, 'specialty') else None
    
    # Queue transcription task in background
    background_tasks.add_task(
        process_transcription,
        file_id=request.file_id,
        file_url=request.file_url,
        language=request.language,
        specialty=specialty
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

async def process_transcription(file_id: str, file_url: str, language: str = "fr-CA", specialty: str = None):
    """
    Process the transcription in the background
    
    Args:
        file_id: ID of the file to transcribe
        file_url: URL of the file to transcribe
        language: Language code (e.g., "fr-CA" for Canadian French)
        specialty: Optional medical specialty for context-specific processing
    """
    try:
        print(f"Starting transcription for {file_id}")
        
        # Create a temporary file to store the audio
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file_path = temp_file.name
            
            # Download the file
            response = requests.get(file_url)
            temp_file.write(response.content)
        
        try:
            # Transcribe the file, passing the selected language and specialty
            transcription_text = await transcribe_audio_file(temp_file_path, language=language, specialty=specialty)
            
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
