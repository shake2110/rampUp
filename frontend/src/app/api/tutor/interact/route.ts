import { LLMService, type Message } from "@/services/llm.service";
import { ResponseService } from "@/services/responses.service";
import { NextResponse } from "next/server";

import { InterviewService } from "@/services/interviews.service";

const STATES = [
  "WARM_INTRODUCTION",
  "TEACHING_SIMULATION",
  "SCENARIO_TESTING",
  "REFLECTION",
  "CLOSING",
];

export async function POST(req: Request) {
  try {
    const { callId, userMessage, interviewId } = await req.json();

    // 1. Fetch current session & interview from DB
    const response = await ResponseService.getResponseByCallId(callId);
    if (!response) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const interview = await InterviewService.getInterviewById(interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const targetRole = interview?.name || "Tutor";
    const interviewContext = interview?.objective || "Assess teaching and communication ability.";
    const customQuestions = interview?.questions?.map((q: any) => q.question) || [];

    const currentState: string = response.tutor_state || "WARM_INTRODUCTION";
    const resume: string | undefined = response.details?.resume;
    const resumeContext = resume
      ? `\n\nCandidate Resume (use ONLY to personalize teaching scenarios — do not conduct a resume walkthrough):\n${resume}`
      : "";

    // 2. Dynamic Prompts Based on UI Settings
    const TUTOR_INTERVIEWER_PROMPT = `You are a friendly and perceptive AI interviewer for the role: ${targetRole}.
Context: ${interviewContext}

Your goal is to assess the candidate strictly through natural conversation based on the provided context.

Behaviors:
- Warm, encouraging tone at all times.
- Act STRICTLY as the interviewer. NEVER provide answers to the questions you ask.
- If the candidate asks YOU for the answer or asks you to explain something, politely redirect the question back to them ("I'd love to hear how you would approach it" or "Why don't you try explaining it first?").
- If a response is fewer than 15 words: ask for more detail.
- If a response is overly complex or uses jargon: ask them to simplify or elaborate.
- Ask follow-up questions if something is vague.
- Keep YOUR OWN responses SHORT — under 3 sentences.

NEVER:
- Ask generic HR questions ("Tell me about yourself")
- Sound robotic or repeat the same phrase
- Break character or provide textbook answers.

You are extracting signals for: Clarity, Patience, Simplicity, and Communication.`;

    const STATE_PROMPTS: Record<string, string> = {
      WARM_INTRODUCTION: `Greet the candidate warmly by name if known. Briefly explain this is an assessment for the ${targetRole} role. Ask if they are ready to begin.`,
      TEACHING_SIMULATION:
        customQuestions.length > 0
          ? `Ask the candidate the first custom question: "${customQuestions[0]}". After their first explanation, act slightly confused and push them to simplify or elaborate.`
          : `Ask the candidate to explain a core concept related to ${targetRole}. After their first explanation, respond AS a confused student. Push them to simplify.`,
      SCENARIO_TESTING:
        customQuestions.length > 1
          ? `Ask the candidate the second custom question: "${customQuestions[1]}". Dig deeper into their response with a follow-up.`
          : `Present a challenging scenario related to ${targetRole}. Ask the candidate how they would respond in that exact moment.`,
      REFLECTION:
        customQuestions.length > 2
          ? `Ask the candidate the third custom question: "${customQuestions[2]}".`
          : `Ask the candidate: 'After solving a problem or teaching a concept, how do you actually verify it was successful?'`,
      CLOSING:
        "The assessment is complete. Thank the candidate warmly and specifically. Mention that their responses will be analyzed. End naturally.",
    };

    // 3. Load existing conversation history from DB
    const history: Message[] = Array.isArray(response.details?.transcript)
      ? response.details.transcript
      : [];

    // 4. Build message array for LLM
    const messages: Message[] = [
      {
        role: "system",
        content: TUTOR_INTERVIEWER_PROMPT + resumeContext,
      },
      {
        role: "system",
        content: `Current Phase: ${currentState}\nInstructions: ${STATE_PROMPTS[currentState]}`,
      },
      ...history,
      { role: "user", content: userMessage },
    ];

    // 4. Get AI Response
    const aiResponse = await LLMService.chat(messages);

    // 5. Build updated transcript
    const updatedHistory: Message[] = [
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content: aiResponse },
    ];

    // 6. State transition — based on user turn count
    const userTurns = updatedHistory.filter((m) => m.role === "user").length;
    let nextState = currentState;

    if (currentState === "WARM_INTRODUCTION" && userTurns >= 1) {
      nextState = "TEACHING_SIMULATION";
    } else if (currentState === "TEACHING_SIMULATION" && userTurns >= 4) {
      nextState = "SCENARIO_TESTING";
    } else if (currentState === "SCENARIO_TESTING" && userTurns >= 6) {
      nextState = "REFLECTION";
    } else if (currentState === "REFLECTION" && userTurns >= 8) {
      nextState = "CLOSING";
    }

    const isEnded = nextState === "CLOSING" && userTurns >= 9;

    // 7. Persist to Supabase
    await ResponseService.updateResponse(
      {
        tutor_state: nextState,
        details: { ...response.details, transcript: updatedHistory },
        is_ended: isEnded,
      },
      callId,
    );

    return NextResponse.json({
      response: aiResponse,
      state: nextState,
      isEnded,
    });
  } catch (error: any) {
    console.error("Interact API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
