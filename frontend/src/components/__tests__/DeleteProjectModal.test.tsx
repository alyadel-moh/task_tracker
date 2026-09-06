import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import DeleteProjectModal from "../DeleteProjectModal";
import { useAppStore } from "../../store/useAppStore";
import useDeleteProject from "../../hooks/deleteProjectHook";
import { toast } from "react-hot-toast";

const mockMutate = vi.fn();

vi.mock("../../hooks/deleteProjectHook", () => ({
  default: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("DeleteProjectModal 100% Branch Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      projectToDelete: null,
      activeProject: null,
    });
    vi.mocked(useDeleteProject).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  it("returns null when projectToDelete is null", () => {
    const { container } = render(<DeleteProjectModal />);
    expect(container.firstChild).toBeNull();
  });

  it("deletes project when activeProject matches and resets activeProject", () => {
    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
      activeProject: { id: "p1", name: "Website" } as any,
    });

    render(<DeleteProjectModal />);

    expect(screen.getByText('Delete "Website"?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    expect(mockMutate).toHaveBeenCalledWith("p1", expect.any(Object));

    const mutationOptions = mockMutate.mock.calls.at(-1)?.[1];
    mutationOptions.onSuccess({ message: "Project deleted successfully" });

    expect(toast.success).toHaveBeenCalledWith("Project deleted successfully");
    expect(useAppStore.getState().activeProject).toBeNull();
    expect(useAppStore.getState().projectToDelete).toBeNull();
  });

  it("deletes project when activeProject is different without resetting activeProject", () => {
    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
      activeProject: { id: "p2", name: "Different Project" } as any,
    });

    render(<DeleteProjectModal />);

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    const mutationOptions = mockMutate.mock.calls.at(-1)?.[1];
    mutationOptions.onSuccess({ message: "Deleted" });

    expect(toast.success).toHaveBeenCalledWith("Deleted");
    expect(useAppStore.getState().activeProject).toEqual({
      id: "p2",
      name: "Different Project",
    });
    expect(useAppStore.getState().projectToDelete).toBeNull();
  });

  it("handles onError with custom API error message", () => {
    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
    });

    render(<DeleteProjectModal />);

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    const mutationOptions = mockMutate.mock.calls.at(-1)?.[1];
    mutationOptions.onError({
      response: { data: { message: "Permission denied to delete" } },
    });

    expect(toast.error).toHaveBeenCalledWith("Permission denied to delete");
  });

  it("handles onError with fallback message when API message is missing", () => {
    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
    });

    render(<DeleteProjectModal />);

    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

    const mutationOptions = mockMutate.mock.calls.at(-1)?.[1];
    mutationOptions.onError({});

    expect(toast.error).toHaveBeenCalledWith("Failed to delete project.");
  });

  it("closes modal on cancel button click", () => {
    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
    });

    render(<DeleteProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(useAppStore.getState().projectToDelete).toBeNull();
  });

  it("closes modal on overlay backdrop click", () => {
    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
    });

    const { container } = render(<DeleteProjectModal />);
    const overlay = container.querySelector(".modal-overlay")!;
    fireEvent.click(overlay);
    expect(useAppStore.getState().projectToDelete).toBeNull();
  });

  it("stops propagation when clicking inside the modal card", () => {
    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
    });

    const { container } = render(<DeleteProjectModal />);
    const modalCard = container.querySelector(".modal-card")!;

    fireEvent.click(modalCard);

    expect(useAppStore.getState().projectToDelete).toEqual({
      id: "p1",
      name: "Website",
    });
  });

  it("renders spinner, 'Deleting...' text, and disables buttons when isPending is true", () => {
    vi.mocked(useDeleteProject).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as any);

    useAppStore.setState({
      projectToDelete: { id: "p1", name: "Website" },
    });

    render(<DeleteProjectModal />);

    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Deleting/ })).toBeDisabled();
  });
});
