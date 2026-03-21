import { useState, useCallback } from "react";
import { closeWindow, minimizeWindow, toggleFullscreen } from "@/lib/window";

export default function WindowControls() {
  const [hovered, setHovered] = useState(false);

  const handleClose = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await closeWindow();
  }, []);

  const handleMinimize = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await minimizeWindow();
  }, []);

  const handleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await toggleFullscreen();
  }, []);

  return (
    <div
      className="flex items-center gap-[7px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleClose}
        className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] active:brightness-75 hover:brightness-110"
        type="button"
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 6 6" className="text-[#4a0002]">
            <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleMinimize}
        className="flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] active:brightness-75 hover:brightness-110"
        type="button"
      >
        {hovered && (
          <svg width="6" height="2" viewBox="0 0 6 2" className="text-[#5a3e00]">
            <path d="M0.5 1H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleFullscreen}
        className="flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] active:brightness-75 hover:brightness-110"
        type="button"
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 6 6" className="text-[#004a00]">
            <path d="M1 5L5 1M1 1.5V5H4.5M5 4.5V1H1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </button>
    </div>
  );
}
