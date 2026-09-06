import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useCreateTimeEntry from "../createTimeEntry";
import useUpdateUser from "../updateUserHook";
import { axiosInstance } from "../../api-client";
import { Task, TimeEntry, User, HistoryEntry } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Line 57 Absolute Coverage Fix", () => {
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

  it("hits createTimeEntry.ts line 57 by ensuring task_history is a populated array and response lacks historyEntry", async () => {
    const taskId = "cte-line-57";

    queryClient.setQueryData(["time-entries", taskId], {
      timeEntries: [{ id: "te-1", durationMinutes: 10 }],
      totalMinutes: 10,
    });

    // Populate task_history so `if (!oldHistory)` passes
    const initialHistory: HistoryEntry[] = [
      { id: "h1", fieldChanged: "status" } as HistoryEntry,
    ];
    queryClient.setQueryData(["task_history", taskId], initialHistory);

    // Response omits historyEntry, hitting `return oldHistory;` on line 57
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: {
        status: "SUCCESS",
        overrun: false,
        message: "Created",
        timeEntry: { id: "te-2", durationMinutes: 15 } as TimeEntry,
      },
    });

    const { result } = renderHook(() => useCreateTimeEntry(taskId), {
      wrapper,
    });
    result.current.mutate({ taskId, durationMinutes: 15 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const historyCache = queryClient.getQueryData<HistoryEntry[]>([
      "task_history",
      taskId,
    ]);
    expect(historyCache).toEqual(initialHistory);
  });

  it("hits updateUserHook.ts line 57 by setting user cache BEFORE rendering hook so isCreator is true and isAssignee is false", async () => {
    const userId = "user-line-57-id";

    // 1. SET USER IN CACHE BEFORE HOOK RENDERS
    const userMe: User = {
      id: userId,
      name: "Original Name",
      email: "test@example.com",
    } as User;
    queryClient.setQueryData(["user"], userMe);

    // 2. Set task where user is creator, but assignees does NOT contain userId
    const initialAssignees = [{ id: "other-user-99", name: "Other Guy" }];
    const task: Task = {
      id: "task-creator-only",
      name: "My Task",
      creator: { id: userId, name: "Original Name" } as any, // isCreator = true
      assignees: initialAssignees as any, // isAssignee = false -> hits line 57 ternary
    } as Task;

    queryClient.setQueryData(["task", "p1", "task-creator-only"], task);

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        user: { name: "Updated Name" },
        message: "Updated",
        status: "SUCCESS",
      },
    });

    // 3. Render hook after user cache is present
    const { result } = renderHook(() => useUpdateUser(), { wrapper });

    result.current.mutate({ name: "Updated Name" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedTask = queryClient.getQueryData<Task>([
      "task",
      "p1",
      "task-creator-only",
    ]);
    expect(updatedTask?.creator.name).toBe("Updated Name");
    expect(updatedTask?.assignees).toEqual(initialAssignees);
  });
});
