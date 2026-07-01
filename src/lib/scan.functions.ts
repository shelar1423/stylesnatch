import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ScanInput = z.object({
  url: z.string().url(),
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

export const scanSite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScanInput.parse(input))
  .handler(async ({ data }): Promise<ScanResult> => {
    const url = normalizeUrl(data.url);
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!firecrawlKey) throw new Error("Firecrawl is not connected.");
    if (!lovableKey) throw new Error("Lovable AI is not configured.");

    const { default: Firecrawl } = await import("@mendable/firecrawl-js");
    const firecrawl = new Firecrawl({ apiKey: firecrawlKey });

    // 1) Primary scrape: branding + markdown + screenshot + links
    const primary = (await firecrawl.scrape(url, {
      formats: ["markdown", "screenshot", "links", "branding"],
      onlyMainContent: false,
    })) as Record<string, unknown>;

    const primaryMarkdown =
      (primary.markdown as string | undefined) ??
      ((primary.data as { markdown?: string } | undefined)?.markdown ?? "");
    const screenshot =
      (primary.screenshot as string | undefined) ??
      ((primary.data as { screenshot?: string } | undefined)?.screenshot ?? null);
    const branding =
      ((primary.branding as BrandingPayload | undefined) ??
        (primary.data as { branding?: BrandingPayload } | undefined)?.branding) ??
      null;
    const metadata =
      (primary.metadata as Record<string, string> | undefined) ??
      (primary.data as { metadata?: Record<string, string> } | undefined)?.metadata ??
      {};
    const links: string[] =
      (primary.links as string[] | undefined) ??
      ((primary.data as { links?: string[] } | undefined)?.links ?? []);

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

    // 3) Ask Gemini to synthesize a SKILL.md
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");

    const gateway = createLovableAiGatewayProvider(lovableKey);
    const model = gateway("google/gemini-3-flash-preview");

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

## Overview
2-3 sentences describing the overall aesthetic and mood (e.g. "playful editorial, tactile, floating decorative props on off-white paper").

## Design Tokens
- Palette (name each color role + hex)
- Typography (display / body / mono font families, weights, tracking, sample scale in rem)
- Spacing scale, border radius, shadow style
- Provide a ready-to-paste CSS \`:root\` block using semantic custom properties

## Layout & Composition
How pages are structured, grid density, whitespace ratio, alignment habits, hero pattern, nav pattern, footer pattern.

## Components
Signature components (buttons, cards, inputs, badges) with concrete Tailwind class recipes.

## Motion & Interaction
How things animate/hover, easing/duration guidance.

## Voice & Copy
Tone, capitalization, punchy vs verbose, example headlines from the site.

## Imagery & Decoration
Photography style, illustration/3D, decorative motifs (e.g. floating stickers, paperclips, grain textures).

## Do / Don't
Bulleted list of rules to keep the style intact and things to avoid.

## Usage
A short paragraph telling the AI agent how to apply this skill (e.g. "When user says X, use these tokens and this hero pattern").

Keep the whole file under ~350 lines. Be specific and opinionated.`;

    const { text } = await generateText({
      model,
      prompt,
    });

    return {
      url,
      title: siteName,
      description: metadata.description ?? metadata["og:description"] ?? "",
      screenshot: screenshot ?? null,
      branding,
      pagesScanned: 1 + secondaryMarkdowns.length,
      skillMarkdown: text.trim(),
    };
  });