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
import ColumnDropZone from "./ColumnDropZone";
import DroppableTab from "./DroppableTab";
import TaskOverlay from "./TaskOverlay";
import { columns, type Project, type Status, type Task } from "./types";
import TaskCard from "./TaskCard";

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
  onEditTask: (taskId: string) => void;
}

const DashboardBoard = ({
  activeProject,
  tasks,
  activeTab,
  onSelectTab,
  taskCount,
  draggingTask,
  onDragStart,
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
  onEditTask,
}: DashboardBoardProps) => {
  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <main className="board-panel">
        <div className="board-header board-header-desktop">
          <div>
            <h1 className="board-title">
              {activeProject?.name ?? "No project selected"}
            </h1>
            <p className="board-subtitle">{tasks.length} tasks</p>
          </div>
          <button className="new-task-button" onClick={onCreateTask}>
            <Plus size={16} aria-hidden="true" />
            New task
          </button>
        </div>

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
                    key={project.id}
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
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task.id)}
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
