import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  FileCode2,
  Palette,
  Type,
  Grid3X3,
  Zap,
  ChevronRight,
  Linkedin,
  Mail,
  Instagram,
  Github,
  Loader2,
  Paintbrush,
  Globe,
  FileText,
  Camera,
} from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/Nav";

export const Route = createFileRoute("/")({
  component: Index,
});

export function Index() {
  const [url, setUrl] = useState("");
  const navigate = useNavigate({ from: Route.fullPath });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Give me a URL", { description: "Paste any website URL to scan its style." });
      return;
    }
    navigate({ to: "/scan", search: { url: url.trim() } });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <PaperTexture />
      <Nav />
      <main className="relative">
        <div className="mx-auto max-w-6xl px-6 pt-12 sm:px-8">
          <Hero
            url={url}
            setUrl={setUrl}
            onSubmit={submit}
            isScanning={false}
          />
        </div>
        <div key="landing-sections">
          <Marquee />
          <div className="mx-auto max-w-6xl px-6 pb-24 sm:px-8">
            <HowItWorks />
            <StealDivider />
            <WhatWeCapture />
            <PoweredBy />
          </div>
        </div>
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
    <section id="scan" className="relative scroll-mt-24 -mt-2 pb-6 sm:-mt-6">
      <FloatingDecor />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-3 flex max-w-md flex-col items-center gap-1.5 text-center"
      >
        <motion.a
          href="https://github.com/shelar1423/stylesnatch"
          target="_blank"
          rel="noopener noreferrer"
          animate={{ rotate: [-2, 2, -2, 2, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.4 }}
          whileHover={{ scale: 1.05, rotate: [-2, 2, -2, 2, 0], transition: { repeat: 0, duration: 0.3 } }}
          className="animated-pill inline-flex w-fit origin-bottom items-center gap-2 rounded-full border border-transparent bg-card/80 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur hover:text-foreground transition-colors"
        >
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Open Source</span>
          <span className="flex items-center gap-1.5">
            Star us on GitHub
            <ArrowRight className="h-3 w-3" />
          </span>
        </motion.a>
        <p className="text-[13px] leading-relaxed text-muted-foreground/80">
          Clone the repo to use your own scraping service or a different LLM.
        </p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-4xl text-center font-display text-[clamp(2.8rem,8vw,6rem)] leading-tight tracking-tight"
      >
        Turn any website into a{" "}
        <span className="relative inline-block font-sans font-medium italic text-accent">
          skill
          <svg
            aria-hidden
            viewBox="0 0 300 20"
            className="absolute -bottom-1 left-0 h-2.5 w-full text-accent/40"
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
        </span>{" "}
        your AI can wear.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mx-auto mt-3 max-w-xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg"
      >
        Paste a URL. We extract its typography, color, spacing,
        components and motion — then hand you a markdown
        file your agent can read to design in that style.
      </motion.p>

        <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        onSubmit={onSubmit}
        className="relative mx-auto mt-4 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border/80 bg-card/90 p-2 shadow-[0_1px_0_oklch(1_0_0_/_0.7)_inset,0_20px_50px_-25px_oklch(0.2_0.02_60_/_0.35)] backdrop-blur"
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
              Scan style
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
        {["linear.app", "stripe.com", "vercel.com", "framer.com"].map((s, i, arr) => (
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

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mx-auto mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          No signup needed
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-accent" />
          Powered by Gemini 2.5 Flash
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          20-40s per scan
        </span>
      </motion.div>
    </section>
  );
}

/* ---------------- Floating decoration cards ---------------- */

function FloatingElement({
  className,
  style,
  delay,
  rotate = 0,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  delay: number;
  rotate?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9, rotate }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      className="absolute"
      style={style}
    >
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 4 + (delay % 2), ease: "easeInOut", delay: delay + 0.8 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className={`pointer-events-auto ${className || ""}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function FloatingDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {/* Left side elements */}
      <FloatingElement delay={0.3} rotate={-15} className="deco-card-icon" style={{ left: '-12%', top: '5%' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'oklch(0.5 0.02 260)' }}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </FloatingElement>

      <FloatingElement delay={0.45} rotate={10} className="deco-card-icon" style={{ left: '-18%', top: '28%' }}>
        <Grid3X3 className="h-5 w-5" style={{ color: 'oklch(0.4 0.02 260)' }} />
      </FloatingElement>

      <FloatingElement delay={0.6} rotate={-6} className="deco-card" style={{ left: '-10%', top: '52%' }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 12 C 4 12, 10 2, 12 2" stroke="oklch(0.5 0.15 170)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: '11px' }}>easing · cubic-bezier</span>
        </div>
      </FloatingElement>

      <FloatingElement delay={0.65} rotate={-5} className="deco-card-icon flex items-center justify-center" style={{ left: '-15%', top: '75%', width: '40px', height: '40px' }}>
        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#E5484D' }} />
      </FloatingElement>

      <FloatingElement delay={0.7} rotate={8} className="deco-card" style={{ left: '-5%', top: '95%' }}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md" style={{ backgroundColor: '#1a1a1a' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#999' }}>#1A1A1A</div>
            <div style={{ fontWeight: 600, fontSize: '11px' }}>ink</div>
          </div>
        </div>
      </FloatingElement>

      {/* Right side elements */}
      <FloatingElement delay={0.4} rotate={4} className="deco-card" style={{ right: '-12%', top: '10%' }}>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md" style={{ backgroundColor: '#5E6AD2' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#999' }}>#5E6AD2</div>
            <div style={{ fontWeight: 600, fontSize: '11px' }}>primary</div>
          </div>
        </div>
      </FloatingElement>

      <FloatingElement delay={0.5} rotate={-10} className="deco-card-icon" style={{ right: '-18%', top: '32%' }}>
        <Type className="h-5 w-5" style={{ color: 'oklch(0.3 0.01 60)' }} />
      </FloatingElement>

      <FloatingElement delay={0.5} rotate={15} className="deco-card-icon flex items-center justify-center" style={{ right: '-10%', top: '55%', width: '36px', height: '36px' }}>
        <Zap className="h-4 w-4" style={{ color: 'oklch(0.55 0.12 270)' }} />
      </FloatingElement>

      <FloatingElement delay={0.55} rotate={-4} className="deco-card" style={{ right: '-15%', top: '78%' }}>
        <span style={{ fontSize: '11px' }}>Card · radius 16</span>
      </FloatingElement>

      <FloatingElement delay={0.75} rotate={5} className="deco-card-icon flex items-center justify-center" style={{ right: '-5%', top: '98%', width: '44px', height: '44px' }}>
        <Sparkles className="h-5 w-5" style={{ color: '#E5A100' }} />
      </FloatingElement>
    </div>
  );
}

/* ---------------- Marquee of compatible agents ---------------- */

const MARQUEE_AGENTS = ["OpenAI Codex", "Claude Code", "Cursor", "GitHub Copilot", "Gemini CLI", "Google Antigravity", "Windsurf", "Roo Code"];

function Marquee() {
  const doubled = [...MARQUEE_AGENTS, ...MARQUEE_AGENTS];
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-16 overflow-hidden border-t border-b border-border/50 py-8"
    >
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Works beautifully with
      </p>
      <div className="relative overflow-hidden">
        <div className="marquee-track gap-14">
          {doubled.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="text-xl font-bold tracking-tight text-muted-foreground/40 sm:text-2xl"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ---------------- How it works ---------------- */

const STEPS = [
  {
    num: "01",
    title: "Paste a URL",
    body: "Any public site. We handle the rest.",
    hasArrow: true,
  },
  {
    num: "02",
    title: "AI scans the surface",
    body: "HTML, CSS and a rendered screenshot are analyzed together.",
    hasArrow: true,
  },
  {
    num: "03",
    title: "Download the skill",
    body: "A single markdown file, ready for your favorite agent.",
    hasArrow: false,
  },
];

function HowItWorks() {
  return (
    <motion.section
      id="how"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="mt-12 scroll-mt-24"
    >
      <div className="mb-10 grid gap-6 sm:grid-cols-2 sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
            How it works
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
            Three steps from{" "}
            <br className="hidden sm:block" />
            URL to <span className="font-sans font-medium italic text-accent">agent-ready</span> skill.
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Behind the scenes: Firecrawl scrapes the page, extracts the HTML, CSS, branding and screenshots, and AI analyses everything together.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 backdrop-blur transition-transform hover:-translate-y-1"
          >
            <div className="mb-8 font-mono text-xs text-muted-foreground/60">
              {step.num}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="font-display text-2xl tracking-tight sm:text-3xl">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Example output */}
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

/* ---------------- What we capture (features) ---------------- */

const FEATURES: Array<{ title: string; body: string; icon: React.ReactNode }> = [
  {
    title: "Color & typography extraction",
    body: "Palette, fonts, weights, spacing and border-radius — pulled straight from the page via Firecrawl branding analysis.",
    icon: <Paintbrush className="h-5 w-5" />,
  },
  {
    title: "Multi-page deep crawl",
    body: "We don't stop at the homepage. Up to 6 same-origin pages are scraped for richer, more complete style coverage.",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: "Agent-ready SKILL.md",
    body: "AI distills everything into a single markdown skill file your agent can read — drop it into Claude, Cursor, Codex or Windsurf.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Screenshot capture",
    body: "A full rendered screenshot is captured alongside the HTML and CSS, so you can see exactly what was analyzed.",
    icon: <Camera className="h-5 w-5" />,
  },
];

function WhatWeCapture() {
  return (
    <motion.section
      id="features"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="mt-16 scroll-mt-24"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
        What we capture
      </p>
      <h2 className="max-w-lg font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
        We read the <span className="font-sans font-medium italic text-accent">invisible grammar</span> of a website.
      </h2>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`group rounded-2xl border border-border/70 p-7 transition-transform hover:-translate-y-1 bg-card/40 backdrop-blur`}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="text-foreground/70">
                {feat.icon}
              </div>
            </div>
            <h3 className="font-semibold text-lg tracking-tight">{feat.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feat.body}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ------------ "Steal like an artist" divider ------------ */

function StealDivider() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="steal-divider mx-auto mt-16 max-w-3xl"
    >
      <span className="whitespace-nowrap font-display text-lg italic tracking-tight text-muted-foreground/60 sm:text-xl">
        Steal like an artist.
      </span>
    </motion.div>
  );
}



/* ---------------- Scanning state ---------------- */


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
