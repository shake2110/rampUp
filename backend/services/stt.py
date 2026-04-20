from faster_whisper import WhisperModel
import os

class STTService:
    def __init__(self, model_size="tiny"):
        print(f"Loading Whisper model: {model_size}...")
        self.model = WhisperModel(model_size, device="cpu", compute_type="int8")

    def transcribe(self, file_path: str) -> str:
        segments, info = self.model.transcribe(file_path, beam_size=5)
        return " ".join([segment.text for segment in segments]).strip()

stt_service = STTService()
