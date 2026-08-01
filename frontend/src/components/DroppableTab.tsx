import { useDroppable } from "@dnd-kit/core";
import { type Status } from "./types";

interface DroppableTabProps {
  status: Status;
  label: string;
  count: number;
  isActive: boolean;
  onSelect: () => void;
}

const DroppableTab = ({
  status,
  label,
  count,
  isActive,
  onSelect,
}: DroppableTabProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `tab-${status}` });

  return (
    <button
      ref={setNodeRef}
      className={`column-tab ${isActive ? "column-tab-active" : ""} ${
        isOver ? "column-tab-over" : ""
      }`}
      onClick={onSelect}
    >
      {label} {count}
    </button>
  );
};

export default DroppableTab;
