import { useDroppable } from "@dnd-kit/core";
import { type ReactNode } from "react";
import { type Status } from "./types";

interface ColumnDropZoneProps {
  status: Status;
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