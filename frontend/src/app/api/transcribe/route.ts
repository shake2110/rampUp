import { NextResponse } from "next/server";

const PYTHON_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

/**
 * POST /api/transcribe
 * Proxies audio blobs from the browser to the Python faster-whisper backend.
 * Keeps the Python backend URL off the client.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const response = await fetch(`${PYTHON_BACKEND}/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Python backend /transcribe error:", err);
      return NextResponse.json(
        { error: "Transcription failed", detail: err },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    // If the Python backend is unreachable, return a clear message
    const isConnectionError =
      error?.cause?.code === "ECONNREFUSED" || error?.message?.includes("fetch failed");

    console.error("Transcribe proxy error:", error);
    return NextResponse.json(
      {
        error: isConnectionError
          ? "Voice backend is not running. Please start backend-python."
          : error.message,
        text: "",
        success: false,
      },
      { status: 503 },
    );
  }
}
