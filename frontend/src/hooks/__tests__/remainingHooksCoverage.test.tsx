import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useAddMember from "../addMemberHook";
import useCreateProject from "../createProjectHook";
import useDeclineInvitation from "../declineInvitationHook";
import useCreateTimeEntry from "../createTimeEntry";
import { axiosInstance } from "../../api-client";
import {
  AssignedProjectMembership,
  pendingProjectMembership,
  ProjectMember,
  TimeEntry,
  HistoryEntry,
} from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Remaining Hooks 100% Branch Coverage", () => {
  let queryClient: QueryClient;
  const projectId = "p-test-100";
  const taskId = "t-test-200";

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("useAddMember (Line 43 Coverage)", () => {
    it("appends to existing members array, handles null cache, and logs on error", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleErrSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // 1. Appends to existing array
      queryClient.setQueryData<ProjectMember[]>(
        ["project-members", projectId],
        [{ id: "m1", role: "OWNER" } as ProjectMember],
      );

      const mockResponse = {
        message: "Invited",
        projectMember: { id: "m2", role: "MEMBER" } as ProjectMember,
      };
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const { result } = renderHook(() => useAddMember(projectId), { wrapper });
      result.current.mutate({ email: "test@example.com", role: "MEMBER" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      let cache = queryClient.getQueryData<ProjectMember[]>([
        "project-members",
        projectId,
      ]);
      expect(cache).toHaveLength(2);
      expect(cache?.[1].id).toBe("m2");

      // 2. Null cache returns single-item array
      queryClient.setQueryData(["project-members", projectId], null);
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: mockResponse,
      });
      result.current.mutate({ email: "test2@example.com", role: "MEMBER" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryData(["project-members", projectId])).toEqual([
        mockResponse.projectMember,
      ]);

      // 3. Line 43: Error logging branch with response fallback string
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(
        new Error("Add failed"),
      );
      result.current.mutate({ email: "fail@example.com", role: "MEMBER" });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrSpy).toHaveBeenCalledWith(
        "Error adding member:",
        "Add failed",
      );

      consoleLogSpy.mockRestore();
      consoleErrSpy.mockRestore();
    });
  });

  describe("useCreateProject (Lines 33, 39 Coverage)", () => {
    it("handles onMutate, array cache, null cache, non-array cache, and onError branch", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleErrSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const newMembership = {
        id: "pm-2",
        role: "OWNER",
        project: { id: "p2", name: "Project Two" },
      } as AssignedProjectMembership;

      const mockResponse = {
        status: "SUCCESS",
        message: "Created",
        assignedProjectMembership: newMembership,
      };

      // 1. Array cache append
      queryClient.setQueryData<AssignedProjectMembership[]>(
        ["assigned-projects"],
        [
          {
            id: "pm-1",
            project: { id: "p1", name: "Project One" },
          } as AssignedProjectMembership,
        ],
      );
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const { result } = renderHook(() => useCreateProject(), { wrapper });
      result.current.mutate({ name: "Project Two", description: "Desc" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(consoleLogSpy).toHaveBeenCalledWith("Creating project:", {
        name: "Project Two",
        description: "Desc",
      });
      let cache = queryClient.getQueryData<AssignedProjectMembership[]>([
        "assigned-projects",
      ]);
      expect(cache).toHaveLength(2);

      // 2. Null cache initialization
      queryClient.setQueryData(["assigned-projects"], null);
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: mockResponse,
      });
      result.current.mutate({ name: "Project Two", description: "Desc" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryData(["assigned-projects"])).toEqual([
        newMembership,
      ]);

      // 3. Line 33: Non-array cache fallback return
      queryClient.setQueryData(["assigned-projects"], { malformed: true });
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: mockResponse,
      });
      result.current.mutate({ name: "Project Two", description: "Desc" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryData(["assigned-projects"])).toEqual({
        malformed: true,
      });

      // 4. Line 39: onError callback
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(
        new Error("Failed to create project"),
      );
      result.current.mutate({ name: "Fail", description: "" });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrSpy).toHaveBeenCalledWith(
        "Error creating project:",
        expect.any(Error),
      );

      consoleLogSpy.mockRestore();
      consoleErrSpy.mockRestore();
    });
  });

  describe("useDeclineInvitation (Line 30 Coverage)", () => {
    it("filters out declined project, handles null cache, and tests error fallback message", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleErrSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // 1. Filters matching invitation and retains others
      queryClient.setQueryData<pendingProjectMembership[]>(
        ["pending-invitations"],
        [
          {
            id: "inv-1",
            project: { id: "p-decline", name: "Decline Me" },
          } as pendingProjectMembership,
          {
            id: "inv-2",
            project: { id: "p-keep", name: "Keep Me" },
          } as pendingProjectMembership,
        ],
      );

      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
        data: { message: "Declined successfully" },
      });

      const { result } = renderHook(() => useDeclineInvitation(), { wrapper });
      result.current.mutate("p-decline");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(axiosInstance.delete).toHaveBeenCalledWith(
        "/projects/invitations/p-decline/decline",
      );
      let cache = queryClient.getQueryData<pendingProjectMembership[]>([
        "pending-invitations",
      ]);
      expect(cache).toHaveLength(1);
      expect(cache?.[0].project.id).toBe("p-keep");

      // 2. Null cache returns []
      queryClient.setQueryData(["pending-invitations"], null);
      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
        data: { message: "Declined" },
      });
      result.current.mutate("p-decline");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryData(["pending-invitations"])).toEqual([]);

      // 3. Line 30: Error branch with missing response message fallback to error.message
      vi.mocked(axiosInstance.delete).mockRejectedValueOnce(
        new Error("Network drop"),
      );
      result.current.mutate("p-fail");
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrSpy).toHaveBeenCalledWith(
        "Error declining invitation:",
        "Network drop",
      );

      consoleLogSpy.mockRestore();
      consoleErrSpy.mockRestore();
    });
  });

  describe("useCreateTimeEntry (Line 76 Coverage)", () => {
    it("creates time entry, handles null history, and triggers onError logger", async () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleErrSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // 1. Initialized caches
      queryClient.setQueryData(["time-entries", taskId], {
        timeEntries: [{ id: "te-1", durationMinutes: 15 }],
        totalMinutes: 15,
      });
      queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

      const mockResponse = {
        status: "SUCCESS",
        message: "Entry created",
        timeEntry: { id: "te-2", durationMinutes: 20 } as TimeEntry,
        historyEntry: { id: "h2" } as HistoryEntry,
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const { result } = renderHook(() => useCreateTimeEntry(taskId), {
        wrapper,
      });
      result.current.mutate({ taskId, durationMinutes: 20 });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const timeCache = queryClient.getQueryData<any>(["time-entries", taskId]);
      expect(timeCache.timeEntries).toHaveLength(2);
      expect(timeCache.totalMinutes).toBe(35);

      const historyCache = queryClient.getQueryData<HistoryEntry[]>([
        "task_history",
        taskId,
      ]);
      expect(historyCache).toHaveLength(2);
      expect(historyCache?.[0].id).toBe("h2");

      // 2. Null history cache returns null
      queryClient.setQueryData(["task_history", taskId], null);
      queryClient.setQueryData(["time-entries", taskId], null);
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: {
          timeEntry: { id: "te-3", durationMinutes: 10 },
          historyEntry: { id: "h3" },
        },
      });
      result.current.mutate({ taskId, durationMinutes: 10 });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryData(["task_history", taskId])).toBeNull();

      // 3. Line 76: onError logger branch
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(
        new Error("Time log error"),
      );
      result.current.mutate({ taskId, durationMinutes: 10 });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(consoleErrSpy).toHaveBeenCalledWith(
        "Error creating time entry:",
        expect.any(Error),
      );

      consoleLogSpy.mockRestore();
      consoleErrSpy.mockRestore();
    });
  });
});
