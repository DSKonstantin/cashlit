import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import { useAddProvider, useTestProvider } from "@/hooks/useProviders";
import type { Provider, NewProviderConfig } from "@/lib/types";

interface AddProviderFormProps {
  onClose: () => void;
}

const KEY_LABELS: Record<Provider, { key: string; secret?: string; placeholder: string; secretPlaceholder?: string }> = {
  coinflow: { key: "API Key", placeholder: "Enter your merchant API key" },
  stripe: { key: "Secret Key", placeholder: "sk_live_... or sk_test_..." },
  paypal: {
    key: "Client ID",
    secret: "Client Secret",
    placeholder: "PayPal Client ID",
    secretPlaceholder: "PayPal Client Secret",
  },
};

export default function AddProviderForm({ onClose }: AddProviderFormProps) {
  const [provider, setProvider] = useState<Provider>("coinflow");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const addMutation = useAddProvider();
  const testMutation = useTestProvider();
  const labels = KEY_LABELS[provider];
  const needsSecret = provider === "paypal";

  const config: NewProviderConfig = {
    provider,
    environment,
    apiKey,
    apiSecret: needsSecret ? apiSecret : undefined,
    displayName: displayName || `${provider.charAt(0).toUpperCase() + provider.slice(1)} (${environment})`,
  };

  const canSubmit = apiKey && (!needsSecret || apiSecret);

  async function handleTest() {
    setTestStatus("testing");
    setErrorMsg("");
    try {
      const result = await testMutation.mutateAsync(config);
      setTestStatus(result ? "success" : "error");
      if (!result) setErrorMsg("Connection failed");
    } catch (e) {
      setTestStatus("error");
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSave() {
    setErrorMsg("");
    try {
      await addMutation.mutateAsync(config);
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }

  function handleProviderChange(p: Provider) {
    setProvider(p);
    setApiKey("");
    setApiSecret("");
    setTestStatus("idle");
    setErrorMsg("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">Add Provider</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-tertiary hover:bg-glass hover:text-text-secondary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Provider Select */}
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
              className="w-full rounded-lg border border-glass-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
            >
              <option value="coinflow">Coinflow</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* Environment */}
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Environment</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEnvironment("sandbox")}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  environment === "sandbox"
                    ? "border-accent-yellow bg-accent-yellow/10 text-accent-yellow"
                    : "border-glass-border text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {provider === "stripe" ? "Test" : "Sandbox"}
              </button>
              <button
                onClick={() => setEnvironment("production")}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  environment === "production"
                    ? "border-accent-green bg-accent-green/10 text-accent-green"
                    : "border-glass-border text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {provider === "stripe" ? "Live" : "Production"}
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="mb-1 block text-xs text-text-secondary">{labels.key}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestStatus("idle"); }}
              placeholder={labels.placeholder}
              className="w-full rounded-lg border border-glass-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-blue"
            />
          </div>

          {/* API Secret (PayPal) */}
          {needsSecret && (
            <div>
              <label className="mb-1 block text-xs text-text-secondary">{labels.secret}</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => { setApiSecret(e.target.value); setTestStatus("idle"); }}
                placeholder={labels.secretPlaceholder}
                className="w-full rounded-lg border border-glass-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-blue"
              />
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="mb-1 block text-xs text-text-secondary">Display Name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={`${provider.charAt(0).toUpperCase() + provider.slice(1)} (${environment})`}
              className="w-full rounded-lg border border-glass-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-blue"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-lg bg-accent-red/10 px-3 py-2 text-xs text-accent-red"
              >
                <AlertCircle size={14} />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={!canSubmit || testMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-glass-border-visible px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-glass disabled:opacity-40"
            >
              {testStatus === "testing" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : testStatus === "success" ? (
                <CheckCircle size={14} className="text-accent-green" />
              ) : testStatus === "error" ? (
                <AlertCircle size={14} className="text-accent-red" />
              ) : null}
              {testStatus === "success" ? "Connected" : "Test Connection"}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSubmit || addMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent-blue px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-blue/80 disabled:opacity-40"
            >
              {addMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
