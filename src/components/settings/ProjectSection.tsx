import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Check } from "lucide-react";
import Card from "@/components/ui/Card";
import ProviderBadge from "@/components/ui/ProviderBadge";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useProviders } from "@/hooks/useProviders";
import type { Project } from "@/lib/types";

export default function ProjectSection() {
  const { data: projects } = useProjects();
  const { data: providers } = useProviders();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    await createMutation.mutateAsync({ name: newName.trim() });
    setNewName("");
    setShowCreate(false);
  }

  function toggleProvider(project: Project, providerId: string) {
    const ids = project.providerIds.includes(providerId)
      ? project.providerIds.filter((id) => id !== providerId)
      : [...project.providerIds, providerId];
    updateMutation.mutate({ ...project, providerIds: ids });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-secondary">Projects</h2>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue/15 px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-accent-blue/25"
          >
            <Plus size={14} />
            New Project
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Project name"
                    autoFocus
                    className="flex-1 rounded-lg border border-glass-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-blue"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="rounded-lg bg-accent-blue p-1.5 text-white disabled:opacity-40"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setNewName(""); }}
                    className="rounded-lg p-1.5 text-text-tertiary hover:text-text-secondary"
                  >
                    <X size={14} />
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project list */}
        {projects?.map((project) => (
          <motion.div key={project.id} layout>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  {project.name}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setEditingId(editingId === project.id ? null : project.id)
                    }
                    className="rounded-md px-2 py-1 text-[10px] font-medium text-accent-blue hover:bg-accent-blue/10"
                  >
                    {editingId === project.id ? "Done" : "Edit"}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(project.id)}
                    className="rounded-md p-1 text-text-tertiary hover:bg-accent-red/10 hover:text-accent-red"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Provider badges */}
              {providers && providers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {providers.map((prov) => {
                    const isLinked = project.providerIds.includes(prov.id);
                    return (
                      <button
                        key={prov.id}
                        onClick={() =>
                          editingId === project.id && toggleProvider(project, prov.id)
                        }
                        className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all ${
                          isLinked
                            ? "border-accent-blue/30 bg-accent-blue/10 text-accent-blue"
                            : editingId === project.id
                              ? "border-glass-border text-text-tertiary hover:border-accent-blue/20 hover:text-text-secondary cursor-pointer"
                              : "border-transparent text-text-tertiary opacity-40"
                        }`}
                        disabled={editingId !== project.id}
                      >
                        <ProviderBadge provider={prov.provider} />
                        <span className="text-[9px] text-text-tertiary">
                          {prov.displayName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {project.providerIds.length === 0 && editingId !== project.id && (
                <p className="mt-1.5 text-[10px] text-text-tertiary">
                  No providers linked — click Edit to add
                </p>
              )}
            </Card>
          </motion.div>
        ))}

        {(!projects || projects.length === 0) && !showCreate && (
          <Card className="p-4">
            <p className="text-center text-xs text-text-tertiary">
              No projects yet. Create one to group your providers.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
