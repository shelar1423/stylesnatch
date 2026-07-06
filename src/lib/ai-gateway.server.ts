import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function createGeminiGatewayProvider(geminiKey: string) {
  return createGoogleGenerativeAI({
    apiKey: geminiKey,
  });
}
