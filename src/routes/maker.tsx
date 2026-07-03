import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/maker")({
  component: MakerPage,
});

function MakerPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-24 sm:pt-32">
      {/* Glow effects */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-accent/20 opacity-50 blur-[120px] mix-blend-screen" />
      <div className="pointer-events-none absolute right-0 top-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/10 opacity-30 blur-[100px] mix-blend-screen" />
      <div className="pointer-events-none absolute left-0 top-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-purple-500/10 opacity-30 blur-[100px] mix-blend-screen" />

      <div className="mx-auto max-w-3xl px-6 sm:px-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 h-24 w-24 overflow-hidden rounded-full border-2 border-border/80 shadow-xl">
            <img
              src="https://framerusercontent.com/images/MAWWEQbmXuB0NW2oboUC8pGoI8Q.png"
              alt="Digvijay Shelar"
              className="h-full w-full object-cover"
            />
          </div>
          
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Meet the Maker
          </h1>
          
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Hi, I'm <strong className="font-medium text-foreground">Digvijay Shelar</strong>.
            I'm a developer turned UX designer with a passion for building tools that sit squarely 
            at the intersection of beautiful design and powerful AI.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            I built <strong>Stylesnatch</strong> because I was tired of watching AI coding agents build generic, 
            soulless UI components. I wanted a way to instantly "teach" an agent the exact design system 
            of any website I loved, without manually typing out CSS variables and spacing rules for hours.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <a
              href="https://digvijayux.framer.website/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-105"
            >
              View my UX Portfolio
              <ExternalLink className="h-4 w-4" />
            </a>
            
            <a
              href="https://www.linkedin.com/in/digvijayshelar/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Connect on LinkedIn
            </a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
