import { GripVertical } from "lucide-react";
import { type Priority, type Task } from "./types";

const priorityLabel: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

interface TaskOverlayProps {
  task: Task;
}

const TaskOverlay = ({ task }: TaskOverlayProps) => {
  return (
    <div className="task-card task-card-overlay">
      <div className="task-card-top">
        <p className="task-title">{task.name}</p>
        <GripVertical size={14} className="drag-handle" aria-hidden="true" />
      </div>
      <div className="task-meta">
        <span className={`badge badge-${task.priority}`}>
          {priorityLabel[task.priority]}
        </span>
      </div>
    </div>
  );
};

export default TaskOverlay;
