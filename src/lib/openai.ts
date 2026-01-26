import OpenAI from "openai";

// Lazy initialization to avoid issues if API key not set
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env.local to enable medicine extraction."
      );
    }

    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

// Check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
