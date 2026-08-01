import { useDraggable } from "@dnd-kit/core";
import { Calendar, Check, Clock, GripVertical } from "lucide-react";
import { type Priority, type Task } from "./types";

const priorityLabel: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { status: task.status },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${task.status === "done" ? "task-card-done" : ""} ${
        isDragging ? "task-card-dragging" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-top">
        <p className="task-title">{task.name}</p>
        <GripVertical size={14} className="drag-handle" aria-hidden="true" />
      </div>

      <div className="task-meta">
        {task.status === "done" ? (
          <span className="badge badge-done">
            <Check size={11} aria-hidden="true" />
            Done
          </span>
        ) : (
          <span className={`badge badge-${task.priority}`}>
            {priorityLabel[task.priority]}
          </span>
        )}

        {task.dueDate && (
          <span className="task-due">
            <Calendar size={12} aria-hidden="true" />
            {task.dueDate}
          </span>
        )}

        {task.estimate && (
          <span className="task-due">
            <Clock size={12} aria-hidden="true" />
            {task.estimate}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
