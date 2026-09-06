import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useAppStore } from "../store/useAppStore";
import type { Project, Task, User, Statuss } from "../components/types";

const initialStoreState = useAppStore.getState();

describe("useAppStore", () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useAppStore.setState(initialStoreState, true);
    });
  });

  describe("Initial State", () => {
    it("initializes with default values", () => {
      const state = useAppStore.getState();

      expect(state.user).toBeNull();
      expect(state.activeProject).toBeNull();
      expect(state.activeTab).toBe("");
      expect(state.tasks).toBeNull();
      expect(state.statuses).toBeNull();
      expect(state.userRole).toBeUndefined();
      expect(state.isProjectMenuOpen).toBe(false);
      expect(state.isUserMenuOpen).toBe(false);
      expect(state.isCreateTaskOpen).toBe(false);
      expect(state.isCreateProjectOpen).toBe(false);
      expect(state.isUserProfileModalOpen).toBe(false);
      expect(state.projectToDelete).toBeNull();
    });
  });

  describe("Auth & User", () => {
    it("updates and clears the user state", () => {
      const mockUser: User = {
        id: "u1",
        name: "Aly Adel",
        email: "aly@example.com",
      };

      act(() => {
        useAppStore.getState().setUser(mockUser);
      });
      expect(useAppStore.getState().user).toEqual(mockUser);

      act(() => {
        useAppStore.getState().setUser(null);
      });
      expect(useAppStore.getState().user).toBeNull();
    });

    it("updates the user role", () => {
      act(() => {
        useAppStore.getState().setUserRole("OWNER");
      });
      expect(useAppStore.getState().userRole).toBe("OWNER");

      act(() => {
        useAppStore.getState().setUserRole("MEMBER");
      });
      expect(useAppStore.getState().userRole).toBe("MEMBER");

      act(() => {
        useAppStore.getState().setUserRole(undefined);
      });
      expect(useAppStore.getState().userRole).toBeUndefined();
    });
  });

  describe("Projects & Tabs", () => {
    it("updates activeProject", () => {
      const mockProject: Project = {
        id: "proj-1",
        name: "Task Tracker",
        description: "Fullstack App",
      };

      act(() => {
        useAppStore.getState().setActiveProject(mockProject);
      });
      expect(useAppStore.getState().activeProject).toEqual(mockProject);

      act(() => {
        useAppStore.getState().setActiveProject(null);
      });
      expect(useAppStore.getState().activeProject).toBeNull();
    });

    it("updates activeTab", () => {
      act(() => {
        useAppStore.getState().setActiveTab("status-done");
      });
      expect(useAppStore.getState().activeTab).toBe("status-done");
    });
  });

  describe("Tasks & Statuses", () => {
    it("updates tasks list", () => {
      const mockTasks: Task[] = [
        { id: "t1", title: "Write Tests", statusId: "s1" },
        { id: "t2", title: "Build Backend", statusId: "s2" },
      ];

      act(() => {
        useAppStore.getState().setTasks(mockTasks);
      });
      expect(useAppStore.getState().tasks).toEqual(mockTasks);

      act(() => {
        useAppStore.getState().setTasks(null);
      });
      expect(useAppStore.getState().tasks).toBeNull();
    });

    it("updates statuses list", () => {
      const mockStatuses: Statuss[] = [
        { id: "s1", name: "To Do" },
        { id: "s2", name: "Done" },
      ];

      act(() => {
        useAppStore.getState().setStatuses(mockStatuses);
      });
      expect(useAppStore.getState().statuses).toEqual(mockStatuses);

      act(() => {
        useAppStore.getState().setStatuses(null);
      });
      expect(useAppStore.getState().statuses).toBeNull();
    });
  });

  describe("Menus & Functional Toggles", () => {
    it("sets isProjectMenuOpen via direct boolean and updater function", () => {
      act(() => {
        useAppStore.getState().setProjectMenuOpen(true);
      });
      expect(useAppStore.getState().isProjectMenuOpen).toBe(true);

      act(() => {
        useAppStore.getState().setProjectMenuOpen((prev) => !prev);
      });
      expect(useAppStore.getState().isProjectMenuOpen).toBe(false);
    });

    it("sets isUserMenuOpen via direct boolean and updater function", () => {
      act(() => {
        useAppStore.getState().setUserMenuOpen(true);
      });
      expect(useAppStore.getState().isUserMenuOpen).toBe(true);

      act(() => {
        useAppStore.getState().setUserMenuOpen((prev) => !prev);
      });
      expect(useAppStore.getState().isUserMenuOpen).toBe(false);
    });
  });

  describe("Modals & Delete Targets", () => {
    it("updates modal visibility states", () => {
      act(() => {
        useAppStore.getState().setCreateTaskOpen(true);
        useAppStore.getState().setCreateProjectOpen(true);
        useAppStore.getState().setUserProfileModalOpen(true);
      });

      const state = useAppStore.getState();
      expect(state.isCreateTaskOpen).toBe(true);
      expect(state.isCreateProjectOpen).toBe(true);
      expect(state.isUserProfileModalOpen).toBe(true);

      act(() => {
        useAppStore.getState().setCreateTaskOpen(false);
        useAppStore.getState().setCreateProjectOpen(false);
        useAppStore.getState().setUserProfileModalOpen(false);
      });

      const updatedState = useAppStore.getState();
      expect(updatedState.isCreateTaskOpen).toBe(false);
      expect(updatedState.isCreateProjectOpen).toBe(false);
      expect(updatedState.isUserProfileModalOpen).toBe(false);
    });

    it("updates projectToDelete target", () => {
      const deleteTarget = { id: "p-delete", name: "Target Project" };

      act(() => {
        useAppStore.getState().setProjectToDelete(deleteTarget);
      });
      expect(useAppStore.getState().projectToDelete).toEqual(deleteTarget);

      act(() => {
        useAppStore.getState().setProjectToDelete(null);
      });
      expect(useAppStore.getState().projectToDelete).toBeNull();
    });
  });

  describe("Persistence (partialize)", () => {
    it("persists only activeProject and user to localStorage", () => {
      const mockUser: User = { id: "u1", name: "Aly", email: "aly@test.com" };
      const mockProject: Project = { id: "p1", name: "Persisted Project" };

      act(() => {
        useAppStore.getState().setUser(mockUser);
        useAppStore.getState().setActiveProject(mockProject);
        useAppStore.getState().setActiveTab("ephemeral-tab");
        useAppStore.getState().setCreateTaskOpen(true);
      });

      const rawStored = localStorage.getItem("task-tracker-store");
      expect(rawStored).not.toBeNull();

      const parsed = JSON.parse(rawStored!);
      expect(parsed.state).toEqual({
        user: mockUser,
        activeProject: mockProject,
      });
      expect(parsed.state.activeTab).toBeUndefined();
      expect(parsed.state.isCreateTaskOpen).toBeUndefined();
    });
  });
});
