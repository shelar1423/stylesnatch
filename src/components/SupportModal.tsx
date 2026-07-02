import { motion, AnimatePresence } from "motion/react";
import { X, Heart } from "lucide-react";

export function SupportModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const upiId = "digvijayshelar@okhdfcbank";
  const upiName = "Digvijay Shelar";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-2xl pointer-events-auto"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <Heart className="h-6 w-6" />
                </div>
                <h2 className="mb-2 font-display text-2xl tracking-tight">Support the project</h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Stylesnatch is completely free and open-source. If it saved you some time building your UI, consider supporting its development with a small tip!
                </p>

                <div className="relative mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-border/50">
                  <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    className="h-[200px] w-[200px] rounded-lg"
                  />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-medium shadow-sm">
                    Scan with any UPI App
                  </div>
                </div>

                <div className="mb-4 text-xs font-mono text-muted-foreground/80">
                  {upiId}
                </div>

                <a
                  href={upiUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02] sm:hidden"
                >
                  Open UPI App
                </a>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
