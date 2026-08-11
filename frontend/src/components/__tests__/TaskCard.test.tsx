import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskCard from "../TaskCard";

const mockTask = {
  id: "t100",
  name: "Setup Vitest Unit Tests",
  title: "Setup Vitest Unit Tests",
  description: "Write unit test suites for UI components",
  status: "IN_PROGRESS",
  priority: "HIGH",
  projectId: "p1",
  timeEntries: [{ durationMinutes: 45 }],
};

describe("TaskCard Component", () => {
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
      </QueryClientProvider>,
    );

  it("renders task details and badges correctly", () => {
    renderComponent({ task: mockTask });

    expect(screen.getByText("Setup Vitest Unit Tests")).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it("handles dragging and clicking interactions", () => {
    const handleDragStart = vi.fn();

    renderComponent({ task: mockTask, onDragStart: handleDragStart });

    const card = screen.getByText("Setup Vitest Unit Tests").closest("div");
    if (card) {
      fireEvent.dragStart(card);
    }
  });
});
