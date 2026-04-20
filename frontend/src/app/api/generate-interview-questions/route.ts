import { logger } from "@/lib/logger";
import { SYSTEM_PROMPT, generateQuestionsPrompt } from "@/lib/prompts/generate-questions";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("generate-interview-questions request received");
  try {
    const body = await req.json();
    const isOpenRouter = !!process.env.OPENROUTER_API_KEY;

    // Define a list of models to try in case of 429s or failures
    const models = [
      process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemma-2-9b-it:free",
      "mistralai/mistral-7b-instruct:free",
    ];

    const openai = new OpenAI({
      baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      maxRetries: 3,
    });

    let lastError = null;
    for (const model of models) {
      try {
        logger.info(`Attempting generation with model: ${model}`);
        const baseCompletion = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: generateQuestionsPrompt(body) },
          ],
          response_format: { type: "json_object" },
        });

        let content = baseCompletion.choices[0]?.message?.content || "";

        // Clean markdown
        if (content.includes("```")) {
          content = content
            .replace(/```json\n?/, "")
            .replace(/\n?```/, "")
            .trim();
        }

        const parsed = JSON.parse(content);
        logger.info(`Interview questions generated successfully using ${model}`);
        return NextResponse.json({ response: JSON.stringify(parsed) }, { status: 200 });
      } catch (err: any) {
        lastError = err;
        logger.warn(`Model ${model} failed: ${err.message}. Trying next...`);
        // If it's a 429, wait a bit
        if (err.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError;
  } catch (error: any) {
    logger.error("All generation attempts failed:", error);
    return NextResponse.json(
      {
        error: "Generation failed after multiple attempts",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
