import { useEffect, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import "../css/Dashboard.css";
import DashboardBoard from "./DashboardBoard";
import DashboardSidebar from "./DashboardSidebar";
import { Project, Task, Statuss } from "./types";
import CreateProjectModal from "./CreateProjectModal";
import CreateTaskModal from "./CreateTaskModal";
import UserProfileModal from "./UserProfileModal";
import useGetProjects from "../hooks/getProjectsHook";
import useGetTasks from "../hooks/getAllTasksHook";
import useGetUser from "../hooks/meHook";
import useLogout from "../hooks/logoutHook";
import useUpdateTask from "../hooks/updateTaskHook";
import useDeleteProject from "../hooks/deleteProjectHook";
import useGetStatuses from "../hooks/getAllStatusesHook";
import useUpdateStatus from "../hooks/updateStatusHook";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("");
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [draggingColumn, setDraggingColumn] = useState<Statuss | null>(null);
  const [overColumnStatus, setOverColumnStatus] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Statuss[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const projectsQuery = useGetProjects();
  const { data: projectsData } = projectsQuery;
  const projects = projectsData ?? [];

  const statusesQuery = useGetStatuses(activeProjectId ?? "");
  const { data: fetchedStatuses = [] } = statusesQuery;

  const tasksQuery = useGetTasks({ projectId: activeProjectId ?? undefined });
  const { data: tasksData } = tasksQuery;

  const updateStatusMutation = useUpdateStatus(activeProjectId ?? "");
  const updateTaskMutation = useUpdateTask(activeProjectId ?? "");
  const deleteProjectMutation = useDeleteProject();

  const userQuery = useGetUser();
  const user = userQuery.data;

  const logoutMutation = useLogout();
  const navigate = useNavigate();

  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData);
    }
  }, [tasksData]);

  useEffect(() => {
    if (Array.isArray(fetchedStatuses)) {
      setStatuses(
        [...fetchedStatuses].sort(
          (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0),
        ),
      );
    }
  }, [fetchedStatuses]);

  useEffect(() => {
    if (!projectsData) return;
    if (!projectsData.length) {
      setActiveProjectId(null);
      return;
    }

    setActiveProjectId((currentProjectId) =>
      currentProjectId &&
      projectsData.some((project: Project) => project.id === currentProjectId)
        ? currentProjectId
        : projectsData[0].id,
    );
  }, [projectsData]);

  const activeProject =
    projects.find((project: Project) => project.id === activeProjectId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);

    if (activeId.startsWith("col-")) {
      const colId = activeId.replace("col-", "");
      const foundColumn = statuses.find((col) => col.id === colId);
      setDraggingColumn(foundColumn ?? null);
      return;
    }

    const task = tasks.find((item) => item.id === event.active.id);
    setDraggingTask(task ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    if (!over) {
      setOverColumnStatus(null);
      return;
    }

    const activeId = String(active.id);
    if (activeId.startsWith("col-")) return;

    const overId = String(over.id);
    const targetStatusId = overId.startsWith("tab-")
      ? overId.replace("tab-", "")
      : overId.startsWith("column-")
        ? overId.replace("column-", "")
        : overId.startsWith("col-")
          ? overId.replace("col-", "")
          : overId;

    setOverColumnStatus(targetStatusId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);

    // 1. Column Drag Reordering
    if (activeId.startsWith("col-")) {
      setDraggingColumn(null);
      if (!over) return;
      const overId = String(over.id);

      if (activeId !== overId && overId.startsWith("col-")) {
        const oldIndex = statuses.findIndex((c) => `col-${c.id}` === activeId);
        const newIndex = statuses.findIndex((c) => `col-${c.id}` === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const updated = arrayMove(statuses, oldIndex, newIndex);
          setStatuses(updated);
          const draggedColId = activeId.replace(/^col-/, "");

          updateStatusMutation.mutate(
            {
              status: {
                id: draggedColId,
                position: newIndex,
              },
            },
            {
              onError: () => {
                setStatuses(statuses);
                toast.error("Failed to update column position.");
              },
            },
          );
        }
      }
      return;
    }

    // 2. Task Card Drag & Drop
    const task = draggingTask;
    setDraggingTask(null);
    setOverColumnStatus(null);

    if (!over || !task) return;

    const overId = String(over.id);
    const newStatusId = overId.startsWith("tab-")
      ? overId.replace("tab-", "")
      : overId.startsWith("column-")
        ? overId.replace("column-", "")
        : overId.startsWith("col-")
          ? overId.replace("col-", "")
          : overId;

    const currentStatusId = task.statusId ?? (task as any).status_id;
    if (newStatusId === currentStatusId) return;

    const previousStatusId = currentStatusId;

    setTasks((current) =>
      current.map((t) =>
        t.id === active.id ? { ...t, statusId: newStatusId } : t,
      ),
    );
    setActiveTab(newStatusId);

    updateTaskMutation.mutate(
      {
        id: task.id,
        statusId: newStatusId,
      },
      {
        onSuccess: () => {
          toast.success("Task moved successfully!");
        },
        onError: (error: any) => {
          setTasks((current) =>
            current.map((t) =>
              t.id === active.id ? { ...t, statusId: previousStatusId } : t,
            ),
          );
          const apiError =
            error?.response?.data?.message ?? "Failed to update task status.";
          toast.error(apiError);
        },
      },
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Logged out successfully");
        navigate("/login");
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ??
          "Failed to log out. Please try again.";
        toast.error(apiError);
      },
    });
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setIsProjectMenuOpen(false);
  };

  const handleOpenCreateProject = () => {
    setIsProjectMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsUserProfileModalOpen(false);
    setIsCreateProjectOpen(true);
  };

  const handleOpenCreateTask = () => {
    if (!activeProjectId) {
      toast.error("Please select or create a project first.");
      return;
    }
    setIsProjectMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsUserProfileModalOpen(false);
    setIsCreateTaskOpen(true);
  };

  const handleDeleteProject = () => {
    if (!activeProject?.id) return;
    deleteProjectMutation.mutate(activeProject.id, {
      onSuccess: () => {
        toast.success("Project deleted successfully!");
        setIsConfirmingDelete(false);
        setActiveProjectId(null);
        setTasks([]);
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ??
          "Failed to delete project. Please try again.";
        toast.error(apiError);
      },
    });
  };

  return (
    <div className="dashboard">
      <DashboardSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        user={user ?? null}
        onSelectProject={handleSelectProject}
        onCreateProject={handleOpenCreateProject}
        onLogout={handleLogout}
        onDeleteProject={() => setIsConfirmingDelete(true)}
        onOpenUserProfileModal={() => setIsUserProfileModalOpen(true)}
      />

      <DashboardBoard
        activeProject={activeProject}
        tasks={tasks}
        statuses={statuses}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        draggingTask={draggingTask}
        draggingColumn={draggingColumn}
        overColumnStatus={overColumnStatus}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        isProjectMenuOpen={isProjectMenuOpen}
        onToggleProjectMenu={() => setIsProjectMenuOpen((open) => !open)}
        isUserMenuOpen={isUserMenuOpen}
        onToggleUserMenu={() => setIsUserMenuOpen((open) => !open)}
        onOpenUserProfileModal={() => {
          setIsUserMenuOpen(false);
          setIsUserProfileModalOpen(true);
        }}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateTask={handleOpenCreateTask}
        onCreateProject={handleOpenCreateProject}
        user={user ?? null}
        onLogout={handleLogout}
      />

      {isCreateTaskOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateTaskOpen(false)}
          projectId={activeProjectId ?? ""}
        />
      )}

      {isCreateProjectOpen && (
        <CreateProjectModal
          onClose={() => {
            setIsCreateProjectOpen(false);
          }}
        />
      )}

      {isConfirmingDelete && activeProject?.id && (
        <div
          className="modal-overlay"
          onClick={() => setIsConfirmingDelete(false)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon modal-header-icon-danger">
                <AlertTriangle size={18} aria-hidden="true" />
              </div>
            </div>

            <h2 className="modal-title">Delete "{activeProject.name}"?</h2>
            <p className="modal-subtitle">
              This permanently deletes the project and all {tasks.length} of its
              tasks. This cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-button modal-button-secondary"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={deleteProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-button modal-button-danger"
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isUserProfileModalOpen && (
        <UserProfileModal
          user={user ?? null}
          onClose={() => setIsUserProfileModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
