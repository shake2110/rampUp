"use server";

import {
  TUTOR_EVALUATOR_SYSTEM_PROMPT,
  getTutorAnalyticsPrompt,
} from "@/lib/prompts/tutor-analytics";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import type { Analytics } from "@/types/response";
import { OpenAI } from "openai";

const getOpenAIClient = () => {
  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  return new OpenAI({
    baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
    apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    maxRetries: 3,
  });
};

const MODELS = [
  process.env.OPENROUTER_MODEL || "openai/gpt-4o",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
];

export const generateInterviewAnalytics = async (payload: {
  callId: string;
  interviewId: string;
  transcript: string;
}) => {
  const { callId, interviewId, transcript } = payload;

  try {
    const response = await ResponseService.getResponseByCallId(callId);
    const interview = await InterviewService.getInterviewById(interviewId);

    if (response.analytics) {
      return { analytics: response.analytics as Analytics, status: 200 };
    }

    const interviewTranscript = transcript || response.details?.transcript;
    const objective = interview?.objective || "Evaluate teaching ability";

    const openai = getOpenAIClient();
    const prompt = getTutorAnalyticsPrompt(interviewTranscript, objective);

    let lastError = null;
    for (const model of MODELS) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: TUTOR_EVALUATOR_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });

        let content = completion.choices[0]?.message?.content || "";
        if (content.includes("```")) {
          content = content
            .replace(/```json\n?/, "")
            .replace(/\n?```/, "")
            .trim();
        }

        const analyticsResponse = JSON.parse(content);
        return { analytics: analyticsResponse, status: 200 };
      } catch (err: any) {
        lastError = err;
        console.warn(`Analytics model ${model} failed: ${err.message}. Trying next...`);
        if (err.status === 429) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error("Error generating tutor analytics:", error);
    return { error: "internal server error", status: 500 };
  }
};
