import { useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Loader2 } from "lucide-react";
import { authenticate } from "@/lib/commands";

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleAuth() {
    setLoading(true);
    setError(false);
    try {
      const success = await authenticate();
      if (success) {
        onUnlock();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex h-screen w-screen flex-col items-center justify-center overflow-hidden rounded-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-5"
      >
        <button
          onClick={handleAuth}
          disabled={loading}
          className="group flex h-20 w-20 items-center justify-center rounded-full border border-glass-border bg-white/[0.04] transition-all hover:bg-white/[0.08] hover:border-glass-border-visible active:scale-95"
        >
          {loading ? (
            <Loader2 size={32} className="animate-spin text-text-secondary" />
          ) : (
            <Fingerprint
              size={36}
              className={`transition-colors ${
                error ? "text-accent-red" : "text-text-secondary group-hover:text-text-primary"
              }`}
            />
          )}
        </button>

        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            Cashlit
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {error
              ? "Authentication failed. Try again."
              : "Tap to unlock with Touch ID"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
