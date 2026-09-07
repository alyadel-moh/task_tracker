import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  closestCorners,
} from "@dnd-kit/core";

import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  Folder,
  LogOut,
  Plus,
  Search,
  X,
  AlertTriangle,
  ArrowRight,
  UserCog,
} from "lucide-react";
import { toast } from "react-hot-toast";
import TaskOverlay from "./TaskOverlay";
import SortableColumn from "./SortableColumn";
import AddColumnInline from "./AddColumnInline";
import MemberFilterGroup from "./MemberFilterGroup";
import { type Task, type Priority, type Statuss } from "./types";
import InlineEditField from "./InlineEditField";
import useUpdateProject from "../hooks/updateProjectHook";
import useGetTasks from "../hooks/getAllTasksHook";
import useGetProjectMembers from "../hooks/getAllprojectMembers";
import useGetAssignedProjects from "../hooks/getProjectsHook";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import useLogout from "../hooks/logoutHook";
interface DashboardBoardProps {
  draggingTask: Task | null;
  draggingColumn?: Statuss | null;
  overColumnStatus?: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: any;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

// Unified Status Color System
export const getStatusColorKey = (
  name?: string,
): "todo" | "in-progress" | "done" | "custom" => {
  if (!name) return "custom";
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
  if (normalized === "todo" || normalized === "to-do") return "todo";
  if (normalized === "inprogress" || normalized === "in-progress")
    return "in-progress";
  if (normalized === "done") return "done";
  return "custom";
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
  draggingTask,
  draggingColumn,
  overColumnStatus,
  onDragStart,
  onDragOver,
  sensors,
  onDragEnd,
}: DashboardBoardProps) => {
  const {
    user,
    setUser,
    setActiveTab,
    activeTab,
    activeProject,
    setActiveProject,
    setCreateTaskOpen,
    setCreateProjectOpen,
    setUserProfileModalOpen,
    tasks,
    setTasks,
    statuses,
    userRole,
    selectedAssigneeId,
    setSelectedAssigneeId,
  } = useAppStore();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const updateProjectMutation = useUpdateProject(activeProject?.id ?? "");
  const { data: projects = [] } = useGetAssignedProjects();
  const { data: projectMembersData = [] } = useGetProjectMembers(
    activeProject?.id ?? "",
  );
  const logoutMutation = useLogout();

  // Tasks Query with dynamic filtering
  const { data: fetchedTasks } = useGetTasks({
    projectId: activeProject?.id,
    search: searchQuery,
    statusId: selectedStatuses,
    priority: selectedPriorities,
    overdue: overdueOnly,
    assigneeId: selectedAssigneeId ?? undefined,
    createdById: selectedAssigneeId ?? undefined,
  });

  useEffect(() => {
    if (fetchedTasks) {
      setTasks(fetchedTasks);
    }
  }, [fetchedTasks, setTasks]);

  const columns: Statuss[] = useMemo(() => {
    if (!Array.isArray(statuses) || statuses.length === 0) return [];
    return statuses.filter((col): col is Statuss =>
      Boolean(col && typeof col === "object" && col.id),
    );
  }, [statuses]);

  useEffect(() => {
    if (
      columns.length > 0 &&
      (!activeTab || !columns.some((c) => c.id === activeTab))
    ) {
      setActiveTab(columns[0].id);
    }
  }, [columns, activeTab, setActiveTab]);

  const memberList = useMemo(() => {
    return (Array.isArray(projectMembersData) ? projectMembersData : []).map(
      (m: any) => ({
        id: m.user?.id,
        name: m.user?.name,
        email: m.user?.email,
        photoUrl: m.user?.photoUrl,
      }),
    );
  }, [projectMembersData]);

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

  const toggleStatusFilter = (statusId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId)
        ? prev.filter((id) => id !== statusId)
        : [...prev, statusId],
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
    setSelectedAssigneeId(null);
  };

  const isFilteredActive =
    searchQuery !== "" ||
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    overdueOnly ||
    selectedAssigneeId !== null;

  const handleSaveProjectField = (
    field: "name" | "description",
    value: string,
  ) => {
    if (!activeProject) return;
    setActiveProject({ ...activeProject, [field]: value });
    updateProjectMutation.mutate(
      { [field]: value },
      {
        onSuccess: (data: any) => {
          toast.success(
            data?.message || `Project ${field} updated successfully!`,
          );
        },
        onError: (error: any) => {
          const apiError =
            error?.response?.data?.message ??
            "Failed to update project. Please try again.";
          toast.error(apiError);
        },
      },
    );
  };

  const columnSortableIds = useMemo(
    () => columns.map((c) => `col-${c.id}`),
    [columns],
  );

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUser(null);
        toast.success("Logged out successfully");
        navigate("/login", { replace: true });
      },
      onError: () => {
        setUser(null);
        navigate("/login", { replace: true });
      },
    });
  };

  const draggingTaskStatusId =
    draggingTask?.statusId ?? (draggingTask as any)?.status_id;

  const targetStatusName = overColumnStatus
    ? statusIdToNameMap[overColumnStatus]
    : "";
  const targetColorKey = getStatusColorKey(targetStatusName);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      collisionDetection={closestCorners}
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
                    readOnly={userRole === "MEMBER"}
                  />
                  <span className="task-count-badge">
                    {tasks?.length} {tasks?.length === 1 ? "task" : "tasks"}
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
                    readOnly={userRole === "MEMBER"}
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
              onClick={() => setCreateTaskOpen(true)}
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
              onClick={() => setIsProjectMenuOpen((prev) => !prev)}
              aria-expanded={isProjectMenuOpen}
            >
              <span>Projects</span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={isProjectMenuOpen ? "chevron-open" : ""}
              />
            </button>
            <button
              type="button"
              className="mobile-user-button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
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

          {activeProject && (
            <div className="mobile-project-title-row">
              <InlineEditField
                label=""
                value={activeProject.name}
                onSave={(val) => handleSaveProjectField("name", val)}
                readOnly={userRole === "MEMBER"}
              />
            </div>
          )}

          {activeProject && (
            <div className="board-description-row mobile-project-description-row">
              <InlineEditField
                label=""
                type="textarea"
                optional
                value={activeProject.description ?? ""}
                placeholder="Add a project description..."
                onSave={(val) => handleSaveProjectField("description", val)}
                readOnly={userRole === "MEMBER"}
              />
            </div>
          )}
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

        {/* Filter Toolbar */}
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
              {/* Member Avatar Filter */}
              {memberList.length > 0 && (
                <div className="filter-pills-group">
                  <span className="filter-label">Assignee:</span>
                  <MemberFilterGroup members={memberList} />
                </div>
              )}

              {/* Status Filters */}
              {columns.length > 0 && (
                <div className="filter-pills-group">
                  <span className="filter-label">Status:</span>
                  {columns.map((col) => {
                    const active = selectedStatuses.includes(col.id);
                    const colorKey = getStatusColorKey(col.name);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        data-status-color={colorKey}
                        className={`filter-pill ${active ? "active" : ""}`}
                        onClick={() => toggleStatusFilter(col.id)}
                      >
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Priority Filters */}
              <div className="filter-pills-group">
                <span className="filter-label">Priority:</span>
                {PRIORITY_OPTIONS.map((opt) => {
                  const active = selectedPriorities.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-priority={opt.value}
                      className={`filter-pill ${active ? "active" : ""}`}
                      onClick={() => togglePriorityFilter(opt.value)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                {/* Overdue Filter */}
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
              </div>

              {/* Reset Filters */}
              {isFilteredActive && (
                <button
                  type="button"
                  className="filter-pill filter-pill-clear"
                  onClick={handleResetFilters}
                >
                  <X size={13} aria-hidden="true" />
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
              onClick={() => setIsUserMenuOpen(false)}
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
                  setIsUserMenuOpen(false);
                  setUserProfileModalOpen(true);
                }}
              >
                <UserCog size={16} aria-hidden="true" />
                <span>Account Settings</span>
              </button>

              <button
                type="button"
                className="mobile-project-menu-item mobile-project-menu-item-danger"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleLogout();
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
              {projects.map((item: any) => {
                const project = item?.project || item;
                if (!project?.id) return null;

                return (
                  <div key={project.id} className="project-item-row">
                    <button
                      type="button"
                      className={`mobile-project-menu-item ${
                        project.id === activeProject?.id
                          ? "mobile-project-menu-item-active"
                          : ""
                      }`}
                      onClick={() => {
                        setActiveProject(project);
                        setIsProjectMenuOpen(false);
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
                        setIsProjectMenuOpen(false);
                      }}
                    ></button>
                  </div>
                );
              })}

              <button
                type="button"
                className="mobile-project-menu-item mobile-project-menu-item-new"
                onClick={() => {
                  setIsProjectMenuOpen(false);
                  setCreateProjectOpen(true);
                }}
              >
                <Plus size={16} aria-hidden="true" />
                <span>New project</span>
              </button>
            </div>
          </>
        )}
        {/* Mobile Column Tab Bar — scrollable left/right */}
        {activeProject && columns.length > 0 && (
          <div className="column-tabs">
            {columns.map((col) => {
              const colorKey = getStatusColorKey(col.name);
              const isActive = activeTab === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  className={`column-tab ${isActive ? "column-tab-active" : ""}`}
                  onClick={() => setActiveTab(col.id)}
                >
                  <span className={`status-dot status-dot-${colorKey}`} />
                  <span>{col.name}</span>
                  <span className="column-count">
                    {getTaskCountForStatus(col.id)}
                  </span>
                </button>
              );
            })}
            <div className="mobile-add-column-inline">
              <AddColumnInline />
            </div>
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
              const colTasks = tasks?.filter((task: Task) => {
                if (!task) return false;
                const taskStatusId = task.statusId ?? (task as any).status_id;
                return taskStatusId === col.id;
              });

              return (
                <SortableColumn
                  key={col.id}
                  column={col}
                  tasks={colTasks ?? []}
                  isFilteredActive={isFilteredActive}
                />
              );
            })}
          </SortableContext>

          {activeProject && <AddColumnInline />}
        </div>

        <button
          type="button"
          className="fab"
          aria-label="New task"
          onClick={() => setCreateTaskOpen(true)}
        >
          <Plus size={20} />
        </button>
      </main>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {draggingTask ? (
          <div className="task-card-overlay-wrapper">
            {overColumnStatus && overColumnStatus !== draggingTaskStatusId && (
              <div
                className={`jira-transition-badge jira-transition-badge-${targetColorKey}`}
              >
                <span>
                  {statusIdToNameMap[draggingTaskStatusId ?? ""] ||
                    "Current Column"}
                </span>
                <ArrowRight size={14} className="transition-arrow" />
                <span>{targetStatusName || "Target Column"}</span>
              </div>
            )}
            <div
              className={`task-card-overlay task-card-overlay-${targetColorKey}`}
            >
              <TaskOverlay task={draggingTask} />
            </div>
          </div>
        ) : draggingColumn ? (
          <div className="column dragging-column-overlay">
            <div className="column-header column-header-desktop">
              <div className="column-header-left">
                <span
                  className={`status-dot status-dot-${getStatusColorKey(
                    draggingColumn.name,
                  )}`}
                />
                <span className="column-name-static">
                  {draggingColumn.name}
                </span>
                <span className="column-count">
                  {getTaskCountForStatus(draggingColumn.id)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DashboardBoard;
