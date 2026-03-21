import { motion } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import ProviderBadge from "@/components/ui/ProviderBadge";
import { useRemoveProvider } from "@/hooks/useProviders";
import type { ProviderConfig } from "@/lib/types";

interface ProviderCardProps {
  config: ProviderConfig;
}

export default function ProviderCard({ config }: ProviderCardProps) {
  const removeMutation = useRemoveProvider();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                {config.displayName}
              </span>
              <ProviderBadge provider={config.provider} />
            </div>
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span
                className={
                  config.environment === "production"
                    ? "text-accent-green"
                    : "text-accent-yellow"
                }
              >
                {config.environment}
              </span>
              <span className="font-mono">{config.maskedKey}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${config.connected ? "bg-accent-green" : "bg-accent-red"}`}
              />
              <span className="text-xs text-text-secondary">
                {config.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          <button
            onClick={() => removeMutation.mutate(config.id)}
            disabled={removeMutation.isPending}
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-accent-red/10 hover:text-accent-red"
          >
            {removeMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
