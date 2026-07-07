import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  assertScannableUrl,
  isTransientScrapeError,
  friendlyScrapeError,
  sanitizeSkillMarkdown,
  slugFromUrl,
  selectSecondaryUrls,
  brandingIsRich,
  skillQualityIssues,
} from "./scan.functions";

describe("normalizeUrl", () => {
  it("adds https:// when missing", () => {
    expect(normalizeUrl("stripe.com")).toBe("https://stripe.com");
    expect(normalizeUrl("  linear.app ")).toBe("https://linear.app");
  });
  it("keeps an existing scheme", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });
});

describe("assertScannableUrl", () => {
  it("accepts real hostnames", () => {
    expect(() => assertScannableUrl("https://stripe.com")).not.toThrow();
    expect(() => assertScannableUrl("https://app.vercel.com/dashboard")).not.toThrow();
  });
  it("rejects hostnames without a dot", () => {
    expect(() => assertScannableUrl("https://not_a_real_url")).toThrow(/reachable/i);
    expect(() => assertScannableUrl("https://localhost")).toThrow(/reachable/i);
  });
  it("rejects non-http protocols", () => {
    expect(() => assertScannableUrl("ftp://example.com")).toThrow(/http/i);
    expect(() => assertScannableUrl("javascript:alert(1)")).toThrow();
  });
});

describe("isTransientScrapeError", () => {
  it("flags rate limits, timeouts and 5xx", () => {
    expect(isTransientScrapeError(new Error("429 Too Many Requests"))).toBe(true);
    expect(isTransientScrapeError(new Error("request timed out"))).toBe(true);
    expect(isTransientScrapeError(new Error("503 Service Unavailable"))).toBe(true);
    expect(isTransientScrapeError(new Error("ECONNRESET"))).toBe(true);
  });
  it("does not flag permanent failures", () => {
    expect(isTransientScrapeError(new Error("402 payment required"))).toBe(false);
    expect(isTransientScrapeError(new Error("404 not found"))).toBe(false);
    // A status like 402 must not match the 5xx range.
    expect(isTransientScrapeError(new Error("code 402"))).toBe(false);
  });
});

describe("friendlyScrapeError", () => {
  it("maps known failures to actionable messages", () => {
    expect(
      friendlyScrapeError("https://x.com", new Error("402 insufficient credits")).message,
    ).toMatch(/Firecrawl credits/i);
    expect(friendlyScrapeError("https://x.com", new Error("403 forbidden")).message).toMatch(
      /blocks automated scraping/i,
    );
    expect(friendlyScrapeError("https://x.com", new Error("404 not found")).message).toMatch(
      /doesn't seem to exist/i,
    );
  });
});

describe("sanitizeSkillMarkdown", () => {
  it("strips a wrapping code fence", () => {
    const wrapped = "```markdown\n---\nname: x\n---\n\n# Hi\n```";
    expect(sanitizeSkillMarkdown(wrapped)).toBe("---\nname: x\n---\n\n# Hi");
  });
  it("drops leading preamble before frontmatter", () => {
    const withPreamble = "Here is your file:\n\n---\nname: x\n---\n\n# Hi";
    expect(sanitizeSkillMarkdown(withPreamble).startsWith("---\n")).toBe(true);
  });
  it("leaves clean markdown untouched", () => {
    const clean = "---\nname: x\n---\n\n# Hi";
    expect(sanitizeSkillMarkdown(clean)).toBe(clean);
  });
});

describe("slugFromUrl", () => {
  it("derives a slug from the hostname", () => {
    expect(slugFromUrl("https://www.linear.app/features")).toBe("linear-app");
    expect(slugFromUrl("https://sub.example.co.uk")).toBe("sub-example-co-uk");
  });
});

describe("selectSecondaryUrls", () => {
  const base = "https://acme.com";
  const links = [
    "https://acme.com/login",
    "https://acme.com/privacy",
    "https://acme.com/careers",
    "https://acme.com/blog/2023/deep-post",
    "https://acme.com/pricing",
    "https://acme.com/about",
    "https://acme.com/features#top",
    "https://acme.com/features",
    "https://other.com/pricing",
    "https://acme.com/logo.svg",
    "https://acme.com/contact",
  ];

  it("prioritizes value pages, drops junk/cross-origin/assets, dedupes hashes", () => {
    const picked = selectSecondaryUrls(base, links, 3);
    expect(picked).toEqual([
      "https://acme.com/pricing",
      "https://acme.com/about",
      "https://acme.com/features",
    ]);
  });
  it("respects the max cap", () => {
    expect(selectSecondaryUrls(base, links, 2)).toHaveLength(2);
    expect(selectSecondaryUrls(base, links, 0)).toEqual([]);
  });
});

describe("brandingIsRich", () => {
  const rich = {
    colors: { a: "#111", b: "#222", c: "#333", d: "#444" },
    fonts: [{ family: "Inter" }],
  };
  it("is true only with enough colors, fonts, and markdown", () => {
    expect(brandingIsRich(rich, "x".repeat(7000))).toBe(true);
    expect(brandingIsRich(rich, "x".repeat(3000))).toBe(false);
    expect(brandingIsRich({ colors: { a: "#111" }, fonts: [] }, "x".repeat(7000))).toBe(false);
    expect(brandingIsRich(null, "x".repeat(7000))).toBe(false);
  });
});

describe("skillQualityIssues", () => {
  it("passes a rich, complete file", () => {
    const good =
      "---\nname: x-style\n---\n\n" +
      "## Layout\n## Motion\n## Voice\n## Do\n## Usage\n" +
      ":root { --a: #111111; }\n" +
      "#aabbcc #ddeeff #123456 #654321 #0a7159\n" +
      "x".repeat(5000);
    expect(skillQualityIssues(good)).toEqual([]);
  });
  it("flags a thin file", () => {
    const issues = skillQualityIssues("too short");
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.join(" ")).toMatch(/too short/i);
  });
});
