import { logger } from "@/lib/logger";
import { generateInterviewAnalytics } from "@/services/analytics.service";
import { ResponseService } from "@/services/responses.service";
import type { Response } from "@/types/response";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  logger.info("get-call request received");
  const body = await req.json();

  const callDetails: Response = await ResponseService.getResponseByCallId(body.id);

  if (!callDetails) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  // ── DIY (BrowserCall / Tutor) session ──────────────────────────────────────
  // These sessions set is_ended=true via the /api/tutor/interact route.
  // Their transcript lives in details.transcript (array of {role, content}).
  // We never call Retell for these.
  const isDiySession =
    callDetails.is_ended === true || Array.isArray(callDetails.details?.transcript);

  if (isDiySession) {
    // If already evaluated, just return what's stored
    if (callDetails.is_analysed && callDetails.analytics) {
      return NextResponse.json(
        { callResponse: callDetails.details, analytics: callDetails.analytics },
        { status: 200 },
      );
    }

    // Trigger evaluation on-demand if not done yet
    const transcriptText = (callDetails.details?.transcript ?? [])
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    if (!transcriptText) {
      return NextResponse.json(
        { callResponse: callDetails.details, analytics: null },
        { status: 200 },
      );
    }

    const result = await generateInterviewAnalytics({
      callId: body.id,
      interviewId: callDetails.interview_id,
      transcript: transcriptText,
    });

    const durationInSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(callDetails.created_at).getTime()) / 1000),
    );

    await ResponseService.updateResponse(
      {
        analytics: result.analytics,
        is_analysed: true,
        duration: durationInSeconds,
      },
      body.id,
    );

    return NextResponse.json(
      { callResponse: callDetails.details, analytics: result.analytics },
      { status: 200 },
    );
  }

  // ── Legacy Retell session ──────────────────────────────────────────────────
  if (callDetails.is_analysed) {
    return NextResponse.json(
      { callResponse: callDetails.details, analytics: callDetails.analytics },
      { status: 200 },
    );
  }

  // Retell path only runs when RETELL_API_KEY is set
  if (!process.env.RETELL_API_KEY) {
    return NextResponse.json(
      { callResponse: callDetails.details, analytics: null },
      { status: 200 },
    );
  }

  const Retell = (await import("retell-sdk")).default;
  const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });
  const callOutput = await retell.call.retrieve(body.id);
  const callResponse = callOutput;
  const duration = Math.round(
    (callResponse as any).end_timestamp / 1000 - (callResponse as any).start_timestamp / 1000,
  );

  const result = await generateInterviewAnalytics({
    callId: body.id,
    interviewId: callDetails.interview_id,
    transcript: (callResponse as any).transcript,
  });

  await ResponseService.updateResponse(
    {
      details: callResponse,
      is_analysed: true,
      duration,
      analytics: result.analytics,
    },
    body.id,
  );

  logger.info("Call analysed successfully");

  return NextResponse.json({ callResponse, analytics: result.analytics }, { status: 200 });
}
