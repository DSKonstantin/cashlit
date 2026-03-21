import { useCallback } from "react";
import { startDrag } from "@/lib/window";

interface DragRegionProps {
  className?: string;
}

export default function DragRegion({ className }: DragRegionProps) {
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    await startDrag();
  }, []);

  return <div onMouseDown={handleMouseDown} className={className} />;
}
