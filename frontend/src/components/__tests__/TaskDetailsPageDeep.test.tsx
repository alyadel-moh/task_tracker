import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import TaskDetailsPage from "../TaskDetailsPage";

const mockMutateTask = vi.fn();
const mockCreateTimeEntry = vi.fn();

const taskMockData = {
  id: "t1",
  name: "Refactor API Controllers",
  description: "Clean up routes and controllers",
  status: "IN_PROGRESS",
  priority: "HIGH",
  projectId: "p1",
  createdAt: "2026-08-11T10:00:00Z",
  updatedAt: "2026-08-11T10:00:00Z",
};

const entriesMockData = {
  timeEntries: [
    {
      id: "e1",
      durationMinutes: 45,
      entryDate: "2026-08-11",
      entry_date: "2026-08-11",
      note: "Initial refactor pass",
      createdAt: "2026-08-11T10:00:00Z",
    },
  ],
  totalMinutes: 45,
};

vi.mock("../hooks/getTaskHook", () => ({
  default: () => ({ data: taskMockData, isLoading: false }),
}));
vi.mock("../../hooks/getTaskHook", () => ({
  default: () => ({ data: taskMockData, isLoading: false }),
}));

vi.mock("../hooks/getalltimeEntries", () => ({
  default: () => ({ data: entriesMockData, isLoading: false }),
}));
vi.mock("../../hooks/getalltimeEntries", () => ({
  default: () => ({ data: entriesMockData, isLoading: false }),
}));

vi.mock("../hooks/getallhistory", () => ({
  default: () => ({ data: [], isLoading: false }),
}));
vi.mock("../../hooks/getallhistory", () => ({
  default: () => ({ data: [], isLoading: false }),
}));

vi.mock("../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockMutateTask, isPending: false }),
}));
vi.mock("../../hooks/updateTaskHook", () => ({
  default: () => ({ mutate: mockMutateTask, isPending: false }),
}));

vi.mock("../hooks/createTimeEntry", () => ({
  default: () => ({ mutate: mockCreateTimeEntry, isPending: false }),
}));
vi.mock("../../hooks/createTimeEntry", () => ({
  default: () => ({ mutate: mockCreateTimeEntry, isPending: false }),
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

describe("TaskDetailsPage Deep Coverage Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "test-token");
  });

  it("renders task info and logs time entries correctly", async () => {
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
      expect(screen.getByText("Refactor API Controllers")).toBeInTheDocument();
    });

    expect(screen.getByText(/Total: 45 mins/i)).toBeInTheDocument();

    const logTimeBtn = screen.getByRole("button", { name: /log time/i });
    fireEvent.click(logTimeBtn);

    // Target the newly rendered duration input by placeholder text
    expect(screen.getByPlaceholderText("e.g. 45")).toBeInTheDocument();
  });
});
