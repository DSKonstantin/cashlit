import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

const providerConfig: Record<Provider, { label: string; color: string }> = {
  coinflow: { label: "Coinflow", color: "bg-accent-blue/15 text-accent-blue border-accent-blue/20" },
  stripe: { label: "Stripe", color: "bg-accent-purple/15 text-accent-purple border-accent-purple/20" },
  paypal: { label: "PayPal", color: "bg-accent-yellow/15 text-accent-yellow border-accent-yellow/20" },
};

interface ProviderBadgeProps {
  provider: Provider;
  className?: string;
}

export default function ProviderBadge({ provider, className }: ProviderBadgeProps) {
  const config = providerConfig[provider];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
        config.color,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
