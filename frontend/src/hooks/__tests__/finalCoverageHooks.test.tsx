import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useCreateTimeEntry from "../createTimeEntry";
import useLogin from "../loginHook";
import useRegister from "../registerHook";
import useUpdateUser from "../updateUserHook";
import { axiosInstance } from "../../api-client";
import { Task, TimeEntry, User } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Final 100% Branch Coverage Suite", () => {
  let queryClient: QueryClient;
  const taskId = "task-coverage-100";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  describe("useCreateTimeEntry (Lines 45 & 57)", () => {
    it("handles non-array timeEntries (line 45) and absent historyEntry (line 57)", async () => {
      // Line 45: oldTimeEntries exists, but timeEntries is not an array
      queryClient.setQueryData(["time-entries", taskId], {
        timeEntries: "invalid-shape",
        totalMinutes: 10,
      });

      // Line 57: task_history exists, but response omits historyEntry
      queryClient.setQueryData(["task_history", taskId], [{ id: "h1" }]);

      const mockResponse = {
        timeEntry: { id: "e1", durationMinutes: 25 } as TimeEntry,
        status: "SUCCESS",
        overrun: false,
        message: "Created",
        // historyEntry is omitted to test line 57
      };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockResponse });

      const { result } = renderHook(() => useCreateTimeEntry(taskId), { wrapper });

      result.current.mutate({ taskId, durationMinutes: 25 });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Validates Line 45 fallback
      expect(queryClient.getQueryData(["time-entries", taskId])).toEqual({
        timeEntries: "invalid-shape",
        totalMinutes: 10,
      });

      // Validates Line 57 fallback
      expect(queryClient.getQueryData(["task_history", taskId])).toEqual([{ id: "h1" }]);
    });
  });

  describe("useLogin (Line 31)", () => {
    it("logs error message when login fails (Line 31)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(
        new Error("Invalid login credentials"),
      );

      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate({ email: "aly@example.com", password: "wrong" });
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error logging in user:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("useRegister (Line 33)", () => {
    it("logs error message when register fails (Line 33)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(
        new Error("User already exists"),
      );

      const { result } = renderHook(() => useRegister(), { wrapper });

      result.current.mutate({
        name: "Aly",
        email: "aly@example.com",
        password: "password123",
      });
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error registering user:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("useUpdateUser (Line 57 & Line 74)", () => {
    it("preserves task.assignees when user is creator but NOT an assignee (Line 57)", async () => {
      const currentUser: User = {
        id: "user-1",
        name: "Old Creator Name",
        email: "creator@example.com",
      } as User;

      queryClient.setQueryData(["user"], currentUser);

      // Task where currentUser is creator, but assignees array does NOT contain currentUser
      const existingTask: Task = {
        id: "task-1",
        name: "Task",
        creator: { id: "user-1", name: "Old Creator Name" } as any,
        assignees: [{ id: "other-user", name: "Other User" }] as any,
      } as Task;

      queryClient.setQueryData(["task", "p1", "task-1"], existingTask);

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
        data: {
          user: { name: "New Creator Name" },
          message: "Updated",
          status: "SUCCESS",
        },
      });

      const { result } = renderHook(() => useUpdateUser(), { wrapper });

      result.current.mutate({ name: "New Creator Name" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const updatedTask = queryClient.getQueryData<Task>(["task", "p1", "task-1"]);

      // Creator is updated
      expect(updatedTask?.creator.name).toBe("New Creator Name");
      // Assignees branch fallback `: oldTask.assignees` is exercised and preserved
      expect(updatedTask?.assignees).toEqual([{ id: "other-user", name: "Other User" }]);
    });

    it("logs error message when updateUser API call fails (Line 74)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(axiosInstance.patch).mockRejectedValueOnce(
        new Error("Update user failed"),
      );

      const { result } = renderHook(() => useUpdateUser(), { wrapper });

      result.current.mutate({ name: "Fail" });
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error updating user:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});