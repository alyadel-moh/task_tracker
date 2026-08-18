import { useDroppable } from "@dnd-kit/core";
import { type ReactNode } from "react";

interface ColumnDropZoneProps {
  status: string;
  children: ReactNode;
}

const ColumnDropZone = ({ status, children }: ColumnDropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });

  return (
    <div
      ref={setNodeRef}
      className={`column-drop-zone ${isOver ? "column-drop-zone-over" : ""}`}
    >
      {children}
    </div>
  );
};

export default ColumnDropZone;
