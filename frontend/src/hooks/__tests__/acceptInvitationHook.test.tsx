import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import useAcceptInvitation from "../acceptInvitationHook";
import { axiosInstance } from "../../api-client";
import { AssignedProjectMembership } from "../../components/types";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    patch: vi.fn(),
  },
}));

describe("useAcceptInvitation Hook", () => {
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

  it("accepts invitation, appends project to existing list, and removes from pending invitations", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    queryClient.setQueryData(
      ["assigned-projects"],
      [{ id: "m1", project: { id: "p1", name: "Existing Project" } }],
    );

    queryClient.setQueryData(
      ["pending-invitations"],
      [
        { id: "inv1", project: { id: "p2", name: "Accepted Project" } },
        { id: "inv2", project: { id: "p3", name: "Other Project" } },
      ],
    );

    const mockResponse = {
      status: "SUCCESS",
      message: "Invitation accepted",
      assignedprojectMembership: {
        id: "m2",
        role: "MEMBER" as const,
        project: { id: "p2", name: "Accepted Project" },
      } as AssignedProjectMembership,
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    result.current.mutate("p2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(axiosInstance.patch).toHaveBeenCalledWith(
      "projects/invitations/p2/accept",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Accepting invitation for project:",
      "p2",
    );

    // Verified assigned-projects array branch
    const assignedCache = queryClient.getQueryData<any[]>(["assigned-projects"]);
    expect(assignedCache).toHaveLength(2);
    expect(assignedCache?.[1].project.id).toBe("p2");

    // Verified pending-invitations filter branch
    const pendingCache = queryClient.getQueryData<any[]>([
      "pending-invitations",
    ]);
    expect(pendingCache).toHaveLength(1);
    expect(pendingCache?.[0].project.id).toBe("p3");

    consoleSpy.mockRestore();
  });

  it("handles empty/null caches correctly by initializing assigned-projects and clearing pending", async () => {
    queryClient.setQueryData(["assigned-projects"], null);
    queryClient.setQueryData(["pending-invitations"], null);

    const mockResponse = {
      status: "SUCCESS",
      message: "Invitation accepted",
      assignedprojectMembership: {
        id: "m1",
        role: "MEMBER" as const,
        project: { id: "p1", name: "First Project" },
      } as AssignedProjectMembership,
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Tests `if (!oldMemberships) return [data.assignedprojectMembership];`
    expect(queryClient.getQueryData(["assigned-projects"])).toEqual([
      mockResponse.assignedprojectMembership,
    ]);

    // Tests `if (!oldInvitations) return [];`
    expect(queryClient.getQueryData(["pending-invitations"])).toEqual([]);
  });

  it("preserves non-array assigned-projects cache shape", async () => {
    queryClient.setQueryData(["assigned-projects"], { malformed: true });

    const mockResponse = {
      status: "SUCCESS",
      message: "Invitation accepted",
      assignedprojectMembership: {
        id: "m1",
        role: "MEMBER" as const,
        project: { id: "p1", name: "First Project" },
      } as AssignedProjectMembership,
    };

    vi.mocked(axiosInstance.patch).mockResolvedValueOnce({
      data: mockResponse,
    });

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Tests `return oldMemberships;` when oldMemberships is not an array
    expect(queryClient.getQueryData(["assigned-projects"])).toEqual({
      malformed: true,
    });
  });

  it("logs error when accept invitation fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(axiosInstance.patch).mockRejectedValueOnce(
      new Error("Accept failed"),
    );

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error accepting invitation for project:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
