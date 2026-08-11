import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import TaskDetailsPage from "../TaskDetailsPage";

const mockUpdateTaskMutate = vi.fn();

const mockTaskData = {
  id: "t1",
  name: "Integrate Auth Service",
  description: "Set up JWT middleware and auth hook",
  status: "TODO",
  priority: "HIGH",
  projectId: "p1",
  dueDate: "2026-08-25T10:00:00Z",
  estimatedTime: 90,
  createdAt: "2026-08-11T10:00:00Z",
  updatedAt: "2026-08-11T10:00:00Z",
};

const mockTimeEntriesData = {
  timeEntries: [
    {
      id: "e1",
      durationMinutes: 30,
      entryDate: "2026-08-11",
      entry_date: "2026-08-11",
      note: "Draft implementation",
      createdAt: "2026-08-11T10:00:00Z",
    },
  ],
  totalMinutes: 30,
};

// Mock BOTH relative depths so Vitest catches calls from components and hooks
vi.mock("../hooks/getTaskHook", () => ({
  default: () => ({ data: mockTaskData, isLoading: false }),
}));
vi.mock("../../hooks/getTaskHook", () => ({
  default: () => ({ data: mockTaskData, isLoading: false }),
}));

vi.mock("../hooks/getProjectsHook", () => ({
  default: () => ({
    data: [{ id: "p1", name: "Alpha Project", description: "Main project" }],
    isLoading: false,
  }),
}));
vi.mock("../../hooks/getProjectsHook", () => ({
  default: () => ({
    data: [{ id: "p1", name: "Alpha Project", description: "Main project" }],
    isLoading: false,
  }),
}));

vi.mock("../hooks/getAllTasksHook", () => ({
  default: () => ({
    data: [mockTaskData],
    isLoading: false,
  }),
}));
vi.mock("../../hooks/getAllTasksHook", () => ({
  default: () => ({
    data: [mockTaskData],
    isLoading: false,
  }),
}));

vi.mock("../hooks/getalltimeEntries", () => ({
  default: () => ({ data: mockTimeEntriesData, isLoading: false }),
}));
vi.mock("../../hooks/getalltimeEntries", () => ({
  default: () => ({ data: mockTimeEntriesData, isLoading: false }),
}));

vi.mock("../hooks/getallhistory", () => ({
  default: () => ({ data: [], isLoading: false }),
}));
vi.mock("../../hooks/getallhistory", () => ({
  default: () => ({ data: [], isLoading: false }),
}));

vi.mock("../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockUpdateTaskMutate, isPending: false }),
}));
vi.mock("../../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockUpdateTaskMutate, isPending: false }),
}));

vi.mock("../hooks/meHook", () => ({
  default: () => ({ data: { name: "Aly Adel", email: "aly@example.com" } }),
}));
vi.mock("../../hooks/meHook", () => ({
  default: () => ({ data: { name: "Aly Adel", email: "aly@example.com" } }),
}));

vi.mock("../hooks/createTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/createTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/updateTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/updateTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/deleteTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/deleteTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("Coverage Booster Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  it("triggers task editing and executes save mutation on TaskDetailsPage", async () => {
    mockUpdateTaskMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({ message: "Task changes saved successfully" });
    });

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/projects/p1/task/t1"]}>
          <Routes>
            <Route
              path="/projects/:projectId/task/:taskId"
              element={<TaskDetailsPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Integrate Auth Service")).toBeInTheDocument();
    });

    // Trigger edit mode on title field
    const editButtons = screen.getAllByLabelText(/edit field/i);
    fireEvent.click(editButtons[0]);

    const titleInput = screen.getByDisplayValue("Integrate Auth Service");
    fireEvent.change(titleInput, {
      target: { value: "Integrate Auth Service Updated" },
    });

    // Confirm inline edit
    const confirmButtons = screen.getAllByRole("button");
    const confirmSaveBtn = confirmButtons.find((btn) =>
      btn.className.includes("inline-field-save"),
    );
    if (confirmSaveBtn) fireEvent.mouseDown(confirmSaveBtn);

    // Click overall task save button
    const saveTaskBtn = screen.getByRole("button", {
      name: /save task changes/i,
    });
    fireEvent.click(saveTaskBtn);

    expect(mockUpdateTaskMutate).toHaveBeenCalled();
  });
});
