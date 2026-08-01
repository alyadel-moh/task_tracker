import { useState } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Search,
  Plus,
  Calendar,
  Clock,
  CheckSquare,
  Folder,
  ChevronDown,
  Check,
  GripVertical,
  LogOut,
  User,
} from "lucide-react";
import "../css/Dashboard.css";
import useLogout from "../hooks/logoutHook";
import { useNavigate } from "react-router-dom";
// Presentational + client-side drag state only. Task status updates live in
// React state here - when you wire this to real data, the onDragEnd handler
// below is where you'd call your PATCH /api/tasks/:id (status change) mutation
// instead of just calling setTasks locally.

type Priority = "high" | "medium" | "low";
type Status = "todo" | "in_progress" | "in_review" | "done";

interface Task {
  id: string;
  title: string;
  priority: Priority;
  dueDate?: string;
  estimate?: string;
  status: Status;
}

const dummyUser = {
  name: "Aly Adel",
  email: "aly@example.com",
};

const dummyProjects = [
  { id: "1", name: "Website redesign", active: true },
  { id: "2", name: "Mobile app", active: false },
  { id: "3", name: "Thesis project", active: false },
];

const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Design landing page hero",
    priority: "high",
    dueDate: "Aug 4",
    status: "todo",
  },
  {
    id: "t2",
    title: "Set up contact form validation",
    priority: "medium",
    status: "todo",
  },
  { id: "t3", title: "Write footer copy", priority: "low", status: "todo" },
  {
    id: "t4",
    title: "Build project CRUD API",
    priority: "high",
    estimate: "2h",
    status: "in_progress",
  },
  {
    id: "t5",
    title: "Responsive nav bar",
    priority: "medium",
    status: "in_progress",
  },
  {
    id: "t7",
    title: "Auth flow code review",
    priority: "medium",
    status: "in_review",
  },
  { id: "t6", title: "Set up repo and CI", priority: "low", status: "done" },
];

const columns: { key: Status; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "in_review", label: "In review" },
  { key: "done", label: "Done" },
];

const priorityLabel: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

// ---- Draggable task card ----

function TaskCard({ task }: { task: Task }) {
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
        <p className="task-title">{task.title}</p>
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
}

// ---- Droppable column body (desktop: all four visible at once) ----

function ColumnDropZone({
  status,
  children,
}: {
  status: Status;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`column-drop-zone ${isOver ? "column-drop-zone-over" : ""}`}
    >
      {children}
    </div>
  );
}

// ---- Droppable tab pill (mobile: the only visible drop target for the
// three columns that aren't currently active, since their bodies are hidden) ----

function DroppableTab({
  status,
  label,
  count,
  isActive,
  onSelect,
}: {
  status: Status;
  label: string;
  count: number;
  isActive: boolean;
  onSelect: () => void;
}) {
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
}

const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<Status>("todo");
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const activeProject = dummyProjects.find((p) => p.active);
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  // A single PointerSensor covers mouse, trackpad, AND touch on modern
  // browsers (they all fire Pointer Events). Registering a separate
  // TouchSensor alongside it causes the two to race/conflict on mobile,
  // which is why drag wasn't working there - delay+tolerance gives touch
  // enough of a "hold" to distinguish a drag from a scroll gesture.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
  );

  const taskCount = (status: Status) =>
    tasks.filter((t) => t.status === status).length;

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setDraggingTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTask(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const newStatus = (
      overId.startsWith("tab-")
        ? overId.replace("tab-", "")
        : overId.replace("column-", "")
    ) as Status;
    setTasks((current) =>
      current.map((task) =>
        task.id === active.id ? { ...task, status: newStatus } : task,
      ),
    );
    // On mobile, jump the view to whichever column the task just landed in,
    // so the person sees the result of their drag immediately.
    setActiveTab(newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="dashboard">
        <aside className="sidebar">
          <p className="sidebar-title">Projects</p>
          <nav className="project-list">
            {dummyProjects.map((project) => (
              <button
                key={project.id}
                className={`project-item ${project.active ? "project-item-active" : ""}`}
              >
                <Folder size={16} aria-hidden="true" />
                <span>{project.name}</span>
              </button>
            ))}
            <button className="project-item project-item-new">
              <Plus size={16} aria-hidden="true" />
              <span>New project</span>
            </button>
          </nav>

          <div className="sidebar-user">
            <div className="user-avatar">
              {dummyUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="user-info">
              <p className="user-name">{dummyUser.name}</p>
              <p className="user-email">{dummyUser.email}</p>
            </div>
          </div>
          <div className="sidebar-user-actions">
            <button
              className="sidebar-action-button sidebar-action-button-danger"
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess: () => {
                    navigate("/login");
                  },
                });
              }}
            >
              <LogOut size={15} aria-hidden="true" />
              Log out
            </button>
          </div>
        </aside>

        <main className="board-panel">
          <div className="board-header board-header-desktop">
            <div>
              <h1 className="board-title">{activeProject?.name}</h1>
              <p className="board-subtitle">{tasks.length} tasks</p>
            </div>
            <button className="new-task-button">
              <Plus size={16} aria-hidden="true" />
              New task
            </button>
          </div>

          <div className="board-header board-header-mobile">
            <div className="mobile-header-top-row">
              <button
                className="mobile-project-select"
                onClick={() => setIsProjectMenuOpen((open) => !open)}
                aria-expanded={isProjectMenuOpen}
              >
                <span>{activeProject?.name}</span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={isProjectMenuOpen ? "chevron-open" : ""}
                />
              </button>
              <button
                className="mobile-user-button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-label="Account menu"
              >
                {dummyUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </button>
            </div>
            <div className="mobile-search">
              <Search size={14} aria-hidden="true" />
              <span>Search tasks</span>
            </div>
          </div>

          {isUserMenuOpen && (
            <>
              <div
                className="mobile-project-overlay"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="mobile-user-menu">
                <div className="mobile-user-menu-header">
                  <p className="user-name">{dummyUser.name}</p>
                  <p className="user-email">{dummyUser.email}</p>
                </div>

                <button
                  className="mobile-project-menu-item mobile-project-menu-item-danger"
                  onClick={() => {
                    logoutMutation.mutate(undefined, {
                      onSuccess: () => {
                        navigate("/login");
                      },
                    });
                  }}
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          )}

          {isProjectMenuOpen && (
            <>
              <div
                className="mobile-project-overlay"
                onClick={() => setIsProjectMenuOpen(false)}
              />
              <div className="mobile-project-menu">
                {dummyProjects.map((project) => (
                  <button
                    key={project.id}
                    className={`mobile-project-menu-item ${
                      project.active ? "mobile-project-menu-item-active" : ""
                    }`}
                    onClick={() => setIsProjectMenuOpen(false)}
                  >
                    <Folder size={16} aria-hidden="true" />
                    <span>{project.name}</span>
                  </button>
                ))}
                <button
                  className="mobile-project-menu-item mobile-project-menu-item-new"
                  onClick={() => setIsProjectMenuOpen(false)}
                >
                  <Plus size={16} aria-hidden="true" />
                  <span>New project</span>
                </button>
              </div>
            </>
          )}

          {/* Mobile tab switcher - also doubles as the drop target for the three
              columns whose bodies are currently hidden off-screen */}
          <div className="column-tabs">
            {columns.map((col) => (
              <DroppableTab
                key={col.key}
                status={col.key}
                label={col.label}
                count={taskCount(col.key)}
                isActive={activeTab === col.key}
                onSelect={() => setActiveTab(col.key)}
              />
            ))}
          </div>

          <div className="board">
            {columns.map((col) => (
              <div
                key={col.key}
                className={`column column-${col.key} ${activeTab === col.key ? "column-active" : ""}`}
              >
                <div className="column-header column-header-desktop">
                  <span className={`status-dot status-dot-${col.key}`} />
                  <span>{col.label}</span>
                  <span className="column-count">{taskCount(col.key)}</span>
                </div>

                <ColumnDropZone status={col.key}>
                  {tasks
                    .filter((task) => task.status === col.key)
                    .map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  {taskCount(col.key) === 0 && (
                    <p className="column-empty">Drop a task here</p>
                  )}
                </ColumnDropZone>
              </div>
            ))}
          </div>

          <button className="fab" aria-label="New task">
            <Plus size={20} />
          </button>
        </main>
      </div>

      {/* Ghost card that follows the pointer/finger while dragging */}
      <DragOverlay>
        {draggingTask ? (
          <div className="task-card task-card-overlay">
            <div className="task-card-top">
              <p className="task-title">{draggingTask.title}</p>
              <GripVertical
                size={14}
                className="drag-handle"
                aria-hidden="true"
              />
            </div>
            <div className="task-meta">
              <span className={`badge badge-${draggingTask.priority}`}>
                {priorityLabel[draggingTask.priority]}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Dashboard;
