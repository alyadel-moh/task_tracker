import { useEffect, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "../css/Dashboard.css";
import DashboardBoard from "./DashboardBoard";
import DashboardSidebar from "./DashboardSidebar";
import { Project, Task } from "./types";
import CreateProjectModal from "./CreateProjectModal";
import useGetProjects from "../hooks/getProjectsHook";
import useGetTasks from "../hooks/getAllTasksHook";
import useGetUser from "../hooks/meHook";
import useLogout from "../hooks/logoutHook";
import CreateTaskModal from "./CreateTaskModal";
import useUpdateTask from "../hooks/updateTaskHook";
import useDeleteProject from "../hooks/deleteProjectHook";
import { AlertTriangle, Loader2 } from "lucide-react";
import UserProfileModal from "./UserProfileModal";
import CreateStatusModal from "./CreateStatusModal";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("");
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [overColumnStatus, setOverColumnStatus] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);

  const projectsQuery = useGetProjects();
  const { data: projectsData } = projectsQuery;
  const projects = projectsData ?? [];

  const tasksQuery = useGetTasks({ projectId: activeProjectId ?? undefined });
  const { data: tasksData } = tasksQuery;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const userQuery = useGetUser();
  const user = userQuery.data;

  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const updateTaskMutation = useUpdateTask(activeProjectId ?? "");
  const deleteProjectMutation = useDeleteProject();

  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData);
    }
  }, [tasksData]);

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
    const task = tasks.find((item) => item.id === event.active.id);
    setDraggingTask(task ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnStatus(null);
      return;
    }

    const overId = String(over.id);
    const targetStatusId = overId.startsWith("tab-")
      ? overId.replace("tab-", "")
      : overId.startsWith("column-")
        ? overId.replace("column-", "")
        : overId;

    setOverColumnStatus(targetStatusId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const task = draggingTask;
    setDraggingTask(null);
    setOverColumnStatus(null);

    if (!over || !task) return;

    const overId = String(over.id);
    const newStatusId = overId.startsWith("tab-")
      ? overId.replace("tab-", "")
      : overId.startsWith("column-")
        ? overId.replace("column-", "")
        : overId;

    const currentStatusId = task.statusId ?? (task as any).status_id;
    if (newStatusId === currentStatusId) return;

    const previousStatusId = currentStatusId;

    // Optimistic UI update
    setTasks((current) =>
      current.map((t) =>
        t.id === active.id ? { ...t, statusId: newStatusId } : t,
      ),
    );
    setActiveTab(newStatusId);

    updateTaskMutation.mutate(
      {
        task: {
          id: task.id,
          statusId: newStatusId,
          name: task.name,
          description: task.description,
          priority: task.priority,
          estimatedTime: task.estimatedTime ?? null,
          dueDate: task.dueDate ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Task moved to " + newStatusId + "  successfully!");
        },
        onError: (error: any) => {
          // Revert state on network/server error
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
    setIsCreateProjectOpen(true);
  };

  const handleOpenCreateTask = () => {
    if (!activeProjectId) {
      toast.error("Please select or create a project first.");
      return;
    }
    setIsProjectMenuOpen(false);
    setIsUserMenuOpen(false);
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
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        draggingTask={draggingTask}
        overColumnStatus={overColumnStatus}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        isProjectMenuOpen={isProjectMenuOpen}
        onToggleProjectMenu={() => setIsProjectMenuOpen((open) => !open)}
        isUserMenuOpen={isUserMenuOpen}
        onOpenUserProfileModal={() => setIsUserProfileModalOpen(true)}
        onToggleUserMenu={() => setIsUserMenuOpen((open) => !open)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateTask={handleOpenCreateTask}
        onCreateProject={handleOpenCreateProject}
        user={user ?? null}
        onLogout={handleLogout}
        onToggleAddColumnModal={() => setIsAddColumnModalOpen((open) => !open)}
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
      {isAddColumnModalOpen && (
        <CreateStatusModal
          onClose={() => setIsAddColumnModalOpen(false)}
          projectId={activeProjectId ?? ""}
        />
      )}
    </div>
  );
};

export default Dashboard;
