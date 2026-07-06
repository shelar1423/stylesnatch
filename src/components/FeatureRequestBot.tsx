import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Linkedin, Instagram, Mail, Heart } from "lucide-react";

export function FeatureRequestBot() {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If the API key isn't set (e.g. for people cloning the open-source repo),
  // we completely hide the widget.
  if (!accessKey) return null;

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: "New Stylesnatch Feature Request!",
          message: message,
          from_name: "Stylesnatch App",
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setMessage("");
          setIsOpen(false);
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error("Web3Forms error:", errorData);
        alert(`Failed to send request: ${errorData.message || "Please try again."}`);
      }
    } catch (error) {
      alert("Something went wrong. Check your connection.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="absolute bottom-16 right-0 mb-4 w-[320px] origin-bottom-right overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium text-sm">Feature Request</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-background/70 transition-colors hover:bg-background/20 hover:text-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Have an idea to make Stylesnatch better? Drop it below and it'll be sent directly to
                my inbox!
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I would love it if the app could..."
                className="min-h-[100px] w-full resize-none rounded-xl border border-border/50 bg-background/50 p-3 text-sm placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending || isSuccess}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-transform disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02]"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">Sending...</span>
                ) : isSuccess ? (
                  <span className="flex items-center gap-2 text-green-400">Sent successfully!</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Request
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent("open-support"));
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
              >
                <Heart className="h-4 w-4" />
                Support the project
              </button>

              <div className="mt-5 border-t border-border/40 pt-4 text-center">
                <span className="text-xs text-muted-foreground/80">Or connect with me via</span>
                <div className="mt-2 flex items-center justify-center gap-3 text-muted-foreground">
                  <a
                    href="https://www.linkedin.com/in/digvijayshelar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-background/50 p-2 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href="mailto:digvijayux@gmail.com"
                    className="rounded-full bg-background/50 p-2 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <a
                    href="https://instagram.com/digvijayux"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-background/50 p-2 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, originX: 1 }}
            transition={{ delay: 1, type: "spring", bounce: 0.4 }}
            className="pointer-events-none absolute right-[4.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
          >
            Feature request?
            <div className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-border/60 bg-card"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg shadow-foreground/20 transition-colors hover:bg-foreground/90"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
