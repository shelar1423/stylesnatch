import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  ArrowRight,
  Copy,
  Download,
  Loader2,
  Sparkles,
  Wand2,
  FileCode2,
  Palette,
  Type,
  Check,
} from "lucide-react";

import { scanSite, type ScanResult } from "@/lib/scan.functions";
import { Toaster } from "@/components/ui/sonner";

import decoClip from "@/assets/deco-clip.png";
import decoPaperclip from "@/assets/deco-paperclip.png";
import decoPaper from "@/assets/deco-paper.png";
import decoChip from "@/assets/deco-chip.png";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const resultSectionRef = useRef<HTMLDivElement | null>(null);
  const scan = useServerFn(scanSite);

  const mutation = useMutation({
    mutationFn: async (input: string) => scan({ data: { url: input } }),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Something went wrong";
      // Detect our server-side cooldown marker
      const match = message.match(/AI_RATE_LIMIT: Retry after (\d+)s/i);
      const friendly = match
        ? `Rate limit reached — try again in ${match[1]}s or check your OPENROUTER_API_KEY/quota.`
        : /too many requests|rate limit|429/i.test(message)
        ? "Rate limit reached from the AI provider (Too Many Requests). Try again in a minute or check your OPENROUTER_API_KEY/quota."
        : message;
      toast.error("Scan failed", { description: friendly });
      if (match) {
        const sec = Number(match[1]);
        const until = Date.now() + sec * 1000;
        setCooldownUntil(until);
        setTimeout(() => setCooldownUntil(null), sec * 1000 + 500);
      }
    },
  });

  const isScanning = mutation.isPending;
  const isCooling = !!(cooldownUntil && Date.now() < cooldownUntil);

  useEffect(() => {
    if (!result) return;
    const id = window.setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
    return () => window.clearTimeout(id);
  }, [result]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Give me a URL", { description: "Paste any website URL to scan its style." });
      return;
    }
    setResult(null);
    mutation.mutate(url.trim());
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <PaperTexture />
      <Nav />
      <main className="relative mx-auto max-w-6xl px-6 pt-24 pb-40 sm:px-8">
        <Hero
          url={url}
          setUrl={setUrl}
          onSubmit={submit}
          isScanning={isScanning}
          isCooling={isCooling}
          cooldownUntil={cooldownUntil}
        />
        <AnimatePresence mode="wait">
          {isScanning ? (
            <ScanningState key="scanning" url={url} />
          ) : result ? (
            <ResultView key="result" result={result} innerRef={resultSectionRef} />
          ) : (
            <HowItWorks key="how" />
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- Paper texture backdrop ---------------- */

function PaperTexture() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.55 0.02 70 / 0.15) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.5] mix-blend-multiply"
        style={{
          background:
            "radial-gradient(80% 60% at 20% 10%, oklch(0.99 0.02 70 / 0.7), transparent 70%), radial-gradient(60% 50% at 90% 90%, oklch(0.92 0.05 60 / 0.5), transparent 70%)",
        }}
      />
    </div>
  );
}

/* ---------------- Nav ---------------- */

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (!element) return;

  const headerOffset = 96;
  const elementPosition = element.getBoundingClientRect().top + window.scrollY - headerOffset;

  window.scrollTo({ top: elementPosition, behavior: "smooth" });
  window.history.replaceState(null, "", `#${id}`);
}

function Nav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-4 z-30 mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full border border-border/70 bg-card/80 px-5 py-2.5 shadow-[0_1px_0_oklch(1_0_0_/_0.6)_inset,0_10px_30px_-15px_oklch(0.2_0.02_60_/_0.15)] backdrop-blur-md sm:px-6"
    >
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
          <Wand2 className="h-4 w-4" />
        </div>
        <span className="font-display text-xl leading-none tracking-tight">
          Stylesnatch
        </span>
      </div>
      <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
        <a
          href="#how"
          onClick={(event) => {
            event.preventDefault();
            scrollToSection("how");
          }}
          className="hover:text-foreground"
        >
          How it works
        </a>
        <a
          href="#example"
          onClick={(event) => {
            event.preventDefault();
            scrollToSection("example");
          }}
          className="hover:text-foreground"
        >
          Example
        </a>
        <a
          href="https://docs.anthropic.com/en/docs/claude-code/skills"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground"
        >
          Skills 101
        </a>
      </nav>
      <a
        href="#scan"
        onClick={(event) => {
          event.preventDefault();
          scrollToSection("scan");
        }}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
      >
        Scan a site
      </a>
    </motion.header>
  );
}

/* ---------------- Hero ---------------- */

function Hero({
  url,
  setUrl,
  onSubmit,
  isScanning,
  isCooling,
  cooldownUntil,
}: {
  url: string;
  setUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isScanning: boolean;
  isCooling?: boolean;
  cooldownUntil?: number | null;
}) {
  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;
  return (
    <section id="scan" className="relative scroll-mt-24 pt-14 pb-8 sm:pt-24">
      <FloatingDecor />

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        style={{ display: "flex" }}
      >
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        Turn any website into an AI-agent skill
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-4xl text-center font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.9] tracking-tight"
      >
        Steal like an{" "}
        <span className="relative inline-block italic">
          Artist
          <svg
            aria-hidden
            viewBox="0 0 300 20"
            className="absolute -bottom-2 left-0 h-3 w-full text-accent"
            preserveAspectRatio="none"
          >
            <path
              d="M2 12 C 80 2, 200 22, 298 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
        .
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg"
      >
        Paste a URL. We scan the colors, type, spacing and vibe, then hand you a
        portable <span className="font-mono text-foreground">SKILL.md</span> your
        AI agent can load — Claude Code, Codex, Cursor, whoever.
      </motion.p>

        <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        onSubmit={onSubmit}
        className="relative mx-auto mt-10 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border/80 bg-card/90 p-2 shadow-[0_1px_0_oklch(1_0_0_/_0.7)_inset,0_20px_50px_-25px_oklch(0.2_0.02_60_/_0.35)] backdrop-blur"
      >
        <div className="pl-3 pr-1 text-muted-foreground">
          <span className="font-mono text-sm">https://</span>
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="linear.app"
          disabled={isScanning || !!isCooling}
          className="min-w-0 flex-1 bg-transparent py-3 pr-2 font-mono text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60"
          aria-label="Website URL"
        />
        <button
          type="submit"
          disabled={isScanning || !!isCooling}
          className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 sm:px-5"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              Snatch style
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </motion.form>

      {isCooling ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mx-auto mt-3 text-center text-sm text-muted-foreground"
        >
          Rate limit active — try again in {cooldownRemaining}s
        </motion.p>
      ) : null}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mx-auto mt-4 text-center text-xs text-muted-foreground"
      >
        Try{" "}
        {["linear.app", "stripe.com", "vercel.com", "acctual.com"].map((s, i, arr) => (
          <button
            key={s}
            type="button"
            onClick={() => setUrl(s)}
            className="font-mono underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            {s}
            {i < arr.length - 1 ? <span className="mx-1.5 text-muted-foreground/50">·</span> : null}
          </button>
        ))}
      </motion.p>
    </section>
  );
}

/* ---------------- Floating decor ---------------- */

function FloatingDecor() {
  const items = useMemo(
    () => [
      { src: decoClip, alt: "", className: "left-[-40px] top-[10px] w-28 sm:w-32 -rotate-12", delay: 0 },
      { src: decoPaper, alt: "", className: "right-[-30px] top-[40px] w-28 sm:w-36 rotate-6", delay: 0.15 },
      { src: decoChip, alt: "", className: "left-[8%] bottom-[-30px] w-16 sm:w-20 -rotate-6", delay: 0.3 },
      { src: decoPaperclip, alt: "", className: "right-[10%] bottom-[-10px] w-16 sm:w-20 rotate-12", delay: 0.45 },
    ],
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {items.map((it, i) => (
        <motion.img
          key={i}
          src={it.src}
          alt={it.alt}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 + it.delay, duration: 0.8, ease: "easeOut" }}
          className={`absolute drop-shadow-[0_12px_18px_oklch(0.2_0.02_60_/_0.18)] ${it.className}`}
          style={{ willChange: "transform" }}
        />
      ))}
    </div>
  );
}

/* ---------------- How it works ---------------- */

const STEPS = [
  {
    icon: Palette,
    title: "Scan",
    body: "We crawl the site, pull the palette, typography, spacing, components and screenshots.",
  },
  {
    icon: Type,
    title: "Distill",
    body: "AI turns the raw signal into concrete design tokens and copy-pasteable rules.",
  },
  {
    icon: FileCode2,
    title: "Ship",
    body: "You get a SKILL.md — drop it into Claude, Codex or Cursor as a portable style skill.",
  },
];

function HowItWorks() {
  return (
    <motion.section
      id="how"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-24 scroll-mt-24"
    >
      <div className="mb-10 flex items-end justify-between">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
          How it works
        </h2>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-muted-foreground sm:block">
          three steps
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 backdrop-blur transition-transform hover:-translate-y-1"
            >
              <div className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                <Icon className="h-4 w-4" />
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Step {i + 1}
              </div>
              <h3 className="mt-1 font-display text-3xl tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div id="example" className="mt-16 scroll-mt-24 rounded-2xl border border-border/70 bg-card/70 p-8 backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <FileCode2 className="h-3.5 w-3.5" />
          example output
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[13px] leading-6 text-foreground/80">
{`---
name: linear-style
description: Replicates the visual style of linear.app...
---

## Design Tokens
- Palette: ink #08090A, paper #F7F8F8, accent #5E6AD2
- Typography: "Inter Display" 600 / -0.02em tracking
- Radius: 8px, subtle 1px border, no shadows

## Motion & Interaction
Hairline transitions (150ms ease-out), never bouncy.`}
        </pre>
      </div>
    </motion.section>
  );
}

/* ---------------- Scanning state ---------------- */

const SCAN_STEPS = [
  "Fetching the homepage…",
  "Reading colors, type & spacing…",
  "Crawling a few more pages…",
  "Distilling into a SKILL.md…",
];

function ScanningState({ url }: { url: string }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, []);

  const progress = ((currentStep + 1) / SCAN_STEPS.length) * 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="mt-20"
    >
      <div className="mx-auto max-w-2xl rounded-3xl border border-border/70 bg-card/90 p-8 backdrop-blur shadow-[0_30px_80px_-40px_oklch(0.2_0.02_60_/_0.4)]">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-foreground/20 border-t-foreground"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
            />
            <div className="absolute inset-2 rounded-full bg-accent" />
          </div>
          <div>
            <div className="font-display text-xl leading-tight">Snatching…</div>
            <div className="font-mono text-xs text-muted-foreground truncate max-w-[240px] sm:max-w-none">
              {url}
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-border/60 bg-background/60 p-4">
          <div className="flex items-center justify-between text-sm text-foreground/80">
            <span className="font-medium">Scan state</span>
            <span className="font-mono text-xs text-muted-foreground">
              {SCAN_STEPS[currentStep]}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Preparing the scan</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {SCAN_STEPS.map((label, i) => {
            const isActive = i === currentStep;
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2, duration: 0.3 }}
                className={`flex items-center gap-3 text-sm ${isActive ? "text-foreground" : "text-foreground/70"}`}
              >
                <motion.span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? "bg-accent" : "bg-foreground/30"}`}
                  animate={{ scale: isActive ? [1, 1.6, 1] : 1, opacity: isActive ? [0.6, 1, 0.6] : 1 }}
                  transition={{ repeat: isActive ? Infinity : 0, duration: 1.4, delay: i * 0.1 }}
                />
                {label}
              </motion.li>
            );
          })}
        </ul>
        <p className="mt-8 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          Full site scans take ~20–40 seconds. Grab a coffee.
        </p>
      </div>
    </motion.section>
  );
}

/* ---------------- Result view ---------------- */

function ResultView({ result, innerRef }: { result: ScanResult; innerRef: RefObject<HTMLDivElement | null> }) {
  const [copied, setCopied] = useState(false);
  const filename = useMemo(() => {
    try {
      const host = new URL(result.url).hostname.replace(/^www\./, "");
      return `${host.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-style.SKILL.md`;
    } catch {
      return "site-style.SKILL.md";
    }
  }, [result.url]);

  const copy = async () => {
    await navigator.clipboard.writeText(result.skillMarkdown);
    setCopied(true);
    toast.success("Copied SKILL.md to clipboard");
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob([result.skillMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colors = result.branding?.colors ?? {};
  const fonts = result.branding?.fonts ?? [];

  return (
    <motion.section
      ref={innerRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="mt-20"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            snatched from
          </div>
          <h2 className="mt-1 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {result.title}
          </h2>
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block font-mono text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            {result.url}
          </a>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:scale-[1.02]"
          >
            <Download className="h-4 w-4" />
            Download SKILL.md
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: preview cards */}
        <div className="space-y-4 lg:col-span-2">
          {result.screenshot ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_20px_50px_-25px_oklch(0.2_0.02_60_/_0.35)]">
              <img
                src={result.screenshot}
                alt={`${result.title} screenshot`}
                className="h-64 w-full object-cover object-top"
                loading="lazy"
              />
            </div>
          ) : null}

          {Object.keys(colors).length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                <Palette className="h-3.5 w-3.5" /> Palette
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(colors)
                  .slice(0, 9)
                  .map(([name, hex]) => (
                    <div key={name} className="overflow-hidden rounded-lg border border-border/60">
                      <div className="h-12 w-full" style={{ backgroundColor: hex as string }} />
                      <div className="px-2 py-1.5">
                        <div className="truncate text-[10px] font-medium">{name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {hex as string}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {fonts.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                <Type className="h-3.5 w-3.5" /> Typography
              </div>
              <ul className="space-y-1.5">
                {fonts.slice(0, 5).map((f, i) => (
                  <li key={i} className="font-mono text-sm">
                    {f.family ?? "—"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <FileCode2 className="h-3.5 w-3.5" /> Scan info
            </div>
            <div className="text-sm text-muted-foreground">
              {result.pagesScanned} page{result.pagesScanned === 1 ? "" : "s"} scanned
            </div>
          </div>
        </div>

        {/* Right: SKILL.md preview */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-[0_20px_50px_-25px_oklch(0.2_0.02_60_/_0.35)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                {filename}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                markdown preview
              </span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <article className="prose-style">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.skillMarkdown}
                </ReactMarkdown>
              </article>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Drop this into your agent&apos;s skills folder (Claude Code, Codex,
            Cursor rules, etc.) and reference it whenever you want output that
            looks like <span className="font-mono">{result.title}</span>.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-6 pb-12 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-6 border-t border-border/60 pt-8 sm:flex-row sm:items-end">
        <div>
          <div className="font-display text-3xl tracking-tight">
            Snatch. Distill. Ship.
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Built for prompt-engineers who love a good design system.
          </div>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} Stylesnatch
        </div>
      </div>
    </footer>
  );
}
