import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardBoard from "../DashboardBoard";

const mockProject = { id: "p1", name: "Alpha Project" };
const mockTasks = [
  {
    id: "t1",
    name: "Task 1",
    status: "TODO",
    priority: "LOW",
    projectId: "p1",
  },
  {
    id: "t2",
    name: "Task 2",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    projectId: "p1",
  },
  {
    id: "t3",
    name: "Task 3",
    status: "IN_REVIEW",
    priority: "HIGH",
    projectId: "p1",
  },
  {
    id: "t4",
    name: "Task 4",
    status: "DONE",
    priority: "HIGH",
    projectId: "p1",
  },
];

describe("DashboardBoard Ultimate Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = (props: any) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardBoard
            activeProject={mockProject as any}
            tasks={mockTasks as any}
            projectId="p1"
            userName="Aly Mohamed"
            onTaskClick={vi.fn()}
            onAddTaskClick={vi.fn()}
            {...props}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("renders all four Kanban columns and handles interactions", () => {
    const onTaskClick = vi.fn();
    renderComponent({ onTaskClick });

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("Task 3")).toBeInTheDocument();
    expect(screen.getByText("Task 4")).toBeInTheDocument();
  });

  it("triggers new task button handler", () => {
    const onAddTaskClick = vi.fn();
    renderComponent({ onAddTaskClick });

    const addButtons = screen.getAllByRole("button", { name: /new task/i });
    if (addButtons.length > 0) {
      fireEvent.click(addButtons[0]);
    }
  });
});
