import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardBoard from "../DashboardBoard";

const mockActiveProject = {
  id: "proj-1",
  name: "Frontend Development",
  description: "Building React components",
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-11T12:00:00Z",
};

const mockTasks = [
  { id: "t1", title: "Task One", status: "TODO", priority: "HIGH" },
  { id: "t2", title: "Task Two", status: "IN_PROGRESS", priority: "MEDIUM" },
];

describe("DashboardBoard Component Unit Tests", () => {
  let queryClient: QueryClient;
  const mockOnSelectTab = vi.fn();
  const mockOnDragStart = vi.fn();
  const mockOnDragEnd = vi.fn();
  const mockOnToggleProjectMenu = vi.fn();
  const mockOnToggleUserMenu = vi.fn();
  const mockOnSelectProject = vi.fn();
  const mockOnCreateProject = vi.fn();
  const mockOnCreateTask = vi.fn();
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderBoard = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardBoard
            activeProject={mockActiveProject as any}
            tasks={mockTasks as any}
            activeTab="TODO"
            onSelectTab={mockOnSelectTab}
            draggingTask={null}
            onDragStart={mockOnDragStart}
            onDragEnd={mockOnDragEnd}
            isProjectMenuOpen={false}
            onToggleProjectMenu={mockOnToggleProjectMenu}
            isUserMenuOpen={false}
            onToggleUserMenu={mockOnToggleUserMenu}
            projects={[mockActiveProject] as any}
            activeProjectId="proj-1"
            onSelectProject={mockOnSelectProject}
            onCreateProject={mockOnCreateProject}
            userName="Aly Mohamed"
            userEmail="aly@example.com"
            onCreateTask={mockOnCreateTask}
            onLogout={mockOnLogout}
            sensors={[]}
            {...props}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("renders project title, description, and filter bar correctly", () => {
    renderBoard();

    expect(screen.getByText("Frontend Development")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search tasks by title or description/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new task/i }),
    ).toBeInTheDocument();
  });

  it("triggers onCreateTask when clicking New task button", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole("button", { name: /new task/i }));
    expect(mockOnCreateTask).toHaveBeenCalledTimes(1);
  });

  it("updates search query input correctly", async () => {
    const user = userEvent.setup();
    renderBoard();

    const searchInput = screen.getByPlaceholderText(
      /search tasks by title or description/i,
    );
    await user.type(searchInput, "Task One");

    expect(searchInput).toHaveValue("Task One");
  });

  it("toggles status and priority filter pills when clicked", async () => {
    const user = userEvent.setup();
    renderBoard();

    const todoPill = screen.getByRole("button", { name: "To Do" });
    await user.click(todoPill);
    expect(todoPill).toHaveClass("active");

    const highPills = screen.getAllByRole("button", { name: "High" });
    await user.click(highPills[0]);
    expect(highPills[0]).toHaveClass("active");
  });
});
