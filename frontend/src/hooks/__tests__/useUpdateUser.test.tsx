import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useUpdateUser from "../updateUserHook";
import { axiosInstance } from "../../api-client";
import { Task, ProjectMember, User } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    patch: vi.fn(),
  },
}));

describe("useUpdateUser Complete 100% Branch Coverage", () => {
  let queryClient: QueryClient;
  const currentUserId = "user-me-123";

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

  it("covers Line 57: updates task when user is creator but NOT in assignees", async () => {
    // Seed logged in user FIRST so currentUser is populated at hook invocation
    const userMe: User = {
      id: currentUserId,
      name: "Aly Old",
      email: "aly@old.com",
    } as User;
    queryClient.setQueryData(["user"], userMe);

    // Task where user is creator, but assignees does NOT include user
    const task: Task = {
      id: "task-creator-branch",
      name: "Creator Task",
      creator: { id: currentUserId, name: "Aly Old" } as any,
      assignees: [{ id: "other-user-456", name: "Other Member" }] as any,
    } as Task;
    queryClient.setQueryData(["task", "p1", "task-creator-branch"], task);

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        user: { name: "Aly New" },
        message: "Updated",
        status: "SUCCESS",
      },
    });

    const { result } = renderHook(() => useUpdateUser(), { wrapper });
    result.current.mutate({ name: "Aly New" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedTask = queryClient.getQueryData<Task>(["task", "p1", "task-creator-branch"]);
    // Creator is updated
    expect(updatedTask?.creator.name).toBe("Aly New");
    // Line 57 fallback `: oldTask.assignees` is exercised
    expect(updatedTask?.assignees).toEqual([{ id: "other-user-456", name: "Other Member" }]);
  });

  it("covers task when user is assignee only, and project-members update", async () => {
    const userMe: User = { id: currentUserId, name: "Aly" } as User;
    queryClient.setQueryData(["user"], userMe);

    // Project members with both matching user and other user
    const members: ProjectMember[] = [
      { id: "m1", user: { id: currentUserId, name: "Aly" } } as ProjectMember,
      { id: "m2", user: { id: "other-user", name: "Other" } } as ProjectMember,
    ];
    queryClient.setQueryData(["project-members", "p1"], members);

    // Task where user is assignee but NOT creator
    const task: Task = {
      id: "task-assignee-branch",
      name: "Assignee Task",
      creator: { id: "someone-else", name: "Someone" } as any,
      assignees: [
        { id: currentUserId, name: "Aly" },
        { id: "other-user", name: "Other" },
      ],
    } as any;
    queryClient.setQueryData(["task", "p1", "task-assignee-branch"], task);

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        user: { name: "Aly Updated" },
        message: "Updated",
        status: "SUCCESS",
      },
    });

    const { result } = renderHook(() => useUpdateUser(), { wrapper });
    result.current.mutate({ name: "Aly Updated" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedMembers = queryClient.getQueryData<ProjectMember[]>(["project-members", "p1"]);
    expect(updatedMembers?.[0].user.name).toBe("Aly Updated");
    expect(updatedMembers?.[1].user.name).toBe("Other");

    const updatedTask = queryClient.getQueryData<Task>(["task", "p1", "task-assignee-branch"]);
    expect(updatedTask?.creator.name).toBe("Someone");
    expect(updatedTask?.assignees[0].name).toBe("Aly Updated");
    expect(updatedTask?.assignees[1].name).toBe("Other");
  });

  it("handles null caches and unaffected task early return", async () => {
    queryClient.setQueryData(["user"], null);
    queryClient.setQueryData(["project-members", "p1"], null);

    // Task where neither creator nor assignee matches (early return)
    const task: Task = {
      id: "task-unaffected",
      creator: { id: "unrelated-user" },
      assignees: [{ id: "another-unrelated-user" }],
    } as any;
    queryClient.setQueryData(["task", "p1", "task-unaffected"], task);

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        user: { name: "Aly" },
        message: "Updated",
        status: "SUCCESS",
      },
    });

    const { result } = renderHook(() => useUpdateUser(), { wrapper });
    result.current.mutate({ name: "Aly" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["user"])).toBeNull();
    expect(queryClient.getQueryData(["project-members", "p1"])).toBeNull();
    expect(queryClient.getQueryData(["task", "p1", "task-unaffected"])).toEqual(task);
  });

  it("covers onError branch when patch fails", async () => {
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(axiosInstance.patch).mockRejectedValueOnce(new Error("Patch failed"));

    const { result } = renderHook(() => useUpdateUser(), { wrapper });
    result.current.mutate({ name: "Aly" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleErr).toHaveBeenCalledWith("Error updating user:", expect.any(Error));
    consoleErr.mockRestore();
  });
});