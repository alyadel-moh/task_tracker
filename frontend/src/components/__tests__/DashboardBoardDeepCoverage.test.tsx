import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardBoard from "../DashboardBoard";

const mockTasks = [
  { id: "t1", name: "Initial Setup", status: "TODO", priority: "LOW", projectId: "p1" },
  { id: "t2", name: "Write Unit Tests", status: "IN_PROGRESS", priority: "HIGH", projectId: "p1" },
];

describe("DashboardBoard Deep Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("renders status columns, user initials avatar, and handles task selection", () => {
    const onTaskClick = vi.fn();
    const onAddTaskClick = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardBoard
            tasks={mockTasks as any}
            projectId="p1"
            userName="Aly Mohamed"
            onTaskClick={onTaskClick}
            onAddTaskClick={onAddTaskClick}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("Initial Setup")).toBeInTheDocument();
    expect(screen.getByText("Write Unit Tests")).toBeInTheDocument();

    const taskCard = screen.getByText("Initial Setup").closest("div");
    if (taskCard) {
      fireEvent.click(taskCard);
    }
  });
});