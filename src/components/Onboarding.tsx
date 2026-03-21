import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DragRegion from "./layout/DragRegion";
import {
  Shield,
  Calendar,
  Plug,
  ArrowRight,
  HardDrive,
  Eye,
  Lock,
  Sparkles,
} from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

interface StepDef {
  icon: typeof Calendar;
  title: string;
  description: string;
  color: string;
  bg: string;
  glow: string;
  details?: { provider: string; endpoint: string; color: string }[];
  securityPoints?: { icon: typeof Lock; text: string }[];
}

const steps: StepDef[] = [
  {
    icon: Calendar,
    title: "Your revenue,\none calendar",
    description:
      "See every transaction across all your payment providers on a single calendar. Revenue, refunds, disputes — everything at a glance, every day.",
    color: "text-[#0a84ff]",
    bg: "bg-[#0a84ff]/10",
    glow: "shadow-[0_0_80px_rgba(10,132,255,0.15)]",
  },
  {
    icon: Plug,
    title: "Connect your\nproviders",
    description:
      "Add your payment provider API keys in Settings. We use read-only access to fetch transactions — nothing is ever modified or sent anywhere.",
    color: "text-[#30d158]",
    bg: "bg-[#30d158]/10",
    glow: "shadow-[0_0_80px_rgba(48,209,88,0.12)]",
    details: [
      { provider: "Coinflow", endpoint: "payments, refunds, plans", color: "bg-[#0a84ff]" },
      { provider: "Stripe", endpoint: "charges, prices, subscriptions", color: "bg-[#bf5af2]" },
      { provider: "PayPal", endpoint: "transactions, billing plans", color: "bg-[#ff9f0a]" },
    ],
  },
  {
    icon: Shield,
    title: "Your keys never\nleave your device",
    description:
      "There are no servers. This app runs 100% on your machine. API keys are stored in a local encrypted file that only you can access.",
    color: "text-[#ffd60a]",
    bg: "bg-[#ffd60a]/10",
    glow: "shadow-[0_0_80px_rgba(255,214,10,0.1)]",
    securityPoints: [
      { icon: HardDrive, text: "Encrypted local storage only" },
      { icon: Eye, text: "Read-only API access" },
      { icon: Lock, text: "Touch ID on every launch" },
    ],
  },
  {
    icon: Sparkles,
    title: "You're ready",
    description:
      "Head to Settings to connect your first payment provider. Your calendar will fill up with data instantly.",
    color: "text-[#bf5af2]",
    bg: "bg-[#bf5af2]/10",
    glow: "shadow-[0_0_80px_rgba(191,90,242,0.12)]",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="app-shell flex h-screen w-screen flex-col overflow-hidden rounded-2xl">
      {/* Drag region */}
      <DragRegion className="absolute inset-x-0 top-0 z-30 h-10" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-10 py-6">
        {/* Ambient glow behind icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`glow-${step}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className={`absolute top-1/4 h-40 w-40 rounded-full blur-3xl ${current.bg}`}
          />
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full max-w-[340px] flex-col items-center text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.4, delay: 0.1, type: "spring", bounce: 0.3 }}
              className={`mb-5 rounded-2xl ${current.bg} ${current.glow} p-4`}
            >
              <current.icon size={28} className={current.color} strokeWidth={1.5} />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="mb-3 whitespace-pre-line text-[20px] font-bold leading-tight text-text-primary"
            >
              {current.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-4 text-[12px] leading-relaxed text-text-secondary"
            >
              {current.description}
            </motion.p>

            {/* API details (step 2) */}
            {current.details && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="mb-2 w-full space-y-2"
              >
                {current.details.map((d, i) => (
                  <motion.div
                    key={d.provider}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.3 + i * 0.08 }}
                    className="glass flex items-center gap-3 rounded-xl px-3 py-2"
                  >
                    <div className={`h-2 w-2 rounded-full ${d.color}`} />
                    <span className="flex-1 text-left text-xs font-semibold text-text-primary">
                      {d.provider}
                    </span>
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {d.endpoint}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Security points (step 3) */}
            {current.securityPoints && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="mb-2 w-full space-y-2"
              >
                {current.securityPoints.map((sp, i) => (
                  <motion.div
                    key={sp.text}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.3 + i * 0.08 }}
                    className="glass flex items-center gap-3 rounded-xl px-3 py-2"
                  >
                    <sp.icon size={16} className="shrink-0 text-[#ffd60a]" />
                    <span className="text-left text-xs text-text-secondary">
                      {sp.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom navigation */}
        <div className="relative z-10 mt-auto flex w-full max-w-[340px] flex-col gap-4">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 py-2">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 24 : 6,
                  opacity: i === step ? 1 : i < step ? 0.5 : 0.2,
                }}
                transition={{ duration: 0.3 }}
                className={`h-[6px] rounded-full ${
                  i <= step ? "bg-accent-blue" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* Main button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => (isLast ? onComplete() : setStep(step + 1))}
            className="flex items-center justify-center gap-2 rounded-2xl bg-accent-blue py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-blue/85"
          >
            {isLast ? "Get Started" : "Continue"}
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight size={16} />
            </motion.span>
          </motion.button>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={onComplete}
              className="pb-1 text-[11px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
