import Firecrawl from "@mendable/firecrawl-js";

async function main() {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.error("MISSING_KEY");
      process.exit(2);
    }
    const f = new Firecrawl({ apiKey });
    const res = await f.scrape("https://vercel.com", { formats: ["markdown"] });
    console.log("OK", Object.keys(res || {}).join(","));
  } catch (err) {
    console.error("ERR", err && err.message ? err.message : String(err));
    process.exit(1);
  }
}

main();
