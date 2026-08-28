import { useDroppable } from "@dnd-kit/core";

interface ColumnDropZoneProps {
  status: string;
  statusColorKey?: "todo" | "in-progress" | "done" | "custom";
  children: React.ReactNode;
}

const ColumnDropZone = ({
  status,
  statusColorKey = "custom",
  children,
}: ColumnDropZoneProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: { type: "Column", statusId: status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`column-drop-zone column-drop-zone-${statusColorKey} ${
        isOver ? "column-drop-zone-over" : ""
      }`}
    >
      {children}
    </div>
  );
};

export default ColumnDropZone;
