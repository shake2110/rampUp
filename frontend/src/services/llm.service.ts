import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

const chat = async (messages: Message[], model: string = OPENROUTER_MODEL) => {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: model,
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_LIVE_URL || "http://localhost:3000",
          "X-Title": "AI Tutor Screener",
        },
      },
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error("OpenRouter API Error Details:", {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });
    throw new Error(`LLM Error: ${errorMessage}`);
  }
};

export const LLMService = {
  chat,
};
