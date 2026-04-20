import os
import tempfile
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Tutor Screener — Voice Backend")

# Static files for serving generated audio
os.makedirs("static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from services.stt import STTService
# Preload Whisper model once globally
print("⏳ Loading Whisper model...")
stt_service = STTService(model_size=os.getenv("WHISPER_MODEL", "tiny"))
print("✅ Whisper model loaded.")

def get_stt():
    return stt_service


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accept an audio blob (webm/wav/mp4), transcribe via faster-whisper,
    and return the transcript text.
    """
    try:
        # Determine file suffix from MIME type
        content_type = file.content_type or ""
        if "webm" in content_type:
            suffix = ".webm"
        elif "mp4" in content_type:
            suffix = ".mp4"
        elif "ogg" in content_type:
            suffix = ".ogg"
        else:
            suffix = ".wav"

        # Write to a named temp file
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        if len(content) < 1000:
            os.unlink(tmp_path)
            return {"text": "", "success": False, "reason": "Audio too short — likely silence"}

        # Transcribe
        stt = get_stt()
        text = stt.transcribe(tmp_path)

        # Cleanup
        os.unlink(tmp_path)

        return {"text": text.strip(), "success": True}

    except Exception as e:
        print(f"❌ Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AI Tutor Voice Backend", "port": 8001}


@app.post("/start-interview")
async def start_interview():
    return {"message": "DIY Backend Ready", "interview_id": str(uuid.uuid4())}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
