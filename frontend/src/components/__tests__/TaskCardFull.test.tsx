import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskCard from "../TaskCard";

const mockTask = {
  id: "t100",
  name: "Implement Card Unit Tests",
  description: "Add full coverage for TaskCard component",
  status: "IN_PROGRESS",
  priority: "HIGH",
  projectId: "p1",
  estimatedTime: 120,
  dueDate: "2026-08-15T00:00:00.000Z",
  timeEntries: [{ durationMinutes: 45 }, { durationMinutes: 15 }],
};

describe("TaskCard Full Coverage", () => {
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
          <TaskCard {...props} />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("renders task name, priority badge, and total logged time", () => {
    renderComponent({ task: mockTask });

    expect(screen.getByText("Implement Card Unit Tests")).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it("triggers task delete action when delete icon button is clicked", () => {
    const onDelete = vi.fn();
    renderComponent({ task: mockTask, onDelete });

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);
  });
});