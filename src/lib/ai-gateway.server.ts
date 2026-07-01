import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createOpenRouterGatewayProvider(openRouterKey: string) {
  return createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterKey,
    supportsStructuredOutputs: false,
  });
}