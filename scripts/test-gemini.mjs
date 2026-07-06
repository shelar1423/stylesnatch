import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
const { generateText } = await import("ai");

async function main() {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.error("MISSING_KEY");
      process.exit(2);
    }
    const gateway = createOpenAICompatible({
      name: "google",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: key,
      supportsStructuredOutputs: false,
    });
    const model = gateway("gemini-2.0-flash");
    const res = await generateText({ model, prompt: "Say hello" });
    console.log("OK", typeof res.text === "string" ? res.text.slice(0, 200) : JSON.stringify(res));
  } catch (err) {
    // print detailed shape of error to capture headers/status if present
    try {
      const util = await import("util");
      console.error("ERR_VERBOSE", util.inspect(err, { showHidden: true, depth: 5 }));
    } catch (e) {
      console.error("ERR", err && err.message ? err.message : String(err));
    }
    process.exit(1);
  }
}

main();
