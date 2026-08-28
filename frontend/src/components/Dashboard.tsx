import { useEffect, useMemo, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "react-hot-toast";
import "../css/Dashboard.css";
import DashboardBoard from "./DashboardBoard";
import DashboardSidebar from "./DashboardSidebar";
import { Task, Statuss } from "./types";
import CreateProjectModal from "./CreateProjectModal";
import CreateTaskModal from "./CreateTaskModal";
import UserProfileModal from "./UserProfileModal";
import useGetProjects from "../hooks/getProjectsHook";
import useGetUser from "../hooks/meHook";
import useUpdateTask from "../hooks/updateTaskHook";
import useGetStatuses from "../hooks/getAllStatusesHook";
import useUpdateStatus from "../hooks/updateStatusHook";
import { useAppStore } from "../store/useAppStore";
import DeleteProjectModal from "./DeleteProjectModal";

const DEFAULT_STATUS_MAP: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  IN_REVIEW: "In Review",
};

export const formatStatusName = (rawName?: string): string => {
  if (rawName && typeof rawName === "string" && rawName.trim()) {
    const trimmed = rawName.trim();
    if (DEFAULT_STATUS_MAP[trimmed.toUpperCase()]) {
      return DEFAULT_STATUS_MAP[trimmed.toUpperCase()];
    }
    return trimmed;
  }
  return "Untitled Column";
};

const Dashboard = () => {
  // Global Store
  const {
    user: storedUser,
    setUser,
    setActiveTab,
    activeProject,
    setActiveProject,
    isCreateTaskOpen,
    setCreateTaskOpen,
    isCreateProjectOpen,
    setCreateProjectOpen,
    isUserProfileModalOpen,
    setUserProfileModalOpen,
    tasks,
    setTasks,
    statuses,
    setStatuses,
  } = useAppStore();

  // Drag & Drop State
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [draggingColumn, setDraggingColumn] = useState<Statuss | null>(null);
  const [overColumnStatus, setOverColumnStatus] = useState<string | null>(null);

  // Server Queries
  const { data: projectsData = [] } = useGetProjects();

  const resolvedProject = useMemo(() => {
    if (!projectsData?.length) return null;
    const match = projectsData.find((p: any) => {
      const projId = p?.project?.id || p?.id;
      return projId === activeProject?.id;
    });
    const target = match ?? projectsData[0];
    return target?.project || target || null;
  }, [projectsData, activeProject?.id]);

  useEffect(() => {
    if (activeProject?.id !== resolvedProject?.id) {
      setActiveProject(resolvedProject);
    }
  }, [resolvedProject, activeProject?.id, setActiveProject]);

  const projectId = activeProject?.id ?? "";

  const { data: fetchedStatuses } = useGetStatuses(projectId ?? "");
  const { data: fetchedUser } = useGetUser();

  const updateStatusMutation = useUpdateStatus(projectId ?? "");
  const updateTaskMutation = useUpdateTask(projectId ?? "");

  // Sync fetched user to global store
  useEffect(() => {
    if (fetchedUser) {
      setUser(fetchedUser);
    }
  }, [fetchedUser, setUser]);

  useEffect(() => {
    if (!fetchedStatuses || !Array.isArray(fetchedStatuses)) {
      if (!projectId) setStatuses([]);
      return;
    }

    // Only seed the store if it hasn't been loaded yet for this project
    if (statuses?.length === 0) {
      setStatuses(
        [...fetchedStatuses]
          .map((status: Statuss) => ({
            ...status,
            name: formatStatusName(status.name),
          }))
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)),
      );
    }
  }, [fetchedStatuses, projectId, setStatuses, statuses?.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);

    if (activeId.startsWith("col-")) {
      const colId = activeId.replace("col-", "");
      const foundColumn = statuses?.find((col) => col.id === colId);
      setDraggingColumn(foundColumn ?? null);
      return;
    }

    const task = tasks?.find((item) => item.id === event.active.id);
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
        const rawActiveId = activeId.replace(/^col-/, "");
        const rawOverId = overId.replace(/^col-/, "");

        const oldIndex =
          statuses?.findIndex((c) => String(c.id) === rawActiveId) ?? -1;
        const newIndex =
          statuses?.findIndex((c) => String(c.id) === rawOverId) ?? -1;

        if (oldIndex !== -1 && newIndex !== -1 && statuses) {
          const previousStatuses = [...statuses];

          // Move item in array and recalculate position for each item
          const reordered = arrayMove(statuses, oldIndex, newIndex).map(
            (col, index) => ({
              ...col,
              position: index,
            }),
          );

          // Immediately update local store to reflect visual position
          setStatuses(reordered);

          const draggedCol = statuses[oldIndex];
          const formattedName = formatStatusName(draggedCol?.name);

          updateStatusMutation.mutate(
            {
              status: {
                id: rawActiveId,
                position: newIndex,
              },
            },
            {
              onSuccess: () => {
                toast.success(`Column "${formattedName}" moved successfully!`);
              },
              onError: () => {
                setStatuses(previousStatuses);
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
    if (tasks) {
      setTasks(
        tasks.map((t) =>
          t.id === active.id ? { ...t, statusId: newStatusId } : t,
        ),
      );
    }
    setActiveTab(newStatusId);

    updateTaskMutation.mutate(
      {
        id: task.id,
        statusId: newStatusId,
      },
      {
        onSuccess: (data: any) => {
          toast.success(data?.message || "Task moved successfully!");
        },
        onError: (error: any) => {
          if (tasks) {
            setTasks(
              tasks.map((t) =>
                t.id === active.id ? { ...t, statusId: previousStatusId } : t,
              ),
            );
          }
          const apiError =
            error?.response?.data?.message ?? "Failed to update task status.";
          toast.error(apiError);
        },
      },
    );
  };

  const currentUser = fetchedUser ?? storedUser;

  return (
    <div className="dashboard">
      <DashboardSidebar />

      <DashboardBoard
        draggingTask={draggingTask}
        draggingColumn={draggingColumn}
        overColumnStatus={overColumnStatus}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      />
      <DeleteProjectModal />
      {isCreateTaskOpen && (
        <CreateTaskModal
          onClose={() => setCreateTaskOpen(false)}
          projectId={projectId ?? ""}
          userId={currentUser?.id ?? ""}
        />
      )}

      {isCreateProjectOpen && (
        <CreateProjectModal onClose={() => setCreateProjectOpen(false)} />
      )}

      {isUserProfileModalOpen && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setUserProfileModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
