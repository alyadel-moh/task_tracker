import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  Folder,
  LogOut,
  Pencil,
  Plus,
  Search,
  X,
  AlertTriangle,
  ArrowRight,
  UserCog,
} from "lucide-react";
import { toast } from "react-hot-toast";
import DroppableTab from "./DroppableTab";
import TaskOverlay from "./TaskOverlay";
import SortableColumn from "./SortableColumn";
import {
  type Project,
  type Task,
  type Priority,
  type Statuss,
  User,
} from "./types";
import InlineEditField from "./InlineEditField";
import useUpdateProject from "../hooks/updateProjectHook";
import useGetTasks from "../hooks/getAllTasksHook";

interface DashboardBoardProps {
  activeProject: Project | null;
  tasks: Task[];
  statuses: Statuss[];
  activeTab: string;
  onSelectTab: (statusId: string) => void;
  draggingTask: Task | null;
  draggingColumn?: Statuss | null;
  overColumnStatus?: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  isProjectMenuOpen: boolean;
  onToggleProjectMenu: () => void;
  isUserMenuOpen: boolean;
  onToggleUserMenu: () => void;
  onOpenUserProfileModal: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onCreateTask: () => void;
  onLogout: () => void;
  sensors: any;
  user: User | null;
  onToggleAddColumnModal: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const DEFAULT_STATUS_MAP: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const formatStatusName = (
  rawName?: string,
  mappedStatus?: string | null,
): string => {
  if (rawName && typeof rawName === "string" && rawName.trim()) {
    const trimmed = rawName.trim();
    if (DEFAULT_STATUS_MAP[trimmed]) {
      return DEFAULT_STATUS_MAP[trimmed];
    }
    return trimmed;
  }
  if (mappedStatus && DEFAULT_STATUS_MAP[mappedStatus]) {
    return DEFAULT_STATUS_MAP[mappedStatus];
  }
  return "Untitled Column";
};

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
  statuses,
  activeTab,
  onSelectTab,
  draggingTask,
  draggingColumn,
  overColumnStatus,
  onDragStart,
  onDragOver,
  sensors,
  onDragEnd,
  isProjectMenuOpen,
  onToggleProjectMenu,
  isUserMenuOpen,
  onToggleUserMenu,
  onOpenUserProfileModal,
  onCreateTask,
  onToggleAddColumnModal,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  user,
  onLogout,
}: DashboardBoardProps) => {
  const updateProjectMutation = useUpdateProject(activeProject?.id ?? "");

  const columns: Statuss[] = useMemo(() => {
    if (!Array.isArray(statuses) || statuses.length === 0) {
      return [];
    }
    return statuses
      .filter((col): col is Statuss =>
        Boolean(col && typeof col === "object" && col.id),
      )
      .map((col) => ({
        ...col,
        name: formatStatusName(col.name, col.mappedStatus),
      }));
  }, [statuses]);

  useEffect(() => {
    if (
      columns.length > 0 &&
      (!activeTab || !columns.some((c) => c.id === activeTab))
    ) {
      onSelectTab(columns[0].id);
    }
  }, [columns, activeTab, onSelectTab]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
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

  const statusIdToNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    columns.forEach((col) => {
      if (col && col.id) {
        map[col.id] = col.name;
      }
    });
    return map;
  }, [columns]);

  const getTaskCountForStatus = (statusId: string) => {
    return (Array.isArray(tasks) ? tasks : []).filter((t: Task) => {
      if (!t) return false;
      const taskStatusId = t.statusId ?? (t as any).status_id;
      return taskStatusId === statusId;
    }).length;
  };

  const toggleStatusFilter = (statusValue: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusValue)
        ? prev.filter((s) => s !== statusValue)
        : [...prev, statusValue],
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

    const payload = { [field]: value };

    updateProjectMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Project ${field} updated successfully!`);
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ??
          "Failed to update project. Please try again.";
        toast.error(apiError);
      },
    });
  };

  const columnSortableIds = useMemo(
    () => columns.map((c) => `col-${c.id}`),
    [columns],
  );

  const draggingTaskStatusId =
    draggingTask?.statusId ?? (draggingTask as any)?.status_id;

  const targetColumn = columns.find((c) => c.id === overColumnStatus);
  const targetMappedStatusClass = (
    targetColumn?.mappedStatus || "DEFAULT"
  ).toLowerCase();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <main className="board-panel">
        {/* Desktop Header */}
        <div className="board-header board-header-desktop">
          <div className="board-header-left">
            {activeProject ? (
              <>
                <div className="board-title-row">
                  <InlineEditField
                    label=""
                    value={activeProject.name}
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
              type="button"
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
              type="button"
              className="mobile-user-button"
              onClick={onToggleUserMenu}
              aria-expanded={isUserMenuOpen}
              aria-label="Account menu"
            >
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} />
              ) : (
                <span>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </button>
          </div>

          {activeProject && (createdDateFormatted || updatedDateFormatted) && (
            <div className="board-meta-pill mobile-project-meta-pill">
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
        </div>

        {/* Toolbar */}
        {activeProject && (
          <div className="task-filter-bar">
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

            <div className="filter-group-options">
              {columns.length > 0 && (
                <div className="filter-pills-group">
                  <span className="filter-label">Status:</span>
                  {columns.map((col) => {
                    const filterKey = col.name;
                    const active = selectedStatuses.includes(filterKey);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        className={`filter-pill ${active ? "active" : ""}`}
                        onClick={() => toggleStatusFilter(filterKey)}
                      >
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              )}

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

        {/* User Menu */}
        {isUserMenuOpen && (
          <>
            <div
              className="mobile-project-overlay"
              onClick={onToggleUserMenu}
            />
            <div className="mobile-user-menu">
              <div className="mobile-user-menu-header">
                <p className="user-name">
                  {user?.name || user?.email || "User"}
                </p>
                <p className="user-email">
                  {user?.email || "No email provided"}
                </p>
              </div>

              <button
                type="button"
                className="mobile-project-menu-item"
                onClick={() => {
                  onToggleUserMenu();
                  onOpenUserProfileModal();
                }}
              >
                <UserCog size={16} aria-hidden="true" />
                <span>Account Settings</span>
              </button>

              <button
                type="button"
                className="mobile-project-menu-item mobile-project-menu-item-danger"
                onClick={onLogout}
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          </>
        )}

        {/* Project Menu */}
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
                    type="button"
                    className={`mobile-project-menu-item ${
                      project.id === activeProjectId
                        ? "mobile-project-menu-item-active"
                        : ""
                    }`}
                    onClick={() => {
                      onSelectProject(project.id);
                      onToggleProjectMenu();
                    }}
                  >
                    <Folder size={16} aria-hidden="true" />
                    <span>{project.name}</span>
                  </button>
                  <button
                    type="button"
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
                type="button"
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

        {/* Droppable Tabs */}
        {columns.length > 0 && (
          <div className="column-tabs">
            {columns.map((col) => (
              <DroppableTab
                key={col.id}
                status={col.id as any}
                label={col.name}
                count={getTaskCountForStatus(col.id)}
                isActive={activeTab === col.id}
                onSelect={() => onSelectTab(col.id)}
              />
            ))}
          </div>
        )}

        {/* Dynamic Board Columns */}
        <div className="board">
          {columns.length === 0 && activeProject && (
            <div className="board-empty-state">
              <p>No columns found for this project.</p>
            </div>
          )}

          <SortableContext
            items={columnSortableIds}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => {
              const colTasks = tasks.filter((task: Task) => {
                if (!task) return false;
                const taskStatusId = task.statusId ?? (task as any).status_id;
                return taskStatusId === col.id;
              });

              return (
                <SortableColumn
                  key={col.id}
                  column={col}
                  tasks={colTasks}
                  activeTab={activeTab}
                  isFilteredActive={isFilteredActive}
                />
              );
            })}
          </SortableContext>

          {/* Add Column Button */}
          {activeProject && (
            <div className="column add-column-wrapper">
              <div className="column-header column-header-desktop add-column-header-spacer">
                <span className="status-dot" style={{ opacity: 0 }} />
                <span style={{ opacity: 0 }}>Add Column</span>
              </div>
              <div className="column-drop-zone add-column-drop-zone">
                <button
                  type="button"
                  className="add-column-button"
                  onClick={onToggleAddColumnModal}
                >
                  <Plus size={14} />
                  <span>Add column</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="fab"
          aria-label="New task"
          onClick={onCreateTask}
        >
          <Plus size={20} />
        </button>
      </main>

      <DragOverlay>
        {draggingTask ? (
          <div className="task-card-overlay-wrapper">
            {overColumnStatus && overColumnStatus !== draggingTaskStatusId && (
              <div
                className={`jira-transition-badge jira-transition-badge-${targetMappedStatusClass}`}
              >
                <span>
                  {statusIdToNameMap[draggingTaskStatusId ?? ""] ||
                    "Current Column"}
                </span>
                <ArrowRight size={14} className="transition-arrow" />
                <span>
                  {statusIdToNameMap[overColumnStatus] || "Target Column"}
                </span>
              </div>
            )}
            <div className="task-card-overlay">
              <TaskOverlay task={draggingTask} />
            </div>
          </div>
        ) : draggingColumn ? (
          <div
            className={`column column-${(
              draggingColumn.mappedStatus || "DEFAULT"
            ).toLowerCase()} dragging-column-overlay`}
          >
            <div className="column-header column-header-desktop">
              <span
                className={`status-dot status-dot-${(
                  draggingColumn.mappedStatus || "DEFAULT"
                ).toLowerCase()}`}
              />
              <span>{draggingColumn.name}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DashboardBoard;
