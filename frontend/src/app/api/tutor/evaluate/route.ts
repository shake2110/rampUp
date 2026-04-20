import { LLMService, type Message } from "@/services/llm.service";
import { ResponseService } from "@/services/responses.service";
import { NextResponse } from "next/server";

import { InterviewService } from "@/services/interviews.service";

export async function POST(req: Request) {
  try {
    const { callId } = await req.json();

    // 1. Fetch the transcript
    const response = await ResponseService.getResponseByCallId(callId);
    if (!response || !response.details?.transcript) {
      return NextResponse.json({ error: "No transcript found" }, { status: 404 });
    }

    const transcriptText = response.details.transcript
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const interview = await InterviewService.getInterviewById(response.interview_id);
    const targetRole = interview?.name || "Tutor";
    const interviewContext = interview?.objective || "Assess teaching and communication ability.";

    const EVALUATOR_PROMPT = `You are an expert evaluator. Analyze the interview transcript for a candidate applying for the role of: ${targetRole}.
Context for the role: ${interviewContext}

Score the candidate specifically on how well their responses fit the role and context on:
- clarity
- patience
- warmth
- simplicity
- fluency

Rules:
- clarity = how easy their explanations are to understand.
- simplicity = ability to break complex concepts down appropriately for the target audience.
- patience = calm repetition, no frustration.
- warmth = encouraging tone.
- fluency = smooth, natural English.

STRICT REQUIREMENTS:
- Give a score (1-5) for each category.
- Provide clear reasoning for the score.
- Extract EXACT quotes as evidence for every score.
- Penalize over-complex explanations.
- Reward simple analogies and encouragement.
- Be strict. Do not inflate scores.

Output format MUST be valid JSON:
{
  "clarity": { "score": number, "reason": "...", "evidence": "..." },
  "patience": { "score": number, "reason": "...", "evidence": "..." },
  "warmth": { "score": number, "reason": "...", "evidence": "..." },
  "simplicity": { "score": number, "reason": "...", "evidence": "..." },
  "fluency": { "score": number, "reason": "...", "evidence": "..." },
  "overall_recommendation": "Hire" | "No Hire",
  "user_sentiment": "Positive" | "Neutral" | "Negative",
  "summary": "..."
}`;

    // 2. Call LLM for Evaluation
    const messages: Message[] = [
      { role: "system", content: EVALUATOR_PROMPT },
      {
        role: "user",
        content: `Analyze this transcript:\n\n${transcriptText}`,
      },
    ];

    const evaluationResult = await LLMService.chat(messages);

    let parsedEvaluation: any;
    try {
      // Find JSON block if LLM added text around it
      const jsonMatch = evaluationResult.match(/\{[\s\S]*\}/);
      parsedEvaluation = JSON.parse(jsonMatch ? jsonMatch[0] : evaluationResult);
    } catch (e) {
      console.error("Failed to parse evaluation JSON", evaluationResult);
      return NextResponse.json(
        { error: "Evaluation failed to produce valid data" },
        { status: 500 },
      );
    }

    // 3. Save Evaluation to Supabase — also mark is_ended so it appears in the dashboard
    const durationInSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(response.created_at).getTime()) / 1000),
    );

    await ResponseService.updateResponse(
      {
        analytics: parsedEvaluation,
        is_analysed: true,
        is_ended: true,
        duration: durationInSeconds,
      },
      callId,
    );

    return NextResponse.json({ evaluation: parsedEvaluation });
  } catch (error) {
    console.error("Evaluate API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
