import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Simple in-memory cooldowns to prevent repeated immediate calls after a 429.
const apiCooldowns = new Map<string, number>();

// Cache the expensive Firecrawl scrape payload per URL so retries and repeat
// scans don't re-spend credits. A site's design doesn't change minute to
// minute; only the (cheaper) AI synthesis is re-run on a cache hit.
type ScrapeCacheEntry = {
  expires: number;
  primaryMarkdown: string;
  screenshot: string | null;
  branding: BrandingPayload | null;
  metadata: Record<string, string>;
  secondaryMarkdowns: Array<{ url: string; markdown: string }>;
};
const scrapeCache = new Map<string, ScrapeCacheEntry>();
const SCRAPE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const ScanInput = z.object({
  url: z.string().min(1),
});

type Jsonish = string | number | boolean | null | Jsonish[] | { [k: string]: Jsonish };

type BrandingPayload = {
  colors?: Record<string, string>;
  colorScheme?: string;
  fonts?: Array<{ family?: string }>;
  typography?: Jsonish;
  spacing?: Jsonish;
  components?: Jsonish;
  images?: Record<string, string>;
  logo?: string;
};

export type ScanResult = {
  url: string;
  title: string;
  description: string;
  screenshot: string | null;
  branding: BrandingPayload | null;
  pagesScanned: number;
  skillMarkdown: string;
};

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function slugFromUrl(u: string): string {
  try {
    const host = new URL(u).hostname.replace(/^www\./, "");
    return host.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  } catch {
    return "site";
  }
}

// Pages that add little to a *visual* style guide — skip them to save credits.
const JUNK_PATH =
  /\/(login|sign-?in|sign-?up|register|logout|privacy|terms|tos|legal|cookies?|gdpr|careers?|jobs|support|help|account|cart|checkout|password|reset|refund|returns?|shipping)(\/|$|\?)/i;
// Pages that usually showcase the design language strongly.
const VALUE_PATH =
  /\/(pricing|prices?|plans?|about|features?|product|solutions?|services?|how-it-works|use-cases?|customers?|showcase|gallery|examples?|why)/i;

// Each secondary page costs a Firecrawl credit, so pick a few high-value
// same-origin pages rather than the first N links we happen to find.
function selectSecondaryUrls(baseUrl: string, links: string[], max: number): string[] {
  if (max <= 0) return [];
  let origin = "";
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return [];
  }
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const l of links) {
    if (typeof l !== "string" || !l.startsWith(origin) || l === baseUrl) continue;
    const clean = l.split("#")[0];
    if (clean === baseUrl || seen.has(clean)) continue;
    if (/\.(png|jpe?g|gif|svg|webp|pdf|zip|mp4|css|js)(\?|$)/i.test(clean)) continue;
    if (JUNK_PATH.test(clean)) continue;
    seen.add(clean);
    candidates.push(clean);
  }
  const depth = (u: string) => {
    try {
      return new URL(u).pathname.split("/").filter(Boolean).length;
    } catch {
      return 99;
    }
  };
  // High-value pages first, then shallower paths (top-level > deep permalinks).
  candidates.sort((a, b) => {
    const va = VALUE_PATH.test(a) ? 1 : 0;
    const vb = VALUE_PATH.test(b) ? 1 : 0;
    if (va !== vb) return vb - va;
    return depth(a) - depth(b);
  });
  return candidates.slice(0, max);
}

// When the homepage + branding already carry the palette, fonts, and enough
// copy, we can scrape fewer secondary pages without hurting quality.
function brandingIsRich(branding: BrandingPayload | null, markdown: string): boolean {
  const colorCount = Object.values(branding?.colors ?? {}).filter(Boolean).length;
  const hasFonts = (branding?.fonts ?? []).some((f) => Boolean(f?.family));
  return colorCount >= 4 && hasFonts && markdown.length > 6000;
}

function buildFallbackSkillMarkdown(args: {
  siteName: string;
  url: string;
  branding: BrandingPayload | null;
  metadata: Record<string, string>;
  primaryMarkdown: string;
  secondaryMarkdowns: Array<{ url: string; markdown: string }>;
}): string {
  const slug = slugFromUrl(args.url);

  const colorEntries = Object.entries(args.branding?.colors ?? {}).filter(
    ([, v]) => typeof v === "string" && v.trim().length > 0,
  );
  const paletteEntries: Array<[string, string]> = colorEntries.length
    ? colorEntries.slice(0, 14)
    : [
        ["background", "#FAF7EE"],
        ["foreground", "#111111"],
        ["accent", "#5B6CFF"],
      ];
  const palette = paletteEntries.map(([name, value]) => `- ${name}: ${value}`).join("\n");
  const cssVarLines = paletteEntries
    .map(
      ([name, value]) =>
        `  --${name
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase()}: ${value};`,
    )
    .join("\n");

  const fonts = (args.branding?.fonts ?? [])
    .map((f) => f.family)
    .filter((f): f is string => Boolean(f && f.trim()));
  const displayFont = fonts[0] ?? "Inter";
  const bodyFont = fonts[1] ?? fonts[0] ?? "Inter";

  // Pull real headlines and CTA labels out of the scraped markdown so even
  // the no-AI path stays specific to this site.
  const headings = Array.from(
    new Set(
      (args.primaryMarkdown.match(/^#{1,3} .+$/gm) ?? [])
        .map((h) =>
          h
            .replace(/^#+\s*/, "")
            .replace(/[*_`]/g, "")
            .trim(),
        )
        .filter((h) => h.length > 2 && h.length < 90),
    ),
  ).slice(0, 8);
  const ctas = Array.from(
    new Set(
      Array.from(args.primaryMarkdown.matchAll(/\[([^\]\n]{2,30})\]\([^)]+\)/g))
        .map((m) => m[1].replace(/[*_`]/g, "").trim())
        .filter((t) => /^[A-Za-z][A-Za-z0-9\s'&+.-]*$/.test(t) && t.split(/\s+/).length <= 4),
    ),
  ).slice(0, 8);
  const title = args.metadata.title || args.siteName || args.url;
  const description =
    args.metadata.description ||
    "A polished landing page skill capturing the site’s layout, spacing, palette, and component style for faithful reproduction.";

  return `---
name: ${slug}-style
description: A fallback skill for ${title} that captures the site’s tone, layout, spacing, and visual hierarchy.
---

# ${title}

${description}

## Overview
This skill is intended to help an AI agent reproduce a landing page or marketing homepage with the same layout, visual hierarchy, typography, spacing, and component style as the original site. It should be used to build a page, not a generic modern website.

## Design Direction
- Maintain a structured landing page flow with a strong hero, a clear value proposition, and a focused CTA.
- Use one dominant neutral background, one bold accent color, and restrained supporting neutrals.
- Keep typography clear, modern, and confident with a strong size hierarchy between hero, headings, and body text.

## Palette
${palette}

## CSS Variables
\`\`\`css
:root {
${cssVarLines}
  --font-display: "${displayFont}", sans-serif;
  --font-body: "${bodyFont}", sans-serif;
  --radius-card: 24px;
  --radius-pill: 9999px;
  --shadow-panel: 0 24px 80px rgba(17, 17, 17, 0.08);
  --space-section: 5rem;
}
\`\`\`

## Typography
- Display: ${displayFont}, SemiBold, 3rem / 48px, tracking -0.02em.
- Heading: ${displayFont}, Medium, 2rem / 32px, strong visual hierarchy.
- Body: ${bodyFont}, Regular, 1rem / 16px, line-height 1.6.
- Accent labels: uppercase, 0.08em letter-spacing, muted tone.${
    fonts.length ? `\n- Font families detected on the site: ${fonts.join(", ")}.` : ""
  }

## Spacing & Layout
- Page max-width: 1200px.
- Section top/bottom padding: 5rem (80px) for hero, 4rem (64px) for major sections, 3rem (48px) for supporting sections.
- Content container padding: 1.5rem (24px) horizontal on mobile, 4rem (64px) on desktop.
- Card gutter: 1.5rem (24px).
- Border radius: 24px for cards, 9999px for pills and badges.
- Shadow: 0 24px 80px rgba(17, 17, 17, 0.08) for elevated panels.

## Page Build Plan
${
  headings.length
    ? `Real section headings observed on the homepage — rebuild in this order:\n${headings
        .map((h, i) => `${i + 1}. "${h}"`)
        .join("\n")}\n\nGeneric flow to fill any gaps:`
    : ""
}
1. Hero
   - Large left-aligned heading with bold weight, a short supporting paragraph, and two CTA buttons.
   - Use a strong accent primary button and a secondary ghost button.
   - Add a subtle decorative accent behind the hero copy or within the hero area.
2. Feature / Benefits section
   - Use 2-3 cards or columns with concise headers, short body text, and icon placeholders.
   - Keep card spacing consistent and content aligned in a clear grid.
3. Proof / Trust section
   - Include brand logos, testimonial quotes, or simple statistics in a clean row.
4. Secondary CTA
   - Full-width reinforced CTA section with a short heading, supporting sentence, and prominent button.
5. Footer
   - Minimal links and soft supporting text.

## Motion & Interactions
- Hover states: Subtle scaling (1.02x) and shadow elevation on cards.
- Active states: Quick scale down (0.98x) to feel tactile and responsive.
- Transitions: Use smooth, bouncy easing (e.g., cubic-bezier(0.34, 1.56, 0.64, 1)) for a modern feel.
- Scroll animations: Fade in and slide up (20px) for elements entering the viewport.

## Component Rules
- Primary button: accent background, white text, medium weight, 16px vertical padding, 32px horizontal padding, radius 9999px.
- Secondary button: transparent background, 1px accent border, accent text, same padding and radius.
- Card: white or soft neutral background, rounded corners, subtle shadow, 24px internal padding.
- Section headings: strong weight, 36-48px display size, tight line-height.
- Body text: 16px, 1.6 line-height, balanced margins.
- Text blocks: limit width to 55-70 characters for paragraphs.

## Voice & Copy
- Tone: confident, polished, modern, and approachable.
- Headline style: short, declarative, value-driven.${
    headings.length
      ? `\n- Real headlines from the site (mirror this voice):\n${headings
          .map((h) => `  - "${h}"`)
          .join("\n")}`
      : ""
  }
- CTA examples: ${
    ctas.length
      ? ctas.map((c) => `"${c}"`).join(", ")
      : `"Start building", "Explore the product", "See it in action"`
  }.
- Support copy: 1-2 short sentences that clarify the benefit and reduce friction.

## Imagery & Decoration
- Use clean, modern imagery or abstract graphic accents.
- Prefer simple gradients, soft shadows, and layered cards or floating elements.
- Avoid noisy or overly detailed textures; keep decoration subtle and supportive.

## Do / Don't
- Do: preserve page structure, spacing rhythm, and accent styling.
- Do: use the palette consistently and keep copy short.
- Don't: create a generic page with unrelated layout or too many competing colors.
- Don't: over-design with heavy textures or dense typography.

## Usage
Use this skill when the user asks for a landing page, homepage, or product marketing page. The agent should reproduce the same layout, spacing, headings, section order, palette, and button style rather than inventing a different modern page.

### Source Signals
- URL: ${args.url}
- Homepage excerpt: ${args.primaryMarkdown.slice(0, 240).replace(/\s+/g, " ")}
- Additional pages: ${
    args.secondaryMarkdowns
      .slice(0, 2)
      .map((item) => item.url)
      .join(", ") || "none"
  }
`;
}

function shouldUseFallback(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  return /more credits|insufficient credits|credit|402|401|403|invalid api key|api key|ENOTFOUND|getaddrinfo|connect to api|network|fetch failed|ECONN/i.test(
    msg,
  );
}

// Overload / throttling errors are transient on Google's side — worth retrying
// and worth trying a different model (each model has its own capacity pool).
function isTransientAiError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  return /high demand|overloaded|unavailable|resource.?exhausted|too many requests|rate.?limit|429|503/i.test(
    msg,
  );
}

// Tried in order; overload on one model rarely affects the others.
// (gemini-2.0-flash is deliberately absent — this project's key has zero
// free-tier quota for it.)
const GEMINI_MODEL_CHAIN = Array.from(
  new Set([
    process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
  ]),
);

// A SKILL.md is only useful if an agent can build from it without guessing.
// These checks catch the thin output weaker fallback models tend to produce.
function skillQualityIssues(md: string): string[] {
  const issues: string[] = [];
  if (md.length < 4500) {
    issues.push("the file is too short — every section needs concrete, copy-pastable detail");
  }
  const hexCount = new Set(md.match(/#[0-9a-fA-F]{6}\b/g) ?? []).size;
  if (hexCount < 5) issues.push("fewer than 5 concrete hex color values");
  if (!/:root/.test(md)) issues.push("missing the :root CSS custom-properties block");
  for (const section of ["## Layout", "## Motion", "## Voice", "## Do", "## Usage"]) {
    if (!md.includes(section)) issues.push(`missing the "${section}" section`);
  }
  return issues;
}

function buildExpandPrompt(originalPrompt: string, draft: string, issues: string[]): string {
  return `${originalPrompt}

=== PREVIOUS DRAFT (not detailed enough) ===
${draft}

The draft above is too thin to act as a build spec. Problems found:
${issues.map((i) => `- ${i}`).join("\n")}

Rewrite the COMPLETE SKILL.md file. Keep everything that is already good and expand every section with concrete, copy-pastable specifics: hex values, px/rem sizes, font weights, exact CSS/Tailwind class suggestions, and verbatim copy examples from the scraped content. Return ONLY the raw markdown of the full file, no preamble.`;
}

export const scanSite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScanInput.parse(input))
  .handler(async ({ data }): Promise<ScanResult> => {
    const url = normalizeUrl(data.url);
    const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? process.env.VITE_FIRECRAWL_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;

    if (!firecrawlKey)
      throw new Error("Firecrawl is not connected. Set FIRECRAWL_API_KEY in your environment.");
    if (!geminiKey) {
      console.warn(
        "Gemini API key is not configured; the built-in fallback skill template will be used.",
      );
    }

    // Scrape-derived inputs, served from cache when possible so retries and
    // repeat scans of the same URL don't re-spend Firecrawl credits.
    let primaryMarkdown: string;
    let screenshot: string | null;
    let branding: BrandingPayload | null;
    let metadata: Record<string, string>;
    let secondaryMarkdowns: Array<{ url: string; markdown: string }>;

    const cached = scrapeCache.get(url);
    if (cached && Date.now() < cached.expires) {
      ({ primaryMarkdown, screenshot, branding, metadata, secondaryMarkdowns } = cached);
      console.log(`Firecrawl cache hit for ${url} — skipping scrape (0 credits spent).`);
    } else {
      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const firecrawl = new Firecrawl({ apiKey: firecrawlKey });

      // 1) Primary scrape: branding + markdown + screenshot + links (1 credit)
      const primary = (await firecrawl.scrape(url, {
        formats: ["markdown", "screenshot", "links", "branding"],
        onlyMainContent: false,
      })) as Record<string, unknown>;

      primaryMarkdown =
        (primary.markdown as string | undefined) ??
        (primary.data as { markdown?: string } | undefined)?.markdown ??
        "";
      screenshot =
        (primary.screenshot as string | undefined) ??
        (primary.data as { screenshot?: string } | undefined)?.screenshot ??
        null;
      branding =
        (primary.branding as BrandingPayload | undefined) ??
        (primary.data as { branding?: BrandingPayload } | undefined)?.branding ??
        null;
      metadata =
        (primary.metadata as Record<string, string> | undefined) ??
        (primary.data as { metadata?: Record<string, string> } | undefined)?.metadata ??
        {};
      const links: string[] =
        (primary.links as string[] | undefined) ??
        (primary.data as { links?: string[] } | undefined)?.links ??
        [];

      // 2) Scrape a few high-value same-origin pages for richer coverage.
      //    Each page costs 1 credit, so cap the count (fewer when the homepage
      //    is already rich) and skip junk pages (login/legal/etc.).
      secondaryMarkdowns = [];
      const maxSecondary = brandingIsRich(branding, primaryMarkdown) ? 2 : 3;
      const secondaryUrls = selectSecondaryUrls(url, links, maxSecondary);

      if (secondaryUrls.length > 0) {
        try {
          const batch = (await firecrawl.batchScrape(secondaryUrls, {
            options: { formats: ["markdown"], onlyMainContent: true },
          })) as unknown as Record<string, unknown>;
          const items =
            (batch.data as Array<Record<string, unknown>> | undefined) ??
            (Array.isArray(batch) ? (batch as Array<Record<string, unknown>>) : []);
          for (const item of items) {
            const md = (item.markdown as string | undefined) ?? "";
            const meta = item.metadata as { sourceURL?: string } | undefined;
            if (md && meta?.sourceURL) {
              secondaryMarkdowns.push({ url: meta.sourceURL, markdown: md.slice(0, 4000) });
            }
          }
        } catch (err) {
          console.warn("secondary batchScrape failed", err);
        }
      }

      scrapeCache.set(url, {
        expires: Date.now() + SCRAPE_CACHE_TTL_MS,
        primaryMarkdown,
        screenshot,
        branding,
        metadata,
        secondaryMarkdowns,
      });
    }

    // 3) Ask Gemini to synthesize a SKILL.md
    const { createGeminiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");

    const gateway = createGeminiGatewayProvider(geminiKey as string);

    // Never throws: walks the model chain retrying transient errors, and if
    // every model fails, returns the built-in fallback template.
    async function generateWithRetry(prompt: string) {
      const attemptsPerModel = 2;

      for (const modelId of GEMINI_MODEL_CHAIN) {
        const model = gateway(modelId);

        for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
          try {
            const res = await generateText({
              model,
              prompt,
              temperature: 0.2,
              // Keep the AI SDK's internal retry short — backoff and model
              // switching are handled here where we control the timing.
              maxRetries: 1,
            });

            const issues = skillQualityIssues(res.text);
            if (issues.length === 0) return res.text;

            // Weaker fallback models tend to produce thin files. One repair
            // pass asking the same model to expand usually closes the gap.
            console.warn(
              `SKILL.md draft from ${modelId} is thin (${issues.join("; ")}) — running one expansion pass.`,
            );
            try {
              const repaired = await generateText({
                model,
                prompt: buildExpandPrompt(prompt, res.text, issues),
                temperature: 0.2,
                maxRetries: 1,
              });
              if (skillQualityIssues(repaired.text).length < issues.length) {
                return repaired.text;
              }
            } catch (repairErr) {
              console.warn("Expansion pass failed; keeping the original draft.", repairErr);
            }
            return res.text;
          } catch (err: unknown) {
            console.error(`generateText error (${modelId}, attempt ${attempt}):`, err);

            // Auth / billing / network errors won't heal by switching models.
            if (shouldUseFallback(err)) {
              console.warn("Gemini unavailable, using built-in fallback skill template.");
              return buildFallbackSkillMarkdown({
                siteName,
                url,
                branding,
                metadata,
                primaryMarkdown,
                secondaryMarkdowns,
              });
            }

            // Unknown (non-transient) errors: don't burn time retrying the
            // same model, but do give the rest of the chain a chance.
            if (!isTransientAiError(err)) break;

            // Try to read a Retry-After value if available on common shapes
            let retryAfterSec: number | undefined;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const e = err as any;
              const header =
                e?.headers?.get?.("retry-after") ??
                e?.response?.headers?.["retry-after"] ??
                e?.response?.headers?.["Retry-After"];
              retryAfterSec = Number(header);
              if (Number.isNaN(retryAfterSec)) retryAfterSec = undefined;
            } catch {
              retryAfterSec = undefined;
            }

            if (retryAfterSec) {
              apiCooldowns.set(geminiKey as string, Date.now() + retryAfterSec * 1000);
            }

            if (attempt < attemptsPerModel) {
              // Overload waves last longer than classic rate-limit windows —
              // back off in seconds, not milliseconds (capped at 20s so the
              // request doesn't hang forever).
              const jitter = Math.floor(Math.random() * 2000);
              const delayMs = Math.min(
                Math.max(8000 * attempt + jitter, (retryAfterSec ?? 0) * 1000),
                20_000,
              );
              console.warn(
                `AI call to ${modelId} hit a transient error — retrying in ${delayMs}ms`,
              );
              await new Promise((r) => setTimeout(r, delayMs));
            }
          }
        }
        console.warn(`Model ${modelId} exhausted, trying next model in chain.`);
      }

      console.warn("All Gemini models failed; using built-in fallback skill template.");
      return buildFallbackSkillMarkdown({
        siteName,
        url,
        branding,
        metadata,
        primaryMarkdown,
        secondaryMarkdowns,
      });
    }

    // A recent Retry-After cooldown is only advisory now — the retry/fallback
    // chain below guarantees a result either way.
    const cooldownUntil = apiCooldowns.get(geminiKey as string);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const sec = Math.ceil((cooldownUntil - Date.now()) / 1000);
      console.warn(`Gemini key is in a Retry-After window (~${sec}s) — proceeding anyway.`);
    }

    const siteName =
      metadata.title || metadata["og:title"] || new URL(url).hostname.replace(/^www\./, "");
    const slug = slugFromUrl(url);

    const prompt = `You are a senior design engineer. Analyze the website below and produce a SINGLE, self-contained SKILL.md file that another AI agent (Claude Code, Codex, Cursor, etc.) can load to *faithfully replicate the visual style and vibe* of this site when building new pages or components.

SITE: ${siteName}
URL: ${url}

=== SCRAPED BRANDING JSON (Firecrawl) ===
${JSON.stringify(branding ?? {}, null, 2).slice(0, 4000)}

=== METADATA ===
${JSON.stringify(metadata, null, 2).slice(0, 1500)}

=== HOMEPAGE MARKDOWN (excerpt) ===
${(primaryMarkdown || "").slice(0, 6000)}

=== ADDITIONAL PAGES (excerpts) ===
${secondaryMarkdowns
  .map((p) => `--- ${p.url} ---\n${p.markdown}`)
  .join("\n\n")
  .slice(0, 8000)}

Return ONLY the raw markdown content of SKILL.md, no code fences around the whole thing, no preamble.

Requirements:
1. Start with YAML frontmatter:
---
name: ${slug}-style
description: Replicates the visual style of ${siteName} — use when the user asks for a site or component that looks/feels like ${siteName} or ${url}.
---
2. Then include these sections, in this order, with concrete, copy-pastable specifics (hex values, font names, px/rem scales, keywords). Infer confidently from the scraped data; do not hedge.

## Style Summary
2-3 sentences describing the overall aesthetic and mood (e.g. "playful editorial, tactile, floating decorative props on off-white paper").

## Design Tokens
- Palette (name each color role + hex)
- Typography (display / body / mono font families, weights, tracking, sample scale in rem)
- Spacing scale, border radius, shadow style
- Provide a ready-to-paste CSS \`:root\` block using semantic custom properties

## Layout & Composition
- purpose and exact placement in the page flow
- container width, padding, and vertical spacing
- alignment strategy (left/right/centered, max width, text block width)
- exact Tailwind or CSS class suggestions
- decorative rules (texture, floating accents, shadows, background shapes)
- sample content placeholders and tone guidance

## Motion & Interactions
- hover states, active states, and transition timings
- scroll animations or micro-interactions (e.g., springy buttons, fade-in on scroll)
- specific CSS timing functions (e.g., cubic-bezier curves) or Framer Motion properties

## Voice & Copy
Tone, capitalization, punchy vs verbose, example headlines from the site. Include sample CTA text, eyebrow copy, and short supporting paragraph patterns.

## Imagery & Decoration
Photography style, illustration/3D, decorative motifs (e.g. floating stickers, paperclips, grain textures). Include rules for image cropping, contrast, and how to layer decorative assets without clutter.

## Do / Don't
Bulleted list of rules to keep the style intact and things to avoid.

## Usage
A short paragraph telling the AI agent how to apply this skill. Explicitly say that when the user asks for a landing page, this skill should be used to reproduce the same layout, visual hierarchy, spacing, and component style rather than creating a generic modern page.

Important style rules:
- Be concrete and opinionated; do not use vague adjectives without specifics.
- Favor exact values (px/rem, hex codes, weights, rounded corners, shadows, class names).
- Make this feel like a build spec for a real implementation, not a loose design summary.
- If the site is marketing-oriented, prioritize landing-page reproduction and section-by-section implementation detail.

Depth requirements (non-negotiable — thin output is a failure):
- Target 300-500 lines; never fewer than 200.
- Palette: list every color you can extract (aim for 8-14), each as "role: #hex — where it is used".
- The :root block must define at least 12 semantic custom properties (colors, fonts, radii, shadows, spacing).
- Layout & Composition: walk the homepage top to bottom and document EVERY section in the order it appears (nav, hero, features, proof, CTA, footer, ...), each under its own sub-heading with exact specs — an agent must be able to rebuild the page section by section from this alone.
- Voice & Copy: quote at least 5 real headlines / CTA labels verbatim from the scraped content.
- Never write "varies", "unknown", or "it depends" — if a value is not directly visible, infer a specific plausible value and state it confidently.
- Acid test: an agent given ONLY this file and the prompt "build a landing page" must produce a page that looks unmistakably like ${siteName}. Every decision it needs must be answered here.`;

    const skillMarkdown = await generateWithRetry(prompt);

    return {
      url,
      title: metadata.title || metadata["og:title"] || siteName,
      description: metadata.description || "",
      screenshot,
      branding,
      pagesScanned: 1 + secondaryMarkdowns.length,
      skillMarkdown,
    };
  });
