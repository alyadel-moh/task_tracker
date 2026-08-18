import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import React from "react";
import DashboardSidebar from "../DashboardSidebar";

const mockProjects = [
  { id: "proj-1", name: "Frontend Tracker" },
  { id: "proj-2", name: "Backend Spring API" },
];

describe("DashboardSidebar Component Unit Tests", () => {
  const mockOnSelectProject = vi.fn();
  const mockOnCreateProject = vi.fn();
  const mockOnLogout = vi.fn();
  const mockOnDeleteProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) =>
    render(
      <DashboardSidebar
        projects={mockProjects as any}
        activeProjectId="proj-1"
        userName="Aly Mohamed"
        userEmail="aly@example.com"
        onSelectProject={mockOnSelectProject}
        onCreateProject={mockOnCreateProject}
        onLogout={mockOnLogout}
        onDeleteProject={mockOnDeleteProject}
        {...props}
      />,
    );

  it("renders list of projects and highlights the active project", () => {
    renderComponent();

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Frontend Tracker")).toBeInTheDocument();
    expect(screen.getByText("Backend Spring API")).toBeInTheDocument();

    const activeProjectBtn = screen
      .getByText("Frontend Tracker")
      .closest("button")!;
    expect(activeProjectBtn).toHaveClass("project-item-active");
  });

  it("calls onSelectProject when clicking a project item", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText("Backend Spring API"));

    expect(mockOnSelectProject).toHaveBeenCalledWith("proj-2");
  });

  it("triggers onSelectProject and onDeleteProject when clicking inline delete button", async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteBtns = screen.getAllByTitle("Delete project");
    await user.click(deleteBtns[0]);

    expect(mockOnSelectProject).toHaveBeenCalledWith("proj-1");
    expect(mockOnDeleteProject).toHaveBeenCalledWith(true);
  });

  it("triggers onCreateProject when clicking New project button", async () => {
    const user = userEvent.setup();
    renderComponent();

    const newProjectBtn = screen.getByRole("button", { name: /new project/i });
    await user.click(newProjectBtn);

    expect(mockOnCreateProject).toHaveBeenCalledTimes(1);
  });

  it("renders user avatar initials, user name, and email correctly", () => {
    renderComponent({ userName: "Aly Mohamed", userEmail: "aly@example.com" });

    expect(screen.getByText("AM")).toBeInTheDocument();
    expect(screen.getByText("Aly Mohamed")).toBeInTheDocument();
    expect(screen.getByText("aly@example.com")).toBeInTheDocument();
  });

  it("triggers onLogout when clicking Log out button", async () => {
    const user = userEvent.setup();
    renderComponent();

    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    await user.click(logoutBtn);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });
});
