import { useAppContext } from "@/context/AppContext";
import { useProviders } from "@/hooks/useProviders";
import type { Provider } from "@/lib/types";

const providerLabels: Record<Provider, string> = {
  coinflow: "Coinflow",
  stripe: "Stripe",
  paypal: "PayPal",
};

export default function ProviderFilter() {
  const { providerFilter, setProviderFilter } = useAppContext();
  const { data: providers } = useProviders();

  if (!providers || providers.length <= 1) return null;

  // Get unique provider types
  const types = [...new Set(providers.map((p) => p.provider))];
  if (types.length <= 1) return null;

  return (
    <select
      value={providerFilter ?? "all"}
      onChange={(e) =>
        setProviderFilter(
          e.target.value === "all" ? null : (e.target.value as Provider),
        )
      }
      className="rounded-lg border border-glass-border bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-text-secondary outline-none transition-colors hover:bg-white/[0.06] focus:border-glass-border-visible"
    >
      <option value="all">All Providers</option>
      {types.map((t) => (
        <option key={t} value={t}>
          {providerLabels[t]}
        </option>
      ))}
    </select>
  );
}
