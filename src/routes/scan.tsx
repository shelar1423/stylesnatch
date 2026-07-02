import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type RefObject, useMemo } from "react";
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
  Grid3X3,
  Zap,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  Paintbrush,
  Camera,
  Github,
  Linkedin,
  Mail,
  Instagram,
} from "lucide-react";

import { scanSite, type ScanResult } from "@/lib/scan.functions";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      url: (search.url as string) || "",
    };
  },
});

function ScanPage() {
  const { url } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
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
    if (url && !result && !isScanning && !isCooling) {
      mutation.mutate(url);
    }
  }, [url]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <PaperTexture />
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-4 z-30 mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full border border-border/70 bg-card/80 px-5 py-2.5 shadow-[0_1px_0_oklch(1_0_0_/_0.6)_inset,0_10px_30px_-15px_oklch(0.2_0.02_60_/_0.15)] backdrop-blur-md sm:px-6"
      >
        <button 
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
            <Wand2 className="h-4 w-4" />
          </div>
          <span className="font-display text-xl leading-none tracking-tight">
            Stylesnatch
          </span>
        </button>
      </motion.header>
      <main className="relative pt-12 pb-24">
        <AnimatePresence mode="wait">
          {isScanning || (!result && !isScanning) ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-auto max-w-6xl px-6 sm:px-8"
            >
              <ScanningState url={url} />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-6xl px-6 sm:px-8"
            >
              <ResultView result={result} innerRef={resultSectionRef} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

function PaperTexture() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden mix-blend-overlay">
      <svg
        className="absolute h-full w-full opacity-[0.2]"
        xmlns="http://www.w3.org/200.svg"
      >
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
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


const SCAN_STEPS = [
  "Firing up headless browser…",
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

/* ---------------- Powered By ---------------- */

function PoweredBy() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative mt-32 overflow-hidden rounded-[2rem] border border-border/40 bg-gradient-to-b from-card/80 to-background p-10 text-center shadow-2xl shadow-black/5 sm:p-16 backdrop-blur"
    >
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-full max-w-md rounded-full bg-accent/15 blur-3xl" />
      
      <h2 className="relative font-display text-[clamp(2rem,5vw,3rem)] leading-tight tracking-tight">
        Powered by the best. <br className="hidden sm:block" />
        <span className="font-sans font-medium italic text-accent">Yours to modify.</span>
      </h2>
      <p className="relative mx-auto mt-6 max-w-2xl text-muted-foreground text-sm sm:text-base leading-relaxed">
        Stylesnatch uses <strong className="text-foreground">Firecrawl</strong> to deeply scan website structure, and <strong className="text-foreground">Gemini 2.5 Flash</strong> (via OpenRouter) to distill that data into an elegant design system. 
      </p>
      
      <div className="relative mt-10 flex flex-col items-center justify-center gap-5">
        <a
          href="https://github.com/shelar1423/stylesnatch#local-setup-instructions"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:scale-[1.02] hover:bg-foreground/90 shadow-lg shadow-foreground/10"
        >
          <Github className="h-4 w-4 transition-transform group-hover:rotate-12" />
          Set it up locally
        </a>
        <p className="text-xs text-muted-foreground/80 max-w-sm">
          100% open source. Clone the repo to use your own scraping service or a different LLM.
        </p>
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
            100% Open source. Built for prompt-engineers who love a good design system.
          </div>
          <div className="mt-6 flex items-center gap-4 text-muted-foreground">
            <a href="https://www.linkedin.com/in/digvijayshelar/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href="mailto:digvijayux@gmail.com" className="hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" />
              <span className="sr-only">Email</span>
            </a>
            <a href="https://instagram.com/digvijayux" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" />
              <span className="sr-only">Instagram</span>
            </a>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono text-muted-foreground">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <span>© 2026 Stylesnatch</span>
        </div>
      </div>
    </footer>
  );
}
