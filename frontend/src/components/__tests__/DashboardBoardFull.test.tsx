import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardBoard from "../DashboardBoard";

const mockTasks = [
  {
    id: "t1",
    name: "To Do Item",
    status: "TODO",
    priority: "LOW",
    projectId: "p1",
  },
  {
    id: "t2",
    name: "In Progress Item",
    status: "IN_PROGRESS",
    priority: "HIGH",
    projectId: "p1",
  },
];

describe("DashboardBoard Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders status columns and tasks", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardBoard
            tasks={mockTasks as any}
            projectId="p1"
            userName="Aly Mohamed"
            onTaskClick={vi.fn()}
            onAddTaskClick={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("To Do Item")).toBeInTheDocument();
    expect(screen.getByText("In Progress Item")).toBeInTheDocument();
  });
});
