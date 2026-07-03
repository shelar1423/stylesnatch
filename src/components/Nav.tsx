import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wand2, Linkedin, Mail, Instagram, Heart, Menu, X } from "lucide-react";
import { SupportModal } from "./SupportModal";

export function Nav() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpenSupport = () => setIsSupportOpen(true);
    window.addEventListener("open-support", handleOpenSupport);
    return () => window.removeEventListener("open-support", handleOpenSupport);
  }, []);

  return (
    <>
      <SupportModal isOpen={isSupportOpen} setIsOpen={setIsSupportOpen} />
      <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-4 z-30 mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full border border-border/70 bg-card/80 px-5 py-2.5 shadow-[0_1px_0_oklch(1_0_0_/_0.6)_inset,0_10px_30px_-15px_oklch(0.2_0.02_60_/_0.15)] backdrop-blur-md sm:px-6"
    >
      <Link 
        to="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
          <Wand2 className="h-4 w-4" />
        </div>
        <span className="font-display text-xl leading-none tracking-tight">
          Stylesnatch
        </span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
        <Link
          to="/"
          hash="how"
          className="hover:text-foreground transition-colors"
        >
          How it works
        </Link>
        <Link
          to="/"
          hash="features"
          className="hover:text-foreground transition-colors"
        >
          Features
        </Link>
        <Link
          to="/"
          hash="example"
          className="hover:text-foreground transition-colors"
        >
          Example
        </Link>
        <Link
          to="/maker"
          className="hover:text-foreground transition-colors"
        >
          Meet the Maker
        </Link>
        <a
          href="https://github.com/shelar1423/stylesnatch#local-setup-instructions"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Run Locally
        </a>
      </nav>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-3 text-muted-foreground sm:flex border-r border-border/60 pr-4">
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
        <button
          onClick={() => setIsSupportOpen(true)}
          className="group flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
        >
          <Heart className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          Support
        </button>
        <a
          href="https://github.com/shelar1423/stylesnatch"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-full border border-border/80 bg-foreground/5 px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="hidden sm:inline">Star</span>
        </a>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="sm:hidden ml-1 p-2 text-muted-foreground hover:text-foreground"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </motion.header>

    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed inset-x-4 top-20 z-20 rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:hidden"
        >
          <nav className="flex flex-col gap-6 text-sm font-medium">
            <Link to="/" hash="how" onClick={() => setIsMobileMenuOpen(false)}>
              How it works
            </Link>
            <Link to="/" hash="features" onClick={() => setIsMobileMenuOpen(false)}>
              Features
            </Link>
            <Link to="/" hash="example" onClick={() => setIsMobileMenuOpen(false)}>
              Example
            </Link>
            <Link to="/maker" onClick={() => setIsMobileMenuOpen(false)}>
              Meet the Maker
            </Link>
            <a
              href="https://github.com/shelar1423/stylesnatch#local-setup-instructions"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Run Locally
            </a>
            
            <div className="mt-4 flex items-center gap-6 border-t border-border/50 pt-6 text-muted-foreground">
              <a href="https://www.linkedin.com/in/digvijayshelar/" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:digvijayux@gmail.com">
                <Mail className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/digvijayux" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
