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
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ColumnDropZone from "./ColumnDropZone";
import DroppableTab from "./DroppableTab";
import TaskOverlay from "./TaskOverlay";
import {
  columns,
  type Project,
  type Status,
  type Task,
  type Priority,
} from "./types";
import TaskCard from "./TaskCard";
import InlineEditField from "./InlineEditField";
import useUpdateProject from "../hooks/updateProjectHook";
import useGetTasks from "../hooks/getalltasksHook";

interface DashboardBoardProps {
  activeProject: Project | null;
  tasks: Task[];
  activeTab: Status;
  onSelectTab: (status: Status) => void;
  draggingTask: Task | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  isProjectMenuOpen: boolean;
  onToggleProjectMenu: () => void;
  isUserMenuOpen: boolean;
  onToggleUserMenu: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  userName: string;
  userEmail: string;
  onCreateTask: () => void;
  onLogout: () => void;
  sensors: any;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

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
  tasks: initialTasks,
  activeTab,
  onSelectTab,
  draggingTask,
  onDragStart,
  sensors,
  onDragEnd,
  isProjectMenuOpen,
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
}: DashboardBoardProps) => {
  const [savingField, setSavingField] = useState<string | null>(null);
  const updateProjectMutation = useUpdateProject(activeProject?.id ?? "");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data: fetchedTasks } = useGetTasks({
    projectId: activeProject?.id,
    search: searchQuery,
    status: selectedStatuses,
    priority: selectedPriorities,
    overdue: overdueOnly,
  });

  const tasks = fetchedTasks ?? initialTasks;

  const createdDateFormatted = formatDate(activeProject?.createdAt);
  const updatedDateFormatted = formatDate(activeProject?.updatedAt);

  const getTaskCountForStatus = (statusKey: Status) => {
    return tasks.filter((t: Task) => t.status === statusKey).length;
  };

  const toggleStatusFilter = (status: Status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const togglePriorityFilter = (priority: Priority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority],
    );
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setOverdueOnly(false);
  };

  const isFilteredActive =
    searchQuery !== "" ||
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    overdueOnly;

  const handleSaveProjectField = (
    field: "name" | "description",
    value: string,
  ) => {
    if (!activeProject) return;
    setSavingField(field);

    const payload = { [field]: value };

    updateProjectMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Project ${field} updated successfully!`);
        setSavingField(null);
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ??
          "Failed to update project. Please try again.";
        toast.error(apiError);
        setSavingField(null);
      },
    });
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
                    {isFilteredActive && " (filtered)"}
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
        </div>

        {/* Search and Multi-Filter Toolbar Component */}
        {activeProject && (
          <div className="task-filter-bar">
            {/* Search Input Box */}
            <div className="filter-search-wrapper">
              <Search size={16} className="filter-search-icon" />
              <input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="filter-clear-search"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Options Row */}
            <div className="filter-group-options">
              {/* Status Pills */}
              <div className="filter-pills-group">
                <span className="filter-label">Status:</span>
                {STATUS_OPTIONS.map((opt) => {
                  const active = selectedStatuses.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`filter-pill ${active ? "active" : ""}`}
                      onClick={() => toggleStatusFilter(opt.value)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Priority Pills */}
              <div className="filter-pills-group">
                <span className="filter-label">Priority:</span>
                {PRIORITY_OPTIONS.map((opt) => {
                  const active = selectedPriorities.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`filter-pill ${active ? "active" : ""}`}
                      onClick={() => togglePriorityFilter(opt.value)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Overdue Pill */}
              <button
                type="button"
                className={`filter-pill filter-pill-overdue ${
                  overdueOnly ? "active" : ""
                }`}
                onClick={() => setOverdueOnly(!overdueOnly)}
              >
                <AlertTriangle size={13} />
                <span>Overdue</span>
              </button>

              {/* Clear All Filters */}
              {isFilteredActive && (
                <button
                  type="button"
                  className="filter-reset-btn"
                  onClick={handleResetFilters}
                >
                  <X size={14} />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>
        )}

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
              count={getTaskCountForStatus(col.key)}
              isActive={activeTab === col.key}
              onSelect={() => onSelectTab(col.key)}
            />
          ))}
        </div>

        {/* Kanban Board Area */}
        <div className="board">
          {columns.map((col) => {
            const colTasks = tasks.filter(
              (task: Task) => task.status === col.key,
            );

            return (
              <div
                key={col.key}
                className={`column column-${col.key} ${
                  activeTab === col.key ? "column-active" : ""
                }`}
              >
                <div className="column-header column-header-desktop">
                  <span className={`status-dot status-dot-${col.key}`} />
                  <span>{col.label}</span>
                  <span className="column-count">{colTasks.length}</span>
                </div>

                <ColumnDropZone status={col.key}>
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="column-empty">
                      {isFilteredActive
                        ? "No matching tasks"
                        : "Drop a task here"}
                    </p>
                  )}
                </ColumnDropZone>
              </div>
            );
          })}
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
