"use client";

import { useResponses } from "@/contexts/responses.context";
import axios from "axios";
import { CheckCircleIcon, Mic, MicOff } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";
import FileUpload from "../dashboard/interview/fileUpload";
import MiniLoader from "../loaders/mini-loader/miniLoader";
import { Button } from "../ui/button";

// ─────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string };
type InterviewProps = { interview: any };

const STATES = [
  "WARM_INTRODUCTION",
  "TEACHING_SIMULATION",
  "SCENARIO_TESTING",
  "REFLECTION",
  "CLOSING",
];

const STATE_LABELS: Record<string, string> = {
  WARM_INTRODUCTION: "Introduction",
  TEACHING_SIMULATION: "Teaching",
  SCENARIO_TESTING: "Scenario",
  REFLECTION: "Reflection",
  CLOSING: "Wrap-up",
};

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function BrowserCall({ interview }: InterviewProps) {
  const { createResponse } = useResponses();

  // ── Session state ──
  const [phase, setPhase] = useState<"pre" | "active" | "ended">(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`call_phase_${interview?.id}`);
      if (saved === "ended") {
        return "ended";
      }
    }
    return "pre";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && interview?.id && phase === "ended") {
      sessionStorage.setItem(`call_phase_${interview.id}`, "ended");
    }
  }, [phase, interview?.id]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [callId, setCallId] = useState("");
  const [resume, setResume] = useState("");
  const [isResumeUploaded, setIsResumeUploaded] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");

  // ── Conversation state ──
  const [currentState, setCurrentState] = useState("WARM_INTRODUCTION");
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [lastAiMessage, setLastAiMessage] = useState(
    "Hello! I'm excited to learn more about your teaching style today.",
  );

  // ── Recording state ──
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // ── Refs ──
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const recTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  // Stays in sync with callId state — needed to avoid stale closures in recorder.onstop
  const callIdRef = useRef<string>("");

  // ─────────────────────────────────────────────────────────
  // Setup
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthesisRef.current = window.speechSynthesis;
    }
    return () => {
      synthesisRef.current?.cancel();
      cancelAnimationFrame(animFrameRef.current);
      if (recTimerRef.current) {
        clearInterval(recTimerRef.current);
      }
    };
  }, []);

  // Auto-scroll transcript
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // ─────────────────────────────────────────────────────────
  // TTS — Browser SpeechSynthesis
  // ─────────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) {
      return;
    }
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Prefer a natural voice
    const pickVoice = () => {
      const voices = synthesisRef.current?.getVoices();
      if (!voices || voices.length === 0) {
        return null;
      }

      return (
        voices.find((v) =>
          ["Google UK English Female", "Samantha", "Karen", "Victoria"].some((n) =>
            v.name.includes(n),
          ),
        ) ||
        voices.find((v) => v.lang.startsWith("en") && !v.name.includes("Google")) ||
        voices[0]
      );
    };

    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setAiIsSpeaking(true);
    utterance.onend = () => {
      setAiIsSpeaking(false);
      setStatusMsg("Click the mic to respond");
    };
    utterance.onerror = () => setAiIsSpeaking(false);

    setStatusMsg("AI is speaking — click mic to interrupt");
    synthesisRef.current.speak(utterance);
  }, []);

  // Reload voices after they load async
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Audio level tracking (waveform)
  // ─────────────────────────────────────────────────────────

  const startAudioTracking = (stream: MediaStream) => {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    analyserRef.current = analyser;

    const tick = () => {
      if (!analyserRef.current) {
        return;
      }
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAudioLevel(avg);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  // ─────────────────────────────────────────────────────────
  // Recording
  // ─────────────────────────────────────────────────────────

  const startRecording = async () => {
    // Stop TTS if speaking
    if (synthesisRef.current?.speaking) {
      synthesisRef.current.cancel();
      setAiIsSpeaking(false);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      startAudioTracking(stream);

      // Pick best supported MIME type
      const mimeType =
        ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"].find((t) =>
          MediaRecorder.isTypeSupported(t),
        ) || "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        try {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          cancelAnimationFrame(animFrameRef.current);
          setAudioLevel(0);
          if (recTimerRef.current) {
            clearInterval(recTimerRef.current);
          }
          setRecordingSeconds(0);

          const blob = new Blob(audioChunksRef.current, {
            type: mimeType || "audio/webm",
          });
          if (blob.size < 2000) {
            setLiveText("(Too short — please try again)");
            return;
          }
          await transcribeAndRespond(blob, mimeType);
        } catch (err) {
          console.error("recorder.onstop error:", err);
          setStatusMsg("Something went wrong processing your audio. Please try again.");
          setIsTranscribing(false);
          setLoading(false);
        }
      };

      // Recording timer
      setRecordingSeconds(0);
      recTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);

      recorder.start(250); // collect chunks every 250ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setLiveText("");
      setStatusMsg("Recording… click again to stop");
    } catch (err: any) {
      console.error("Mic error:", err);
      alert(
        err?.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone access and try again."
          : "Could not start recording. Please check your microphone.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setStatusMsg("Processing your response...");
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ─────────────────────────────────────────────────────────
  // Transcribe → AI Response
  // ─────────────────────────────────────────────────────────

  const transcribeAndRespond = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setStatusMsg("Transcribing your response...");

    try {
      // 1. Send audio to /api/transcribe (proxies to Python faster-whisper)
      const formData = new FormData();
      const ext = mimeType.includes("ogg") ? ".ogg" : mimeType.includes("mp4") ? ".mp4" : ".webm";
      formData.append("file", blob, `recording${ext}`);

      const transcribeRes = await axios.post("/api/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const userText: string = transcribeRes.data.text?.trim();

      if (!userText) {
        setLiveText("(Could not hear you — please try again)");
        setIsTranscribing(false);
        setStatusMsg("Click mic to try again");
        return;
      }

      setLiveText(userText);
      setIsTranscribing(false);
      setStatusMsg("AI is thinking...");

      // 2. Add user message to transcript display
      setTranscript((prev) => [...prev, { role: "user", content: userText }]);

      // 3. Send to AI — use ref so we always have the current callId even inside stale closures
      setLoading(true);
      const res = await axios.post("/api/tutor/interact", {
        callId: callIdRef.current,
        userMessage: userText,
        interviewId: interview.id,
      });

      const aiText: string = res.data.response;
      setLastAiMessage(aiText);
      setCurrentState(res.data.state);
      setTranscript((prev) => [...prev, { role: "assistant", content: aiText }]);
      setLiveText("");

      // 4. Speak AI response
      speak(aiText);

      // 5. End if complete
      if (res.data.isEnded) {
        await triggerEvaluation();
      }
    } catch (err: any) {
      console.error("Pipeline error:", err);

      const isBackendDown =
        err?.response?.status === 503 || err?.message?.includes("Network Error");

      if (isBackendDown) {
        setStatusMsg("⚠️ Voice backend is offline. Run: cd backend-python && ./run.sh");
      } else {
        setStatusMsg("Something went wrong. Please try again.");
      }
      setIsTranscribing(false);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Session Management
  // ─────────────────────────────────────────────────────────

  const startInterview = async () => {
    setLoading(true);
    const newCallId = nanoid();
    setCallId(newCallId);
    callIdRef.current = newCallId; // ← sync ref immediately so closures see it

    try {
      await createResponse({
        interview_id: interview.id,
        call_id: newCallId,
        email,
        name,
        details: { resume },
      });

      const greeting = `Hi ${name || "there"}! Welcome to your teaching assessment. I'm going to ask you to do some teaching simulations — I'm looking at HOW you explain things, not what you know. Think of me as a curious student. Ready to begin?`;

      setTranscript([{ role: "assistant", content: greeting }]);
      setLastAiMessage(greeting);
      setPhase("active");
      speak(greeting);
    } catch (error) {
      console.error("Failed to start:", error);
      alert("Failed to start the session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const triggerEvaluation = async () => {
    setPhase("ended"); // Always show the "complete" screen immediately
    const currentCallId = callIdRef.current;
    if (!currentCallId) {
      console.warn("triggerEvaluation: no callId, skipping evaluate API call");
      return;
    }
    // Wait 1s to let the last interact route Supabase write commit before we read it
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await axios.post("/api/tutor/evaluate", { callId: currentCallId });
    } catch (e) {
      // Retry once after another second (network glitch or heavy DB load)
      console.warn("Evaluation first attempt failed, retrying...", e);
      await new Promise((r) => setTimeout(r, 2000));
      try {
        await axios.post("/api/tutor/evaluate", { callId: currentCallId });
      } catch (e2) {
        console.error("Evaluation failed after retry:", e2);
      }
    }
  };

  // ─────────────────────────────────────────────────────────
  // Computed values
  // ─────────────────────────────────────────────────────────

  const stateIndex = STATES.indexOf(currentState);
  const progressPct = Math.min(100, (stateIndex / (STATES.length - 1)) * 100);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canStart =
    name.trim().length > 0 &&
    isEmailValid &&
    (!interview.is_resume_based || isResumeUploaded) &&
    !loading;

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* ── Header ── */}
        <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  🎓 AI TUTOR SCREENER
                </span>
              </div>
              <h1 className="text-white text-xl font-bold">{interview.name}</h1>
            </div>

            {phase === "active" && (
              <div className="text-right">
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">
                  Current Phase
                </p>
                <p className="text-white font-bold text-sm mt-0.5">{STATE_LABELS[currentState]}</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {phase === "active" && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                {STATES.slice(0, -1).map((s, i) => (
                  <span
                    key={s}
                    className={`text-xs font-semibold transition-colors ${
                      i <= stateIndex ? "text-white" : "text-indigo-300/50"
                    }`}
                  >
                    {STATE_LABELS[s]}
                  </span>
                ))}
              </div>
              <div className="h-1 bg-white/20 rounded-full">
                <div
                  className="h-1 bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-8">
          {/* PRE-START */}
          {phase === "pre" && (
            <div className="max-w-md mx-auto space-y-6 py-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Welcome!</h2>
                <p className="text-indigo-300 mt-1 text-sm">
                  Fill in your details to start the teaching assessment.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {interview.is_resume_based && (
                  <div>
                    <p className="text-xs font-semibold text-indigo-200 mb-1">
                      Resume (PDF) — used to personalise scenarios only
                    </p>
                    <FileUpload
                      isUploaded={isResumeUploaded}
                      setIsUploaded={setIsResumeUploaded}
                      fileName={resumeFileName}
                      setFileName={setResumeFileName}
                      setUploadedDocumentContext={setResume}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 ${
                  canStart
                    ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02]"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
                disabled={!canStart}
                onClick={startInterview}
              >
                {loading ? <MiniLoader /> : "Begin Teaching Assessment"}
              </button>

              <div className="flex items-center gap-2 justify-center text-xs text-white/40">
                <span>🎤</span>
                <span>Use a quiet room · Speak clearly · Chrome recommended</span>
              </div>
            </div>
          )}

          {/* ACTIVE INTERVIEW */}
          {phase === "active" && (
            <div className="flex flex-col gap-6">
              {/* AI Speech Bubble */}
              <div className="relative bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-5">
                <div className="absolute -top-3 left-5">
                  <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    AI Interviewer
                  </span>
                </div>
                <p className="text-white text-base leading-relaxed mt-2">{lastAiMessage}</p>

                {aiIsSpeaking && (
                  <div className="flex gap-1 items-end h-5 mt-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-indigo-400 animate-bounce"
                        style={{
                          height: `${10 + i * 3}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                    <span className="text-indigo-300 text-xs ml-2 self-end mb-0.5">
                      Speaking...
                    </span>
                  </div>
                )}
              </div>

              {/* Transcript History */}
              {transcript.length > 2 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
                    Conversation
                  </p>
                  {transcript.slice(0, -1).map((msg, i) => (
                    <div
                      key={`${msg.role}-${i}`}
                      className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-snug ${
                          msg.role === "user"
                            ? "bg-indigo-500 text-white rounded-br-none"
                            : "bg-white/10 text-white/80 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}

              {/* Mic Control Area */}
              <div className="flex flex-col items-center gap-4">
                {/* Live text / status */}
                {(liveText || statusMsg) && (
                  <div className="text-center text-sm animate-pulse">
                    {liveText ? (
                      <span className="text-white/70 italic">"{liveText}"</span>
                    ) : (
                      <span className="text-indigo-300">{statusMsg}</span>
                    )}
                  </div>
                )}

                {/* Processing indicator */}
                {(loading || isTranscribing) && (
                  <div className="flex items-center gap-2 text-indigo-300 text-sm">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                    {isTranscribing ? "Transcribing..." : "AI is thinking..."}
                  </div>
                )}

                {/* Mic button + waveform */}
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={loading || isTranscribing}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed ${
                      isRecording
                        ? "bg-red-500 scale-110 shadow-red-500/40 shadow-[0_0_0_12px_rgba(239,68,68,0.15)]"
                        : "bg-indigo-500 hover:bg-indigo-400 hover:scale-105 shadow-indigo-500/30"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff size={32} className="text-white" />
                    ) : (
                      <Mic size={32} className="text-white" />
                    )}
                  </button>

                  {/* Waveform bars */}
                  {isRecording && (
                    <div className="flex gap-1 items-end h-14">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const h = Math.max(
                          6,
                          (audioLevel / 255) * 56 * (0.3 + Math.abs(Math.sin(i * 0.8)) * 0.7),
                        );
                        return (
                          <div
                            key={`wave-${i}`}
                            className="w-1.5 bg-red-400 rounded-full transition-all duration-75"
                            style={{ height: `${h}px` }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-white/60 text-sm font-medium">
                    {isRecording
                      ? `🔴 Recording ${recordingSeconds}s — click to stop`
                      : aiIsSpeaking
                        ? "🔊 AI is speaking — click to interrupt"
                        : "Click the mic to respond"}
                  </p>
                </div>

                {/* End early */}
                <button
                  type="button"
                  onClick={triggerEvaluation}
                  className="text-xs text-white/30 hover:text-red-400 transition-colors mt-1"
                >
                  End interview early
                </button>
              </div>
            </div>
          )}

          {/* ENDED */}
          {phase === "ended" && (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
                <CheckCircleIcon size={44} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Assessment Complete!</h2>
                <p className="text-indigo-300 mt-2 max-w-md mx-auto text-sm leading-relaxed">
                  Great work, {name || "candidate"}! Your responses are being analyzed for teaching
                  clarity, patience, and warmth. Our team will review your session and be in touch.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <p className="text-indigo-300 text-sm font-medium">Evaluation in progress...</p>
              </div>
              <p className="text-white/30 text-sm">You may close this window now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
