import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project, Task, User, Statuss, Role } from "../components/types";

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Active Project & Tab
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  tasks: Task[] | null;
  setTasks: (task: Task[] | null) => void;

  statuses: Statuss[] | null;
  setStatuses: (statuses: Statuss[] | null) => void;

  userRole: "OWNER" | "MEMBER" | undefined;
  setUserRole: (role: Role | undefined) => void;

  // Menus
  isProjectMenuOpen: boolean;
  setProjectMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isUserMenuOpen: boolean;
  setUserMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // Global Modals
  isCreateTaskOpen: boolean;
  setCreateTaskOpen: (open: boolean) => void;
  isCreateProjectOpen: boolean;
  setCreateProjectOpen: (open: boolean) => void;
  isUserProfileModalOpen: boolean;
  setUserProfileModalOpen: (open: boolean) => void;

  projectToDelete: { id: string; name: string } | null;
  setProjectToDelete: (project: { id: string; name: string } | null) => void;

  selectedAssigneeId: string | null;
  setSelectedAssigneeId: (assigneeId: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      activeTab: "",
      setActiveTab: (activeTab) => set({ activeTab }),

      isProjectMenuOpen: false,
      setProjectMenuOpen: (val) =>
        set((state) => ({
          isProjectMenuOpen:
            typeof val === "function" ? val(state.isProjectMenuOpen) : val,
        })),

      activeProject: null,
      setActiveProject: (activeProject) => set({ activeProject }),

      userRole: undefined,
      setUserRole: (userRole) => set({ userRole }),

      tasks: null,
      setTasks: (tasks) => set({ tasks }),

      statuses: null,
      setStatuses: (statuses) => set({ statuses }),

      isUserMenuOpen: false,
      setUserMenuOpen: (val) =>
        set((state) => ({
          isUserMenuOpen:
            typeof val === "function" ? val(state.isUserMenuOpen) : val,
        })),

      isCreateTaskOpen: false,
      setCreateTaskOpen: (open) => set({ isCreateTaskOpen: open }),
      selectedAssigneeId: null,
      setSelectedAssigneeId: (selectedAssigneeId) =>
        set({ selectedAssigneeId }),
      isCreateProjectOpen: false,
      setCreateProjectOpen: (open) => set({ isCreateProjectOpen: open }),
      isUserProfileModalOpen: false,
      setUserProfileModalOpen: (open) => set({ isUserProfileModalOpen: open }),

      projectToDelete: null,
      setProjectToDelete: (project) => set({ projectToDelete: project }),
    }),
    {
      name: "task-tracker-store",
      partialize: (state) => ({
        activeProject: state.activeProject,
        user: state.user,
      }),
    },
  ),
);
