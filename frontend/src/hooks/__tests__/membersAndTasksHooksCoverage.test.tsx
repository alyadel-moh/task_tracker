import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useRemoveMember from "../removeMemberHook";
import useUpdateRole from "../updateRoleHook";
import useGetTasks from "../getAllTasksHook";
import { axiosInstance } from "../../api-client";
import { Task, ProjectMember } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Member & Tasks Hooks Branch Coverage", () => {
  let queryClient: QueryClient;
  const projectId = "p100";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "valid-auth-token");
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

  describe("useRemoveMember", () => {
    it("filters assignees matching either id or userId, retaining unaffected assignees", async () => {
      const taskWithAssignees: Task = {
        id: "t1",
        projectId,
        name: "Task One",
        assignees: [
          { id: "u-match-id", name: "User 1" } as any,
          { userId: "u-match-userid", name: "User 2" } as any,
          { id: "u-keep", userId: "u-keep-id", name: "User 3" } as any,
        ],
      } as Task;

      const members: ProjectMember[] = [
        { id: "m1", user: { id: "u-match-id" } } as ProjectMember,
        { id: "m2", user: { id: "u-match-userid" } } as ProjectMember,
        { id: "m3", user: { id: "u-keep" } } as ProjectMember,
      ];

      queryClient.setQueryData(["task", projectId, "t1"], taskWithAssignees);
      queryClient.setQueryData(["project-members", projectId], members);

      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
        data: { message: "Member removed" },
      });

      const { result } = renderHook(() => useRemoveMember(projectId), {
        wrapper,
      });

      result.current.mutate({ id: "m1", userId: "u-match-id" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      let taskCache = queryClient.getQueryData<Task>(["task", projectId, "t1"]);
      expect(taskCache?.assignees).toHaveLength(2);
      expect(taskCache?.assignees.some((a: any) => a.id === "u-match-id")).toBe(
        false,
      );

      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
        data: { message: "Member removed" },
      });
      result.current.mutate({ id: "m2", userId: "u-match-userid" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      taskCache = queryClient.getQueryData<Task>(["task", projectId, "t1"]);
      expect(taskCache?.assignees).toHaveLength(1);
      expect(taskCache?.assignees[0].name).toBe("User 3");

      const membersCache = queryClient.getQueryData<ProjectMember[]>([
        "project-members",
        projectId,
      ]);
      expect(membersCache).toHaveLength(1);
      expect(membersCache?.[0].id).toBe("m3");
    });

    it("handles task without assignees and null project-members cache", async () => {
      queryClient.setQueryData(["task", projectId, "t1"], {
        id: "t1",
        name: "No Assignees",
      });
      queryClient.setQueryData(["project-members", projectId], null);

      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
        data: { message: "Removed" },
      });

      const { result } = renderHook(() => useRemoveMember(projectId), {
        wrapper,
      });

      result.current.mutate({ id: "m1", userId: "u1" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(queryClient.getQueryData(["project-members", projectId])).toEqual(
        [],
      );
    });

    it("triggers onError fallback when error.response is undefined (Line 39)", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.mocked(axiosInstance.delete).mockRejectedValueOnce(
        new Error("Network drop"),
      );

      const { result } = renderHook(() => useRemoveMember(projectId), {
        wrapper,
      });

      result.current.mutate({ id: "m1", userId: "u1" });
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error removing member:",
        "Network drop",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("useUpdateRole", () => {
    it("updates target member role while keeping others unchanged, and invalidates queries", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const members: ProjectMember[] = [
        { id: "m1", role: "MEMBER" } as ProjectMember,
        { id: "m2", role: "MEMBER" } as ProjectMember,
      ];
      queryClient.setQueryData(["project-members", projectId], members);

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
        data: { message: "Role updated", member: { id: "m1", role: "OWNER" } },
      });

      const { result } = renderHook(() => useUpdateRole(projectId), {
        wrapper,
      });

      result.current.mutate({ id: "m1", role: "OWNER" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cache = queryClient.getQueryData<ProjectMember[]>([
        "project-members",
        projectId,
      ]);
      expect(cache?.[0].role).toBe("OWNER");
      expect(cache?.[1].role).toBe("MEMBER");
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["project-members", projectId],
      });
    });

    it("returns empty array when project-members cache is null", async () => {
      queryClient.setQueryData(["project-members", projectId], null);

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
        data: { message: "Role updated" },
      });

      const { result } = renderHook(() => useUpdateRole(projectId), {
        wrapper,
      });

      result.current.mutate({ id: "m1", role: "OWNER" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(queryClient.getQueryData(["project-members", projectId])).toEqual(
        [],
      );
    });

    it("triggers onError fallback when error.response is missing (Line 39)", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.mocked(axiosInstance.patch).mockRejectedValueOnce(
        new Error("Timeout updating role"),
      );

      const { result } = renderHook(() => useUpdateRole(projectId), {
        wrapper,
      });

      result.current.mutate({ id: "m1", role: "OWNER" });
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error updating role:",
        "Timeout updating role",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("useGetTasks", () => {
    it("calls API using default undefined params and fallback serialization (Line 17)", () => {
      const { result } = renderHook(() => useGetTasks(), { wrapper });

      expect(result.current.fetchStatus).toBe("idle");
    });

    it("filters out empty/falsy items inside array params during serialization (Line 47)", async () => {
      let capturedConfig: any = null;

      vi.mocked(axiosInstance.get).mockImplementationOnce((_url, config) => {
        capturedConfig = config;
        return Promise.resolve({ data: [{ id: "t1", name: "Fetched Task" }] });
      });

      const { result } = renderHook(
        () =>
          useGetTasks({
            projectId: "p-unique-test-999",
            search: "login",
            statusId: ["status-1", "", "status-2"],
            priority: ["HIGH", "LOW"],
            overdue: true,
            assigneeId: "u123",
          }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(axiosInstance.get).toHaveBeenCalledWith(
        "tasks/p-unique-test-999",
        expect.any(Object),
      );

      expect(typeof capturedConfig?.paramsSerializer).toBe("function");

      const serializedString = capturedConfig.paramsSerializer(
        capturedConfig.params,
      );

      expect(serializedString).toContain("statusId=status-1");
      expect(serializedString).toContain("statusId=status-2");
      expect(serializedString).not.toContain("statusId=&");
    });
  });
});
