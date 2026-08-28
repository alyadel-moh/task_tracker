import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import TaskDetailsPage from "../TaskDetailsPage";
import Dashboard from "../Dashboard";

const mockUpdateTaskMutate = vi.fn();
const mockUpdateEntryMutate = vi.fn();

const taskMock = {
  id: "t1",
  name: "Refactor Routing Module",
  description: "Clean up routes and guards",
  status: "IN_PROGRESS",
  priority: "HIGH",
  projectId: "p1",
  dueDate: "2026-08-20T10:00:00Z",
  estimatedTime: 120,
  createdAt: "2026-08-11T10:00:00Z",
  updatedAt: "2026-08-11T12:00:00Z",
};

const entriesMock = {
  timeEntries: [
    {
      id: "e1",
      durationMinutes: 45,
      entryDate: "2026-08-11",
      entry_date: "2026-08-11",
      note: "Initial route refactor",
      createdAt: "2026-08-11T10:00:00Z",
    },
  ],
  totalMinutes: 45,
};

// Mock dependencies at both depth levels
vi.mock("../hooks/getTaskHook", () => ({
  default: () => ({ data: taskMock, isLoading: false }),
}));
vi.mock("../../hooks/getTaskHook", () => ({
  default: () => ({ data: taskMock, isLoading: false }),
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
    data: [taskMock],
    isLoading: false,
  }),
}));
vi.mock("../../hooks/getAllTasksHook", () => ({
  default: () => ({
    data: [taskMock],
    isLoading: false,
  }),
}));

vi.mock("../hooks/getalltimeEntries", () => ({
  default: () => ({ data: entriesMock, isLoading: false }),
}));
vi.mock("../../hooks/getalltimeEntries", () => ({
  default: () => ({ data: entriesMock, isLoading: false }),
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

vi.mock("../hooks/updateTimeEntry", () => ({
  default: () => ({ mutate: mockUpdateEntryMutate, isPending: false }),
}));
vi.mock("../../hooks/updateTimeEntry", () => ({
  default: () => ({ mutate: mockUpdateEntryMutate, isPending: false }),
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

vi.mock("../hooks/deleteTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/deleteTimeEntry", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/deleteProjectHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/deleteProjectHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../hooks/logoutHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../../hooks/logoutHook", () => ({
  default: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("Final Boost Suite for >85% Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  it("exercises time entry draft modification and saves entry on TaskDetailsPage", async () => {
    mockUpdateEntryMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.({ message: "Entry updated successfully" });
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
      expect(screen.getByText("Refactor Routing Module")).toBeInTheDocument();
    });

    // Edit time entry note
    const editButtons = screen.getAllByLabelText(/edit field/i);
    // Find entry note edit button
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[editButtons.length - 1]);
    }

    const noteInput = screen.getByDisplayValue("Initial route refactor");
    fireEvent.change(noteInput, { target: { value: "Updated entry note" } });

    // Confirm inline edit for time entry note
    const confirmButtons = screen.getAllByRole("button");
    const confirmSaveBtn = confirmButtons.find((btn) =>
      btn.className.includes("inline-field-save"),
    );
    if (confirmSaveBtn) fireEvent.mouseDown(confirmSaveBtn);

    // Click "Save Entry Changes" button
    const saveEntryBtn = await screen.findByRole("button", {
      name: /save entry changes/i,
    });
    fireEvent.click(saveEntryBtn);

    expect(mockUpdateEntryMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "e1" }),
      expect.any(Object),
    );
  });
});
