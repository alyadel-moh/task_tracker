import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useCreateTimeEntry from "../createTimeEntry";
import useUpdateUser from "../updateUserHook";
import { axiosInstance } from "../../api-client";
import { Task, TimeEntry, User } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Targeted Branch Coverage (createTimeEntry lines 45, 57 & updateUser line 57)", () => {
  let queryClient: QueryClient;

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

  it("covers createTimeEntry line 45 (non-array timeEntries fallback) and line 57 (omitted historyEntry)", async () => {
    const taskId = "task-coverage-45-57";

    // 1. Line 45: oldTimeEntries is truthy, but timeEntries property is NOT an array
    const malformedTimeCache = {
      unexpectedKey: "not an array",
      totalMinutes: 10,
    };
    queryClient.setQueryData(["time-entries", taskId], malformedTimeCache);

    // 2. Line 57: oldHistory exists, but backend response does not include historyEntry
    queryClient.setQueryData(["task_history", taskId], [{ id: "existing-hist-1" }]);

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: {
        timeEntry: { id: "entry-1", durationMinutes: 20 } as TimeEntry,
        status: "SUCCESS",
        overrun: false,
        message: "Created",
        // historyEntry omitted deliberately to test false branch of `if (data.historyEntry)`
      },
    });

    const { result } = renderHook(() => useCreateTimeEntry(taskId), { wrapper });

    result.current.mutate({ taskId, durationMinutes: 20 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Line 45 fallback check
    expect(queryClient.getQueryData(["time-entries", taskId])).toEqual(malformedTimeCache);

    // Line 57 fallback check
    expect(queryClient.getQueryData(["task_history", taskId])).toEqual([
      { id: "existing-hist-1" },
    ]);
  });

  it("covers updateUser line 57 (: oldTask.assignees when isCreator is true and isAssignee is false)", async () => {
    const loggedInUser: User = {
      id: "user-creator-id",
      name: "Old Creator",
      email: "creator@example.com",
    } as User;

    // Set user in cache BEFORE calling renderHook so currentUser is defined at hook initialization
    queryClient.setQueryData(["user"], loggedInUser);

    // Task where loggedInUser is the creator, but NOT in assignees
    const taskData: Task = {
      id: "task-creator-only",
      name: "Creator Task",
      creator: { id: "user-creator-id", name: "Old Creator" } as any,
      assignees: [{ id: "another-assignee-id", name: "Other Member" }] as any,
    } as Task;

    queryClient.setQueryData(["task", "p1", "task-creator-only"], taskData);

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        user: { name: "Updated Creator Name" },
        message: "User updated",
        status: "SUCCESS",
      },
    });

    const { result } = renderHook(() => useUpdateUser(), { wrapper });

    result.current.mutate({ name: "Updated Creator Name" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedTask = queryClient.getQueryData<Task>(["task", "p1", "task-creator-only"]);

    // Confirms isCreator path updated
    expect(updatedTask?.creator.name).toBe("Updated Creator Name");

    // Confirms line 57 `: oldTask.assignees` branch executed and assignees remain unchanged
    expect(updatedTask?.assignees).toEqual([
      { id: "another-assignee-id", name: "Other Member" },
    ]);
  });
});