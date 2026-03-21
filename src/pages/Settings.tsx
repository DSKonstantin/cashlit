import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Card from "@/components/ui/Card";
import AddProviderForm from "@/components/settings/AddProviderForm";
import ProviderCard from "@/components/settings/ProviderCard";
import ProjectSection from "@/components/settings/ProjectSection";
import { useProviders } from "@/hooks/useProviders";

const pageVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
};

export default function Settings() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: providers, isLoading } = useProviders();

  const hasProviders = providers && providers.length > 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-6 p-4"
    >
      {/* Providers Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">
            Payment Providers
          </h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent-blue/20 px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-accent-blue/30"
            >
              <Plus size={14} />
              Add Provider
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Add Provider Form */}
          <AnimatePresence>
            {showAddForm && (
              <AddProviderForm onClose={() => setShowAddForm(false)} />
            )}
          </AnimatePresence>

          {/* Connected Providers */}
          <AnimatePresence>
            {hasProviders &&
              providers.map((config) => (
                <ProviderCard key={config.id} config={config} />
              ))}
          </AnimatePresence>

          {/* Empty State */}
          {!hasProviders && !showAddForm && !isLoading && (
            <Card className="p-4">
              <div className="flex h-24 flex-col items-center justify-center gap-2 text-text-tertiary">
                <p className="text-sm">No providers connected</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs text-accent-blue hover:underline"
                >
                  Add your first provider to start tracking
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Projects */}
      <ProjectSection />

      {/* App Settings */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-text-secondary">
          Application
        </h2>
        <Card className="divide-y divide-glass-border">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-text-primary">Refresh Interval</p>
              <p className="text-xs text-text-tertiary">
                How often to fetch new data
              </p>
            </div>
            <select
              defaultValue="5"
              className="rounded-lg border border-glass-border bg-bg-secondary px-3 py-1.5 text-xs text-text-primary outline-none"
            >
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-text-primary">Version</p>
              <p className="text-xs text-text-tertiary">
                Cashlit
              </p>
            </div>
            <span className="text-xs text-text-tertiary">v0.1.0</span>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
