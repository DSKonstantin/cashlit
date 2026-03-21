import { useAppContext } from "@/context/AppContext";
import { useProjects } from "@/hooks/useProjects";

export default function ProjectSelector() {
  const { projectId, setProjectId } = useAppContext();
  const { data: projects } = useProjects();

  if (!projects || projects.length === 0) return null;

  return (
    <select
      value={projectId ?? "all"}
      onChange={(e) => setProjectId(e.target.value === "all" ? null : e.target.value)}
      className="rounded-lg border border-glass-border bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-text-secondary outline-none transition-colors hover:bg-white/[0.06] focus:border-glass-border-visible"
    >
      <option value="all">All Projects</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
