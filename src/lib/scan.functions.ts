import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Simple in-memory cooldowns to prevent repeated immediate calls after a 429.
const apiCooldowns = new Map<string, number>();

// Simple in-memory concurrency limiter and cache to avoid bursts during rapid testing.
const maxConcurrent = 2;
let currentConcurrent = 0;
const pendingQueue: Array<() => void> = [];

function acquireSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (currentConcurrent < maxConcurrent) {
        currentConcurrent++;
        resolve(() => {
          currentConcurrent--;
          // flush next
          const next = pendingQueue.shift();
          if (next) next();
        });
      } else {
        pendingQueue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

// Very small in-memory cache keyed by URL for dev/testing (10 minute TTL)
const scanCache = new Map<string, { expires: number; result: unknown }>();

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

function buildFallbackSkillMarkdown(args: {
  siteName: string;
  url: string;
  branding: BrandingPayload | null;
  metadata: Record<string, string>;
  primaryMarkdown: string;
  secondaryMarkdowns: Array<{ url: string; markdown: string }>;
}): string {
  const slug = slugFromUrl(args.url);
  const palette = args.branding?.colors
    ? Object.entries(args.branding.colors)
        .slice(0, 6)
        .map(([name, value]) => `- ${name}: ${value}`)
        .join("\n")
    : "- background: #FAF7EE\n- foreground: #111111\n- accent: #5B6CFF";
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

## Typography
- Display: Inter, SemiBold, 3rem / 48px, tracking -0.02em.
- Heading: Inter, Medium, 2rem / 32px, strong visual hierarchy.
- Body: Inter, Regular, 1rem / 16px, line-height 1.6.
- Accent labels: uppercase, 0.08em letter-spacing, muted tone.

## Spacing & Layout
- Page max-width: 1200px.
- Section top/bottom padding: 5rem (80px) for hero, 4rem (64px) for major sections, 3rem (48px) for supporting sections.
- Content container padding: 1.5rem (24px) horizontal on mobile, 4rem (64px) on desktop.
- Card gutter: 1.5rem (24px).
- Border radius: 24px for cards, 9999px for pills and badges.
- Shadow: 0 24px 80px rgba(17, 17, 17, 0.08) for elevated panels.

## Page Build Plan
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

## Component Rules
- Primary button: accent background, white text, medium weight, 16px vertical padding, 32px horizontal padding, radius 9999px.
- Secondary button: transparent background, 1px accent border, accent text, same padding and radius.
- Card: white or soft neutral background, rounded corners, subtle shadow, 24px internal padding.
- Section headings: strong weight, 36-48px display size, tight line-height.
- Body text: 16px, 1.6 line-height, balanced margins.
- Text blocks: limit width to 55-70 characters for paragraphs.

## Voice & Copy
- Tone: confident, polished, modern, and approachable.
- Headline style: short, declarative, value-driven.
- CTA examples: "Start building", "Explore the product", "See it in action".
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

export const scanSite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScanInput.parse(input))
  .handler(async ({ data }): Promise<ScanResult> => {
    const url = normalizeUrl(data.url);
    const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? process.env.VITE_FIRECRAWL_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY ?? process.env.VITE_OPENROUTER_API_KEY;
    if (!firecrawlKey)
      throw new Error("Firecrawl is not connected. Set FIRECRAWL_API_KEY in your environment.");
    if (!openRouterKey) {
      console.warn(
        "OpenRouter key is not configured; the built-in fallback skill template will be used.",
      );
    }

    const { default: Firecrawl } = await import("@mendable/firecrawl-js");
    const firecrawl = new Firecrawl({ apiKey: firecrawlKey });

    // 1) Primary scrape: branding + markdown + screenshot + links
    const primary = (await firecrawl.scrape(url, {
      formats: ["markdown", "screenshot", "links", "branding"],
      onlyMainContent: false,
    })) as Record<string, unknown>;

    const primaryMarkdown =
      (primary.markdown as string | undefined) ??
      (primary.data as { markdown?: string } | undefined)?.markdown ??
      "";
    const screenshot =
      (primary.screenshot as string | undefined) ??
      (primary.data as { screenshot?: string } | undefined)?.screenshot ??
      null;
    const branding =
      (primary.branding as BrandingPayload | undefined) ??
      (primary.data as { branding?: BrandingPayload } | undefined)?.branding ??
      null;
    const metadata =
      (primary.metadata as Record<string, string> | undefined) ??
      (primary.data as { metadata?: Record<string, string> } | undefined)?.metadata ??
      {};
    const links: string[] =
      (primary.links as string[] | undefined) ??
      (primary.data as { links?: string[] } | undefined)?.links ??
      [];

    // 2) Pick a small set of same-origin secondary pages (up to 6) for richer coverage
    let origin = "";
    try {
      origin = new URL(url).origin;
    } catch {
      // ignore
    }
    const secondaryUrls = Array.from(
      new Set(
        links
          .filter((l): l is string => typeof l === "string" && l.startsWith(origin) && l !== url)
          .map((l) => l.split("#")[0])
          .filter((l) => !/\.(png|jpe?g|gif|svg|webp|pdf|zip|mp4|css|js)(\?|$)/i.test(l)),
      ),
    ).slice(0, 6);

    const secondaryMarkdowns: Array<{ url: string; markdown: string }> = [];
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

    // 3) Ask OpenRouter to synthesize a SKILL.md
    const { createOpenRouterGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");

    const gateway = createOpenRouterGatewayProvider(openRouterKey as string);
    const model = gateway(process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash");

    async function generateWithRetry(prompt: string) {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await generateText({
            model,
            prompt,
            maxOutputTokens: 1400,
            temperature: 0.2,
          });
          return res.text;
        } catch (err: unknown) {
          console.error("generateText error:", err);
          const msg = String((err as { message?: string })?.message ?? err);
          const is429 = /too many requests|rate limit|429|rateLimit/i.test(msg);

          if (shouldUseFallback(err)) {
            console.warn("OpenRouter unavailable, using built-in fallback skill template.");
            return buildFallbackSkillMarkdown({
              siteName,
              url,
              branding,
              metadata,
              primaryMarkdown,
              secondaryMarkdowns,
            });
          }

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

          if (!is429 || attempt === maxAttempts) {
            throw err;
          }

          try {
            if (retryAfterSec) {
              apiCooldowns.set(openRouterKey as string, Date.now() + retryAfterSec * 1000);
            }
          } catch (e) {
            console.error("Failed to set cooldown", e);
          }

          const baseDelay = 500;
          const expo = Math.pow(2, attempt - 1);
          const jitter = Math.floor(Math.random() * 300);
          const delayMs = Math.max(baseDelay * expo + jitter, (retryAfterSec ?? 0) * 1000);
          console.warn(
            `AI call attempt ${attempt} failed with 429/rate-limit — retrying in ${delayMs}ms`,
          );
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      throw new Error("generateWithRetry: exhausted attempts");
    }

    // if we recently saw a Retry-After for this api key, fail fast with guidance
    const cooldownUntil = apiCooldowns.get(openRouterKey as string);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const sec = Math.ceil((cooldownUntil - Date.now()) / 1000);
      throw new Error(`AI_RATE_LIMIT: Retry after ${sec}s`);
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

2-3 sentences describing the overall aesthetic and mood (e.g. "playful editorial, tactile, floating decorative props on off-white paper").

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

Keep the whole file under ~500 lines.`;

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
