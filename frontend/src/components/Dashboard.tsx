import { useEffect, useState } from "react";
import {
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
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
import CreateTaskModal from "./createtaskmodal";
import TaskDetailsModal from "./Taskdetailsmodal";
import useUpdateTask from "../hooks/updateTaskHook";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Status>("todo");
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
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
  const userQuery = useGetUser();
  const user = userQuery.data ?? null;
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const updateTaskMutation = useUpdateTask(
    activeProjectId ?? "",
    draggingTask?.id ?? "",
  );

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

    setTasks((current) =>
      current.map((t) =>
        t.id === active.id ? { ...t, status: newStatus } : t,
      ),
    );
    setActiveTab(newStatus);

    updateTaskMutation.mutate(
      {
        status: newStatus,
        name: task.name,
        description: task.description,
        priority: task.priority,
        estimatedTime: task.estimatedTime ?? null,
        dueDate: task.dueDate ?? null,
      },
      {
        onSuccess: () => {
          refetchTasks();
        },
      },
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
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
    setIsProjectMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsCreateTaskOpen(true);
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
        onEditProject={(projectId: string) => {
          const project = projects.find((p) => p.id === projectId);
          if (project) {
            setEditProject(project);
          }
        }}
      />
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
      {editTask && (
        <TaskDetailsModal
          task={editTask}
          onClose={() => setEditTask(null)}
          refetchTasks={refetchTasks}
        />
      )}
      <DashboardBoard
        activeProject={activeProject}
        tasks={visibleTasks}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        taskCount={taskCount}
        draggingTask={draggingTask}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateTask={handleOpenCreateTask}
        onCreateProject={handleOpenCreateProject}
        userName={user?.name ?? "Guest"}
        userEmail={user?.email ?? "No email available"}
        onLogout={handleLogout}
        onEditTask={(taskId: string) => {
          const task = visibleTasks.find((t) => t.id === taskId);
          if (task) {
            setEditTask(task);
          }
        }}
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
    </div>
  );
};

export default Dashboard;
