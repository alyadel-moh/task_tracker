import { useEffect, useState } from "react";
import {
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "../css/Dashboard.css";
import DashboardBoard from "./DashboardBoard";
import DashboardSidebar from "./DashboardSidebar";
import { type Project, type Status, type Task } from "./types";
import CreateProjectModal from "./createprojectmodal";
import useGetProjects from "../hooks/getProjectsHook";
import useGetTasks from "../hooks/getalltasksHook";
import useGetUser from "../hooks/meHook";
import useLogout from "../hooks/logoutHook";
import ProjectDetailsModal from "./Projectdetailsmodal";
import CreateTaskModal from "./Createtaskmodal";
import useUpdateTask from "../hooks/updateTaskHook";
import useDeleteProject from "../hooks/deleteProjectHook";
import { AlertTriangle, Loader2 } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Status>("TODO");
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const projectsQuery = useGetProjects();
  const { data: projectsData, refetch } = projectsQuery;
  const projects = projectsData ?? [];

  const tasksQuery = useGetTasks(activeProjectId);
  const { data: tasksData, refetch: refetchTasks } = tasksQuery;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const userQuery = useGetUser();
  const user = userQuery.data ?? null;

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
    if (!projectsData) {
      return;
    }

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

  const visibleTasks = activeProject
    ? tasks.filter((task) => task.projectId === activeProject.id)
    : tasks;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
  );

  const taskCount = (status: Status) =>
    visibleTasks.filter((task) => task.status === status).length;

  const handleDragStart = (event: DragStartEvent) => {
    const task = visibleTasks.find((item) => item.id === event.active.id);
    setDraggingTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const task = draggingTask;
    setDraggingTask(null);

    if (!over || !task) return;

    const overId = String(over.id);
    const newStatus = (
      overId.startsWith("tab-")
        ? overId.replace("tab-", "")
        : overId.replace("column-", "")
    ) as Status;

    if (newStatus === task.status) return;

    const previousStatus = task.status;

    // Optimistic UI update
    setTasks((current) =>
      current.map((t) =>
        t.id === active.id ? { ...t, status: newStatus } : t,
      ),
    );
    setActiveTab(newStatus);

    updateTaskMutation.mutate(
      {
        id: task.id,
        status: newStatus,
        name: task.name,
        description: task.description,
        priority: task.priority,
        estimatedTime: task.estimatedTime ?? null,
        dueDate: task.dueDate ?? null,
      },
      {
        onSuccess: () => {
          toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
          refetchTasks();
        },
        onError: (error: any) => {
          setTasks((current) =>
            current.map((t) =>
              t.id === active.id ? { ...t, status: previousStatus } : t,
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
        refetch();
        setActiveProjectId(null);
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
        userName={user?.name ?? "Guest"}
        userEmail={user?.email ?? "No email available"}
        onSelectProject={handleSelectProject}
        onCreateProject={handleOpenCreateProject}
        onLogout={handleLogout}
        onDeleteProject={() => setIsConfirmingDelete(true)}
      />

      <DashboardBoard
        activeProject={activeProject}
        tasks={visibleTasks}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        taskCount={taskCount}
        draggingTask={draggingTask}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        onEditProject={(projectId: string) => {
          const project = projects.find((p) => p.id === projectId);
          if (project) {
            setEditProject(project);
          }
        }}
        isProjectMenuOpen={isProjectMenuOpen}
        onToggleProjectMenu={() => setIsProjectMenuOpen((open) => !open)}
        isUserMenuOpen={isUserMenuOpen}
        onToggleUserMenu={() => setIsUserMenuOpen((open) => !open)}
        projects={projects}
        refetchProjects={refetch}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateTask={handleOpenCreateTask}
        onCreateProject={handleOpenCreateProject}
        userName={user?.name ?? "Guest"}
        userEmail={user?.email ?? "No email available"}
        onLogout={handleLogout}
        refetchTasks={refetchTasks}
      />

      {isCreateTaskOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateTaskOpen(false)}
          projectId={activeProjectId ?? ""}
          refetchTasks={refetchTasks}
        />
      )}

      {isCreateProjectOpen && (
        <CreateProjectModal
          onClose={() => {
            setIsCreateProjectOpen(false);
          }}
          refetchprojects={refetch}
        />
      )}

      {editProject && (
        <ProjectDetailsModal
          taskCount={
            visibleTasks.filter((task) => task.projectId === editProject.id)
              .length
          }
          project={editProject}
          onClose={() => setEditProject(null)}
          refetchProjects={refetch}
        />
      )}

      {/* Centered deletion confirmation modal overlay */}
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
              This permanently deletes the project and all {visibleTasks.length}{" "}
              of its tasks. This cannot be undone.
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
    </div>
  );
};

export default Dashboard;
