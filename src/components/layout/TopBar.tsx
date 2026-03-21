import { BarChart3, Settings, X } from "lucide-react";
import type { Screen, DaySelection } from "@/App";
import WindowControls from "./WindowControls";
import DragRegion from "./DragRegion";
import ProjectSelector from "@/components/ui/ProjectSelector";
import ProviderFilter from "@/components/ui/ProviderFilter";

interface TopBarProps {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  selectedDay: DaySelection | null;
}

export default function TopBar({
  screen,
  onNavigate,
  onBack,
  selectedDay,
}: TopBarProps) {
  const title =
    screen === "analytics"
      ? "Analytics"
      : screen === "settings"
        ? "Settings"
        : screen === "day-detail" && selectedDay
          ? selectedDay.date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })
          : "";

  if (screen === "calendar") {
    return (
      <div className="relative z-20 flex h-11 shrink-0 items-center justify-between px-4">
        <DragRegion className="absolute inset-0 z-0" />

        <div className="relative z-10">
          <WindowControls />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <ProjectSelector />
          <ProviderFilter />
          <button
            onClick={() => onNavigate("analytics")}
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-secondary"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => onNavigate("settings")}
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-secondary"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-11 shrink-0 items-center px-4">
      <DragRegion className="absolute inset-0 z-0" />

      <div className="relative z-10">
        <WindowControls />
      </div>

      <div className="relative z-10 flex-1 text-center text-sm font-semibold text-text-primary">
        {title}
      </div>

      <button
        onClick={onBack}
        className="relative z-10 rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-secondary"
      >
        <X size={16} />
      </button>
    </div>
  );
}
