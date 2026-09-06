import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "../../api-client";
import useAcceptInvitation from "../acceptInvitationHook";
import useAddMember from "../addMemberHook";
import useCreateStatus from "../createStatusHook";
import useDeleteStatus from "../deleteStatusHook";
import useDeclineInvitation from "../declineInvitationHook";
import useGetStatuses from "../getAllStatusesHook";
import useGetProjectMembers from "../getAllprojectMembers";
import useGetPendingInvitations from "../getPendingInvitations";
import useGetAssignedProjects from "../getProjectsHook";
import useGetTaskHistory from "../getTaskHistoryHook";
import { useForgotPassword, useResetPassword } from "../forgetPasswordHook";
import { useResendVerification } from "../handleResendEmailHook";
import useLeaveProject from "../leaveProjectHook";
import useLogout from "../logoutHook";
import useRemoveMember from "../removeMemberHook";
import useRemovePendingMember from "../removePendingMemberHook";
import useUpdateProject from "../updateProjectHook";
import useUpdateRole from "../updateRoleHook";
import useUpdateStatus from "../updateStatusHook";
import useUpdateUser from "../updateUserHook";
import useCreateTimeEntry from "../createTimeEntry";
import useUpdateTask from "../updateTaskHook";
import useUpdateTimeEntry from "../updateTimeEntry";
import useCreateProject from "../createProjectHook";
import useCreateTask from "../createTaskHook";
import useDeleteTask from "../deleteTaskHook";
import useDeleteTimeEntry from "../deleteTimeEntry";
import useLogin from "../loginHook";
import { useVerifyOtp } from "../verifyOtpHook";
import { useVerifyUpdatedEmailOtp } from "../verifyUpdatedEmailHook";
import { uploadImageToCloudinary } from "../UploadPhoto";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const makeClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const makeWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("frontend hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: [] });
    const response = {
      message: "ok",
      assignedprojectMembership: { project: { id: "p1" } },
      newStatus: { id: "s1" },
      projectMember: {
        id: "m1",
        projectId: "p1",
        userId: "u2",
        role: "MEMBER",
      },
      project: { id: "p1" },
      user: { id: "u1", name: "Updated" },
    };
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: response });
    vi.mocked(axiosInstance.patch).mockResolvedValue({ data: response });
    vi.mocked(axiosInstance.delete).mockResolvedValue({ data: response });
  });

  it("loads every untested query hook", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);
    const hooks = [
      () => useGetStatuses("p1"),
      () => useGetProjectMembers("p1"),
      () => useGetPendingInvitations(),
      () => useGetAssignedProjects(),
      () => useGetTaskHistory("t1"),
    ];
    for (const hook of hooks) {
      const { result } = renderHook(hook, { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    }
    expect(axiosInstance.get).toHaveBeenCalled();
  });

  it("executes invitation, member, status, project, and auth mutations", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);
    const cases: Array<[any, any]> = [
      [() => useAcceptInvitation(), "p1"],
      [() => useAddMember("p1"), { email: "user@example.com", role: "MEMBER" }],
      [() => useCreateStatus("p1"), { name: "Review" }],
      [() => useDeleteStatus("p1"), "s1"],
      [() => useDeclineInvitation(), "p1"],
      [() => useLeaveProject("p1"), "p1"],
      [() => useLogout(), undefined],
      [() => useRemoveMember("p1"), { id: "m1", userId: "u2" }],
      [() => useRemovePendingMember("p1"), "m1"],
      [() => useUpdateProject("p1"), { name: "Updated" }],
      [() => useUpdateRole("p1"), { id: "m1", role: "MEMBER" }],
      [() => useUpdateStatus("p1"), { status: { id: "s1", name: "Review" } }],
      [() => useUpdateUser(), { name: "Updated" }],
      [
        () => useVerifyOtp(),
        { email: "user@example.com", otp: "123456", token: "t" },
      ],
      [
        () => useVerifyUpdatedEmailOtp(),
        { newEmail: "new@example.com", otp: "123456", token: "t" },
      ],
      [() => useResendVerification(), { email: "user@example.com" }],
      [() => useForgotPassword(), { email: "user@example.com" }],
      [
        () => useResetPassword(),
        {
          email: "user@example.com",
          otp: "123456",
          newPassword: "password",
          resetToken: "t",
        },
      ],
    ];
    for (const [hook, payload] of cases) {
      const { result } = renderHook(hook, { wrapper });
      await expect(result.current.mutateAsync(payload)).resolves.toBeDefined();
    }
    expect(axiosInstance.post).toHaveBeenCalled();
    expect(axiosInstance.patch).toHaveBeenCalled();
    expect(axiosInstance.delete).toHaveBeenCalled();
  });

  it("handles mutation failures through React Query error states", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);
    const cases = [
      [() => useAcceptInvitation(), "p1"],
      [() => useAddMember("p1"), { email: "user@example.com", role: "MEMBER" }],
      [() => useCreateStatus("p1"), { name: "Review" }],
      [() => useDeleteStatus("p1"), "s1"],
      [() => useDeclineInvitation(), "p1"],
      [() => useLeaveProject("p1"), "p1"],
      [() => useLogout(), undefined],
      [() => useRemoveMember("p1"), { id: "m1", userId: "u2" }],
      [() => useRemovePendingMember("p1"), "m1"],
      [() => useUpdateProject("p1"), { name: "Updated" }],
      [() => useUpdateRole("p1"), { id: "m1", role: "MEMBER" }],
      [() => useUpdateStatus("p1"), { status: { id: "s1", name: "Review" } }],
      [() => useUpdateUser(), { name: "Updated" }],
      [
        () => useVerifyOtp(),
        { email: "user@example.com", otp: "123456", token: "t" },
      ],
      [
        () => useVerifyUpdatedEmailOtp(),
        { newEmail: "new@example.com", otp: "123456", token: "t" },
      ],
      [() => useResendVerification(), { email: "user@example.com" }],
      [() => useForgotPassword(), { email: "user@example.com" }],
      [
        () => useResetPassword(),
        {
          email: "user@example.com",
          otp: "123456",
          newPassword: "password",
          resetToken: "t",
        },
      ],
    ] as const;

    vi.mocked(axiosInstance.post).mockRejectedValue(
      new Error("request failed"),
    );
    vi.mocked(axiosInstance.patch).mockRejectedValue(
      new Error("request failed"),
    );
    vi.mocked(axiosInstance.delete).mockRejectedValue(
      new Error("request failed"),
    );

    for (const [hook, payload] of cases) {
      const { result } = renderHook(hook, { wrapper });
      await expect(result.current.mutateAsync(payload)).rejects.toThrow(
        "request failed",
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
    }
  });

  it("covers leaveProjectHook, updateStatusHook, and removePendingMemberHook cache branches and error fallbacks", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);

    // 1. leaveProjectHook with populated caches (matching and non-matching)
    queryClient.setQueryData(
      ["project-members", "p1"],
      [
        { id: "m1", projectId: "p1" },
        { id: "m2", projectId: "p2" },
      ],
    );
    queryClient.setQueryData(
      ["assigned-projects"],
      [
        { project: { id: "p1", name: "Project 1" } },
        { project: { id: "p2", name: "Project 2" } },
      ],
    );
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { message: "Left project" },
    });
    const leaveHook = renderHook(() => useLeaveProject("p1"), { wrapper });
    await leaveHook.result.current.mutateAsync("p1");

    expect(queryClient.getQueryData<any[]>(["project-members", "p1"])).toEqual([
      { id: "m2", projectId: "p2" },
    ]);
    expect(queryClient.getQueryData<any[]>(["assigned-projects"])).toEqual([
      { project: { id: "p2", name: "Project 2" } },
    ]);

    // 2. leaveProjectHook with null/undefined caches
    queryClient.setQueryData(["project-members", "p1"], null);
    queryClient.setQueryData(["assigned-projects"], null);
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { message: "Left again" },
    });
    const leaveHookNull = renderHook(() => useLeaveProject("p1"), { wrapper });
    await leaveHookNull.result.current.mutateAsync("p1");

    expect(queryClient.getQueryData(["project-members", "p1"])).toEqual([]);
    expect(queryClient.getQueryData(["assigned-projects"])).toEqual([]);

    // 3. leaveProjectHook onError fallback when response is absent
    vi.mocked(axiosInstance.delete).mockRejectedValueOnce({
      message: "Network Error",
    });
    const leaveHookErr = renderHook(() => useLeaveProject("p1"), { wrapper });
    await expect(
      leaveHookErr.result.current.mutateAsync("p1"),
    ).rejects.toBeDefined();

    // 4. updateStatusHook with matching and non-matching status in cache
    queryClient.setQueryData(
      ["statuses", "p1"],
      [
        { id: "s1", name: "Old Name" },
        { id: "s2", name: "Keep Name" },
      ],
    );
    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: {
        newStatus: { id: "s1", name: "New Name" },
        status: "SUCCESS",
        message: "Updated",
      },
    });
    const statusHook = renderHook(() => useUpdateStatus("p1"), { wrapper });
    await statusHook.result.current.mutateAsync({
      status: { id: "s1", name: "New Name" },
    });
    expect(queryClient.getQueryData<any[]>(["statuses", "p1"])).toEqual([
      { id: "s1", name: "New Name" },
      { id: "s2", name: "Keep Name" },
    ]);

    // 5. removePendingMemberHook with populated cache (filter test)
    queryClient.setQueryData(
      ["project-members", "p1"],
      [
        { id: "inv-1", name: "User 1" },
        { id: "inv-2", name: "User 2" },
      ],
    );
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { message: "Removed invitation" },
    });
    const removePendingHook = renderHook(() => useRemovePendingMember("p1"), {
      wrapper,
    });
    await removePendingHook.result.current.mutateAsync("inv-1");
    expect(queryClient.getQueryData<any[]>(["project-members", "p1"])).toEqual([
      { id: "inv-2", name: "User 2" },
    ]);

    // 6. removePendingMemberHook with null cache
    queryClient.setQueryData(["project-members", "p1"], null);
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({
      data: { message: "Removed" },
    });
    const removePendingHookNull = renderHook(
      () => useRemovePendingMember("p1"),
      { wrapper },
    );
    await removePendingHookNull.result.current.mutateAsync("inv-1");
    expect(queryClient.getQueryData(["project-members", "p1"])).toEqual([]);

    // 7. removePendingMemberHook onError fallback when response data message is absent
    vi.mocked(axiosInstance.delete).mockRejectedValueOnce({
      message: "Delete error fallback",
    });
    const removePendingErr = renderHook(() => useRemovePendingMember("p1"), {
      wrapper,
    });
    await expect(
      removePendingErr.result.current.mutateAsync("inv-1"),
    ).rejects.toBeDefined();
  });

  it("updates related caches across empty and populated states", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);
    queryClient.setQueryData(["user"], { id: "u1", name: "Old" });
    queryClient.setQueryData(
      ["project-members", "p1"],
      [
        { id: "m1", user: { id: "u2" } },
        { id: "m2", user: { id: "u1", name: "Old" } },
      ],
    );
    queryClient.setQueryData(["task", "p1", "t1"], {
      id: "t1",
      creator: { id: "u1", name: "Old" },
      assignees: [{ id: "u2" }],
    });
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { user: { name: "New" }, message: "ok" },
    });
    const userHook = renderHook(() => useUpdateUser(), { wrapper });
    await userHook.result.current.mutateAsync({ name: "New" });
    expect(queryClient.getQueryData<any>(["user"])?.name).toBe("New");
    expect(
      queryClient.getQueryData<any>(["task", "p1", "t1"])?.creator.name,
    ).toBe("New");

    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { message: "removed" },
    });
    const removeHook = renderHook(() => useRemoveMember("p1"), { wrapper });
    await removeHook.result.current.mutateAsync({ id: "m1", userId: "u2" });
    expect(
      queryClient.getQueryData<any>(["project-members", "p1"]),
    ).toHaveLength(1);

    queryClient.setQueryData(["assigned-projects"], undefined);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { assignedprojectMembership: { project: { id: "p2" } } },
    });
    const acceptHook = renderHook(() => useAcceptInvitation(), { wrapper });
    await acceptHook.result.current.mutateAsync("p2");
    expect(queryClient.getQueryData<any>(["assigned-projects"])).toHaveLength(
      1,
    );

    queryClient.setQueryData(["statuses", "p1"], undefined);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { newStatus: { id: "s1", name: "Review" } },
    });
    const statusHook = renderHook(() => useUpdateStatus("p1"), { wrapper });
    await statusHook.result.current.mutateAsync({
      status: { id: "s1", name: "Review" },
    });
    expect(queryClient.getQueryData<any[]>(["statuses", "p1"])).toEqual([]);

    queryClient.setQueryData(["time-entries", "t1"], null);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { timeEntry: { id: "e1", durationMinutes: 20 } },
    });
    const entryHook = renderHook(() => useCreateTimeEntry("t1"), {
      wrapper,
    });
    await entryHook.result.current.mutateAsync({
      taskId: "t1",
      durationMinutes: 20,
    });
    expect(
      queryClient.getQueryData<any>(["time-entries", "t1"])?.totalMinutes,
    ).toBe(20);
  });

  it("covers populated cache branches for project, status, task, and time updates", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);

    queryClient.setQueryData(
      ["assigned-projects"],
      [
        { project: { id: "p1", name: "Old" } },
        { project: { id: "p2", name: "Other" } },
      ],
    );
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { project: { name: "New" } },
    });
    const projectHook = renderHook(() => useUpdateProject("p1"), { wrapper });
    await projectHook.result.current.mutateAsync({ name: "New" });
    expect(
      queryClient.getQueryData<any[]>(["assigned-projects"])?.[0].project.name,
    ).toBe("New");

    queryClient.setQueryData(
      ["statuses", "p1"],
      [
        { id: "s1", name: "Old" },
        { id: "s2", name: "Other" },
      ],
    );
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { newStatus: { id: "s3", name: "New" } },
    });
    const createStatusHook = renderHook(() => useCreateStatus("p1"), {
      wrapper,
    });
    await createStatusHook.result.current.mutateAsync({ name: "New" });
    expect(queryClient.getQueryData<any[]>(["statuses", "p1"])).toHaveLength(3);

    queryClient.setQueryData(
      ["tasks", "p1"],
      [
        { id: "t1", name: "Old" },
        { id: "t2", name: "Other" },
      ],
    );
    queryClient.setQueryData(["task", "p1", "t1"], { id: "t1", name: "Old" });
    queryClient.setQueryData(["task_history", "t1"], [{ id: "old-history" }]);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { task: { name: "New" }, historyEntries: [{ id: "new-history" }] },
    });
    const taskHook = renderHook(() => useUpdateTask("p1"), { wrapper });
    await taskHook.result.current.mutateAsync({ id: "t1", name: "New" });
    expect(queryClient.getQueryData<any[]>(["tasks", "p1"])?.[0].name).toBe(
      "New",
    );
    expect(
      queryClient.getQueryData<any[]>(["task_history", "t1"])?.[0].id,
    ).toBe("new-history");

    queryClient.setQueryData(["time-entries", "t1"], {
      timeEntries: [
        { id: "e1", durationMinutes: 10 },
        { id: "e2", durationMinutes: 5 },
      ],
      totalMinutes: 15,
    });
    queryClient.setQueryData(["task_history", "t1"], [{ id: "old-history" }]);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: {
        timeEntry: { durationMinutes: 20 },
        historyEntries: [{ id: "new-history" }],
      },
    });
    const timeEntryHook = renderHook(() => useUpdateTimeEntry("t1"), {
      wrapper,
    });
    await timeEntryHook.result.current.mutateAsync({
      id: "e1",
      note: "updated",
    });
    expect(
      queryClient.getQueryData<any>(["time-entries", "t1"])?.totalMinutes,
    ).toBe(25);
    expect(
      queryClient.getQueryData<any[]>(["task_history", "t1"])?.[0].id,
    ).toBe("new-history");
  });

  it("covers invitation and time-entry cache alternatives", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);
    queryClient.setQueryData(
      ["assigned-projects"],
      [{ project: { id: "p1" } }, { project: { id: "p2" } }],
    );
    queryClient.setQueryData(
      ["pending-invitations"],
      [{ project: { id: "p1" } }, { project: { id: "p2" } }],
    );
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { assignedprojectMembership: { project: { id: "p1" } } },
    });
    const acceptHook = renderHook(() => useAcceptInvitation(), { wrapper });
    await acceptHook.result.current.mutateAsync("p1");
    expect(queryClient.getQueryData<any[]>(["assigned-projects"])).toHaveLength(
      3,
    );
    expect(
      queryClient.getQueryData<any[]>(["pending-invitations"]),
    ).toHaveLength(1);

    queryClient.setQueryData(["time-entries", "t1"], {
      timeEntries: [{ id: "e1", durationMinutes: 10 }],
      totalMinutes: 10,
    });
    queryClient.setQueryData(["task_history", "t1"], [{ id: "h1" }]);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { timeEntry: { id: "e2", durationMinutes: 5 } },
    });
    const createEntryHook = renderHook(() => useCreateTimeEntry("t1"), {
      wrapper,
    });
    await createEntryHook.result.current.mutateAsync({
      taskId: "t1",
      durationMinutes: 5,
    });
    expect(
      queryClient.getQueryData<any>(["time-entries", "t1"])?.totalMinutes,
    ).toBe(15);
    expect(queryClient.getQueryData<any[]>(["task_history", "t1"])).toEqual([
      { id: "h1" },
    ]);

    queryClient.setQueryData(["time-entries", "t1"], null);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { historyEntries: [] },
    });
    const updateEntryHook = renderHook(() => useUpdateTimeEntry("t1"), {
      wrapper,
    });
    await updateEntryHook.result.current.mutateAsync({
      id: "e1",
      note: "changed",
    });
    expect(queryClient.getQueryData(["time-entries", "t1"])).toBeNull();
  });

  it("covers project, task, deletion, role, and login cache branches", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);
    const projectMembership = { project: { id: "p1", name: "New" } };

    queryClient.setQueryData(["assigned-projects"], null);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { assignedProjectMembership: projectMembership },
    });
    const projectHook = renderHook(() => useCreateProject(), { wrapper });
    await projectHook.result.current.mutateAsync({
      name: "New",
      description: "",
    });
    expect(queryClient.getQueryData<any[]>(["assigned-projects"])).toHaveLength(
      1,
    );

    queryClient.setQueryData(["tasks", "p1"], null);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { newTask: { id: "t1", name: "Task" } },
    });
    const createTaskHook = renderHook(() => useCreateTask("p1"), { wrapper });
    await createTaskHook.result.current.mutateAsync({
      name: "Task",
      description: "",
      statusId: "s1",
      priority: "LOW",
      estimatedTime: null,
      dueDate: null,
      assignees: [],
    });
    expect(queryClient.getQueryData<any[]>(["tasks", "p1"])).toHaveLength(1);

    queryClient.setQueryData(["tasks", "p1"], [{ id: "t1" }, { id: "t2" }]);
    queryClient.setQueryData(["task_history", "t1"], [{ id: "old" }]);
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { historyEntry: { id: "deleted" } },
    });
    const deleteTaskHook = renderHook(() => useDeleteTask("p1", "t1"), {
      wrapper,
    });
    await deleteTaskHook.result.current.mutateAsync();
    expect(queryClient.getQueryData<any[]>(["tasks", "p1"])).toHaveLength(1);
    expect(
      queryClient.getQueryData<any[]>(["task_history", "t1"])?.[0].id,
    ).toBe("deleted");

    queryClient.setQueryData(["time-entries", "t1"], {
      timeEntries: [
        { id: "e1", durationMinutes: 10 },
        { id: "e2", durationMinutes: 5 },
      ],
      totalMinutes: 15,
    });
    queryClient.setQueryData(["task_history", "t1"], [{ id: "old" }]);
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { historyEntry: { id: "deleted-entry" } },
    });
    const deleteEntryHook = renderHook(() => useDeleteTimeEntry("t1"), {
      wrapper,
    });
    await deleteEntryHook.result.current.mutateAsync("e1");
    expect(
      queryClient.getQueryData<any>(["time-entries", "t1"])?.totalMinutes,
    ).toBe(5);

    queryClient.setQueryData(
      ["project-members", "p1"],
      [{ id: "m1", role: "MEMBER" }],
    );
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { message: "updated" },
    });
    const roleHook = renderHook(() => useUpdateRole("p1"), { wrapper });
    await roleHook.result.current.mutateAsync({
      id: "m1",
      role: "OWNER" as any,
    });
    expect(
      queryClient.getQueryData<any[]>(["project-members", "p1"])?.[0].role,
    ).toBe("OWNER");

    vi.mocked(axiosInstance.post).mockResolvedValue({ data: { token: "jwt" } });
    const loginHook = renderHook(() => useLogin(), { wrapper });
    await loginHook.result.current.mutateAsync({
      email: "user@example.com",
      password: "password",
    });
    expect(localStorage.getItem("token")).toBe("jwt");
  });

  it("covers nonmatching and absent cache branches", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);

    queryClient.setQueryData(
      ["statuses", "p1"],
      [{ id: "other", name: "Other" }],
    );
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { newStatus: { name: "New" } },
    });
    const statusHook = renderHook(() => useUpdateStatus("p1"), { wrapper });
    await statusHook.result.current.mutateAsync({
      status: { id: "s1", name: "New" },
    });
    expect(queryClient.getQueryData<any[]>(["statuses", "p1"])?.[0].name).toBe(
      "Other",
    );

    queryClient.setQueryData(["tasks", "p1"], { unexpected: true });
    queryClient.setQueryData(["task_history", "t1"], null);
    vi.mocked(axiosInstance.delete).mockResolvedValue({ data: {} });
    const deleteTaskHook = renderHook(() => useDeleteTask("p1", "t1"), {
      wrapper,
    });
    await deleteTaskHook.result.current.mutateAsync();
    expect(queryClient.getQueryData(["tasks", "p1"])).toEqual({
      unexpected: true,
    });

    queryClient.setQueryData(["time-entries", "t1"], {
      timeEntries: [{ id: "other", durationMinutes: 0 }],
      totalMinutes: 5,
    });
    queryClient.setQueryData(["task_history", "t1"], null);
    const deleteEntryHook = renderHook(() => useDeleteTimeEntry("t1"), {
      wrapper,
    });
    await deleteEntryHook.result.current.mutateAsync("missing");
    expect(
      queryClient.getQueryData<any>(["time-entries", "t1"])?.totalMinutes,
    ).toBe(5);

    queryClient.setQueryData(["assigned-projects"], null);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { project: { name: "New" } },
    });
    const projectHook = renderHook(() => useUpdateProject("p1"), { wrapper });
    await projectHook.result.current.mutateAsync({ name: "New" });
    expect(queryClient.getQueryData(["assigned-projects"])).toBeNull();

    queryClient.setQueryData(["user"], null);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { user: { name: "New" } },
    });
    const userHook = renderHook(() => useUpdateUser(), { wrapper });
    await userHook.result.current.mutateAsync({ name: "New" });
    expect(queryClient.getQueryData(["user"])).toBeNull();

    vi.mocked(axiosInstance.post).mockResolvedValue({ data: {} });
    const loginHook = renderHook(() => useLogin(), { wrapper });
    await loginHook.result.current.mutateAsync({
      email: "user@example.com",
      password: "password",
    });
  });

  it("covers remaining user, history, and malformed-cache branches", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);

    queryClient.setQueryData(["user"], { id: "u1", name: "Old" });
    queryClient.setQueryData(["project-members", "p1"], null);
    queryClient.setQueryData(["task", "p1", "t1"], {
      id: "t1",
      creator: { id: "other" },
      assignees: [],
    });
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { user: { name: "New" } },
    });
    const userHook = renderHook(() => useUpdateUser(), { wrapper });
    await userHook.result.current.mutateAsync({ name: "New" });
    expect(
      queryClient.getQueryData<any>(["task", "p1", "t1"])?.creator.id,
    ).toBe("other");

    queryClient.setQueryData(["task", "p1", "t2"], {
      id: "t2",
      creator: { id: "other" },
      assignees: [{ id: "u1" }, { id: "other" }],
    });
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { user: { name: "Newer" } },
    });
    const assigneeHook = renderHook(() => useUpdateUser(), { wrapper });
    await assigneeHook.result.current.mutateAsync({ name: "Newer" });
    expect(
      queryClient.getQueryData<any>(["task", "p1", "t2"])?.assignees[0].name,
    ).toBe("Newer");

    queryClient.setQueryData(["time-entries", "t1"], { malformed: true });
    queryClient.setQueryData(["task_history", "t1"], []);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { timeEntry: { id: "e1", durationMinutes: 5 } },
    });
    const createEntryHook = renderHook(() => useCreateTimeEntry("t1"), {
      wrapper,
    });
    await createEntryHook.result.current.mutateAsync({
      taskId: "t1",
      durationMinutes: 5,
    });
    expect(queryClient.getQueryData<any>(["time-entries", "t1"])).toEqual({
      malformed: true,
    });

    queryClient.setQueryData(["tasks", "p1"], { malformed: true });
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { newTask: { id: "t3" } },
    });
    const taskHook = renderHook(() => useCreateTask("p1"), { wrapper });
    await taskHook.result.current.mutateAsync({
      name: "Task",
      description: "",
      statusId: "s1",
      priority: "LOW",
      estimatedTime: null,
      dueDate: null,
      assignees: [],
    });
    expect(queryClient.getQueryData(["tasks", "p1"])).toEqual({
      malformed: true,
    });

    queryClient.setQueryData(["project-members", "p1"], null);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { message: "updated" },
    });
    const roleHook = renderHook(() => useUpdateRole("p1"), { wrapper });
    await roleHook.result.current.mutateAsync({
      id: "m1",
      role: "OWNER" as any,
    });
    expect(queryClient.getQueryData<any[]>(["project-members", "p1"])).toEqual(
      [],
    );

    queryClient.setQueryData(["user"], null);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { message: "updated" },
    });
    const emailHook = renderHook(() => useVerifyUpdatedEmailOtp(), { wrapper });
    await emailHook.result.current.mutateAsync({
      newEmail: "new@example.com",
      otp: "1",
      token: "t",
    });
    expect(queryClient.getQueryData(["user"])).toBeNull();
  });

  it("covers non-array caches and successful history/email updates", async () => {
    const queryClient = makeClient();
    const wrapper = makeWrapper(queryClient);

    queryClient.setQueryData(["assigned-projects"], null);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { assignedProjectMembership: { project: { id: "p3" } } },
    });
    const projectHook = renderHook(() => useCreateProject(), { wrapper });
    await projectHook.result.current.mutateAsync({
      name: "P",
      description: "",
    });
    expect(queryClient.getQueryData<any[]>(["assigned-projects"])).toHaveLength(
      1,
    );

    queryClient.setQueryData(["statuses", "p1"], null);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { newStatus: { id: "s1" } },
    });
    const statusCreateHook = renderHook(() => useCreateStatus("p1"), {
      wrapper,
    });
    await statusCreateHook.result.current.mutateAsync({ name: "New" });
    expect(queryClient.getQueryData<any[]>(["statuses", "p1"])).toEqual([
      { id: "s1" },
    ]);

    queryClient.setQueryData(["statuses", "p1"], null);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { newStatus: { id: "s1" } },
    });
    const statusUpdateHook = renderHook(() => useUpdateStatus("p1"), {
      wrapper,
    });
    await statusUpdateHook.result.current.mutateAsync({
      status: { id: "s1", name: "New" },
    });
    expect(queryClient.getQueryData(["statuses", "p1"])).toEqual([]);

    queryClient.setQueryData(["assigned-projects"], null);
    vi.mocked(axiosInstance.patch).mockResolvedValue({
      data: { project: { name: "New" } },
    });
    const projectUpdateHook = renderHook(() => useUpdateProject("p1"), {
      wrapper,
    });
    await projectUpdateHook.result.current.mutateAsync({ name: "New" });
    expect(queryClient.getQueryData(["assigned-projects"])).toBeNull();

    queryClient.setQueryData(["user"], { id: "u1", email: "old@example.com" });
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: { message: "updated" },
    });
    const emailHook = renderHook(() => useVerifyUpdatedEmailOtp(), { wrapper });
    await emailHook.result.current.mutateAsync({
      newEmail: "new@example.com",
      otp: "1",
      token: "t",
    });
    expect(queryClient.getQueryData<any>(["user"])?.email).toBe(
      "new@example.com",
    );

    queryClient.setQueryData(["task_history", "t1"], [{ id: "old" }]);
    vi.mocked(axiosInstance.post).mockResolvedValue({
      data: {
        timeEntry: { id: "e1", durationMinutes: 5 },
        historyEntry: { id: "new" },
      },
    });
    const entryHook = renderHook(() => useCreateTimeEntry("t1"), { wrapper });
    await entryHook.result.current.mutateAsync({
      taskId: "t1",
      durationMinutes: 5,
    });
    expect(
      queryClient.getQueryData<any[]>(["task_history", "t1"])?.[0].id,
    ).toBe("new");
  });

  it("uploads images and reports missing or failed Cloudinary configuration", async () => {
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("VITE_CLOUDINARY_UPLOAD_PRESET", "");
    await expect(uploadImageToCloudinary(file)).rejects.toThrow(
      "Cloudinary environment variables are missing",
    );
    vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", "cloud");
    vi.stubEnv("VITE_CLOUDINARY_UPLOAD_PRESET", "preset");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(uploadImageToCloudinary(file)).rejects.toThrow(
      "Failed to upload image",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ secure_url: "https://image" }),
      }),
    );
    await expect(uploadImageToCloudinary(file)).resolves.toBe("https://image");
  });
});
