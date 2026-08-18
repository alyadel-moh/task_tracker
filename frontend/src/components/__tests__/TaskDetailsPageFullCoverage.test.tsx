import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import TaskDetailsPage from "../TaskDetailsPage";
import { toast } from "react-hot-toast";

const {
  mockUpdateTask,
  mockCreateTimeEntry,
  mockUpdateEntry,
  mockDeleteEntry,
} = vi.hoisted(() => ({
  mockUpdateTask: vi.fn(),
  mockCreateTimeEntry: vi.fn(),
  mockUpdateEntry: vi.fn(),
  mockDeleteEntry: vi.fn(),
}));

const taskMock = {
  id: "t1",
  name: "Refactor API Controllers",
  description: "Clean up routes",
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
      note: "Initial refactor",
      createdAt: "2026-08-11T10:00:00Z",
    },
  ],
  totalMinutes: 45,
};

vi.mock("../hooks/getTaskHook", () => ({
  default: () => ({ data: taskMock, isLoading: false }),
}));
vi.mock("../../hooks/getTaskHook", () => ({
  default: () => ({ data: taskMock, isLoading: false }),
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
  default: () => ({ mutate: mockUpdateTask, isPending: false }),
}));
vi.mock("../../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockUpdateTask, isPending: false }),
}));

vi.mock("../hooks/createTimeEntry", () => ({
  default: () => ({ mutate: mockCreateTimeEntry, isPending: false }),
}));
vi.mock("../../hooks/createTimeEntry", () => ({
  default: () => ({ mutate: mockCreateTimeEntry, isPending: false }),
}));

vi.mock("../hooks/updateTimeEntry", () => ({
  default: () => ({ mutate: mockUpdateEntry, isPending: false }),
}));
vi.mock("../../hooks/updateTimeEntry", () => ({
  default: () => ({ mutate: mockUpdateEntry, isPending: false }),
}));

vi.mock("../hooks/deleteTimeEntry", () => ({
  default: () => ({ mutate: mockDeleteEntry, isPending: false }),
}));
vi.mock("../../hooks/deleteTimeEntry", () => ({
  default: () => ({ mutate: mockDeleteEntry, isPending: false }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TaskDetailsPage Full Coverage Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  const renderPage = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
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
  };

  it("handles logging new time entries and handles mutation success", async () => {
    mockCreateTimeEntry.mockImplementation((payload, options) => {
      options?.onSuccess?.();
    });

    renderPage();

    const taskTitle = await screen.findByText(
      "Refactor API Controllers",
      {},
      { timeout: 4000 },
    );
    expect(taskTitle).toBeInTheDocument();

    const logBtn = screen.getByRole("button", { name: /log time/i });
    fireEvent.click(logBtn);

    const durationInput = screen.getByPlaceholderText("e.g. 45");
    fireEvent.change(durationInput, { target: { value: "60" } });

    const saveBtn = screen.getByRole("button", { name: /^save$/i });
    fireEvent.click(saveBtn);

    expect(mockCreateTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ durationMinutes: 60 }),
      expect.any(Object),
    );
    expect(toast.success).toHaveBeenCalledWith("Time entry logged");
  });

  it("deletes a time entry when clicking trash icon", async () => {
    mockDeleteEntry.mockImplementation((id, options) => {
      options?.onSuccess?.();
    });

    renderPage();

    const buttons = await screen.findAllByRole("button");
    const deleteBtn =
      buttons.find(
        (btn) => btn.className.includes("delete") || btn.querySelector("svg"),
      ) || buttons[buttons.length - 1];

    fireEvent.click(deleteBtn);

    expect(mockDeleteEntry).toHaveBeenCalledWith("e1", expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith("Time entry deleted");
  });
});
