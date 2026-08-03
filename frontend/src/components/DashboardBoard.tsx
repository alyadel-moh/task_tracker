import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ChevronDown,
  Folder,
  LogOut,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ColumnDropZone from "./ColumnDropZone";
import DroppableTab from "./DroppableTab";
import TaskOverlay from "./TaskOverlay";
import { columns, type Project, type Status, type Task } from "./types";
import TaskCard from "./TaskCard";
import InlineEditField from "./InlineEditField";
import useUpdateProject from "../hooks/updateProjectHook";

interface DashboardBoardProps {
  activeProject: Project | null;
  tasks: Task[];
  activeTab: Status;
  onSelectTab: (status: Status) => void;
  taskCount: (status: Status) => number;
  draggingTask: Task | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  isProjectMenuOpen: boolean;
  onToggleProjectMenu: () => void;
  isUserMenuOpen: boolean;
  onToggleUserMenu: () => void;
  projects: Project[];
  onEditProject: (projectId: string) => void;
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  userName: string;
  userEmail: string;
  onCreateTask: () => void;
  onLogout: () => void;
  sensors: any;
  refetchProjects?: () => void;
  refetchTasks?: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const DashboardBoard = ({
  activeProject,
  tasks,
  activeTab,
  onSelectTab,
  taskCount,
  draggingTask,
  refetchTasks,
  onDragStart,
  sensors,
  onDragEnd,
  isProjectMenuOpen,
  onEditProject,
  onToggleProjectMenu,
  isUserMenuOpen,
  onToggleUserMenu,
  onCreateTask,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  userName,
  userEmail,
  onLogout,
  refetchProjects,
}: DashboardBoardProps) => {
  const [savingField, setSavingField] = useState<string | null>(null);
  const updateProjectMutation = useUpdateProject(activeProject?.id ?? "");

  const createdDateFormatted = formatDate(activeProject?.createdAt);
  const updatedDateFormatted = formatDate(activeProject?.updatedAt);

  const handleSaveProjectField = (
    field: "name" | "description",
    value: string,
  ) => {
    if (!activeProject) return;
    setSavingField(field);

    updateProjectMutation.mutate(
      {
        name: field === "name" ? value : activeProject.name,
        description:
          field === "description" ? value : (activeProject.description ?? ""),
      },
      {
        onSuccess: () => {
          toast.success("Project updated successfully!");
          refetchProjects?.();
          setSavingField(null);
        },
        onError: (error: any) => {
          const apiError =
            error?.response?.data?.message ??
            "Failed to update project. Please try again.";
          toast.error(apiError);
          setSavingField(null);
        },
      },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <main className="board-panel">
        {/* Desktop Board Header */}
        <div className="board-header board-header-desktop">
          <div className="board-header-left">
            {activeProject ? (
              <>
                <div className="board-title-row">
                  <InlineEditField
                    label=""
                    value={activeProject.name}
                    isSaving={savingField === "name"}
                    onSave={(val) => handleSaveProjectField("name", val)}
                  />
                  <span className="task-count-badge">
                    {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                  </span>
                </div>

                <div className="board-description-row">
                  <InlineEditField
                    label=""
                    type="textarea"
                    optional
                    value={activeProject.description ?? ""}
                    placeholder="Add a project description..."
                    isSaving={savingField === "description"}
                    onSave={(val) => handleSaveProjectField("description", val)}
                  />
                </div>
              </>
            ) : (
              <div>
                <h1 className="board-title">No project selected</h1>
                <p className="board-subtitle">
                  Select or create a project to get started
                </p>
              </div>
            )}
          </div>

          <div className="board-header-right">
            {activeProject &&
              (createdDateFormatted || updatedDateFormatted) && (
                <div className="board-meta-pill">
                  {createdDateFormatted && (
                    <span>Created {createdDateFormatted}</span>
                  )}
                  {createdDateFormatted && updatedDateFormatted && (
                    <span className="pill-dot">•</span>
                  )}
                  {updatedDateFormatted && (
                    <span>Updated {updatedDateFormatted}</span>
                  )}
                </div>
              )}

            <button
              type="button"
              className="new-task-button"
              onClick={onCreateTask}
              disabled={!activeProject}
            >
              <Plus size={16} aria-hidden="true" />
              New task
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="board-header board-header-mobile">
          <div className="mobile-header-top-row">
            <button
              className="mobile-project-select"
              onClick={onToggleProjectMenu}
              aria-expanded={isProjectMenuOpen}
            >
              <span>{activeProject?.name ?? "Select a project"}</span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={isProjectMenuOpen ? "chevron-open" : ""}
              />
            </button>
            <button
              className="mobile-user-button"
              onClick={onToggleUserMenu}
              aria-expanded={isUserMenuOpen}
              aria-label="Account menu"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
          <div className="mobile-search">
            <Search size={14} aria-hidden="true" />
            <span>Search tasks</span>
          </div>
        </div>

        {/* User Menu Popup */}
        {isUserMenuOpen && (
          <>
            <div
              className="mobile-project-overlay"
              onClick={onToggleUserMenu}
            />
            <div className="mobile-user-menu">
              <div className="mobile-user-menu-header">
                <p className="user-name">{userName}</p>
                <p className="user-email">{userEmail}</p>
              </div>
              <button
                className="mobile-project-menu-item mobile-project-menu-item-danger"
                onClick={onLogout}
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          </>
        )}

        {/* Mobile Project Switcher Menu */}
        {isProjectMenuOpen && (
          <>
            <div
              className="mobile-project-overlay"
              onClick={onToggleProjectMenu}
            />
            <div className="mobile-project-menu">
              {projects.map((project) => (
                <div key={project.id} className="project-item-row">
                  <button
                    className={`mobile-project-menu-item ${
                      project.id === activeProjectId
                        ? "mobile-project-menu-item-active"
                        : ""
                    }`}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <Folder size={16} aria-hidden="true" />
                    <span>{project.name}</span>
                  </button>
                  <button
                    className="project-item-edit"
                    aria-label={`Edit ${project.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditProject(project.id);
                    }}
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                </div>
              ))}

              <button
                className="mobile-project-menu-item mobile-project-menu-item-new"
                onClick={() => {
                  onToggleProjectMenu();
                  onCreateProject();
                }}
              >
                <Plus size={16} aria-hidden="true" />
                <span>New project</span>
              </button>
            </div>
          </>
        )}

        {/* Column Tabs (Mobile Navigation) */}
        <div className="column-tabs">
          {columns.map((col) => (
            <DroppableTab
              key={col.key}
              status={col.key}
              label={col.label}
              count={taskCount(col.key)}
              isActive={activeTab === col.key}
              onSelect={() => onSelectTab(col.key)}
            />
          ))}
        </div>

        {/* Kanban Board Area */}
        <div className="board">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`column column-${col.key} ${
                activeTab === col.key ? "column-active" : ""
              }`}
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
                    <TaskCard
                      key={task.id}
                      task={task}
                      refetchTasks={refetchTasks}
                    />
                  ))}
                {taskCount(col.key) === 0 && (
                  <p className="column-empty">Drop a task here</p>
                )}
              </ColumnDropZone>
            </div>
          ))}
        </div>

        <button className="fab" aria-label="New task" onClick={onCreateTask}>
          <Plus size={20} />
        </button>
      </main>

      <DragOverlay>
        {draggingTask ? <TaskOverlay task={draggingTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DashboardBoard;
