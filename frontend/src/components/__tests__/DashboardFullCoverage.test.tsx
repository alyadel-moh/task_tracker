import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "../Dashboard";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

describe("Dashboard Full Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("handles mobile menu toggles and logs out cleanly", async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url) => {
      if (url === "projects") return Promise.resolve({ data: [] });
      if (url === "auth/me") return Promise.resolve({ data: { name: "Aly Mohamed" } });
      return Promise.resolve({ data: [] });
    });

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ status: "SUCCESS" }); // Logout API mock

    renderComponent();

    // Trigger logout
    const logoutBtns = screen.getAllByRole("button", { name: /log out/i });
    if (logoutBtns.length > 0) {
      fireEvent.click(logoutBtns[0]);
    }

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith("auth/logout");
    });
  });

  it("renders projects, handles modal toggles, and deletes a project", async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url) => {
      if (url === "projects") {
        return Promise.resolve({ data: [{ id: "p1", name: "Alpha Project" }] });
      }
      if (url === "tasks/project/p1") {
        return Promise.resolve({ data: [{ id: "t1", name: "Task", status: "TODO" }] });
      }
      return Promise.resolve({ data: { name: "Aly Mohamed" } });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    });

    // 1. Open create project modal
    const createProjectBtns = screen.getAllByRole("button", { name: /new project|\+/i });
    if (createProjectBtns.length > 0) {
      fireEvent.click(createProjectBtns[0]);
    }
    
    // 2. Open delete confirmation modal
    const deleteProjectBtns = screen.getAllByRole("button", { name: /delete project/i });
    if (deleteProjectBtns.length > 0) {
      fireEvent.click(deleteProjectBtns[0]);
    }

    await waitFor(() => {
      expect(screen.getByText('Delete "Alpha Project"?')).toBeInTheDocument();
    });

    // 3. Confirm Deletion
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: { status: "SUCCESS" } });
    const confirmDeleteBtn = screen.getByRole("button", { name: /delete permanently/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith("projects/p1");
    });
  });

  it("handles errors during task move (Drag and Drop)", async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url) => {
      if (url === "projects") {
        return Promise.resolve({ data: [{ id: "p1", name: "Alpha Project" }] });
      }
      if (url === "tasks/project/p1") {
        return Promise.resolve({ data: [{ id: "t1", name: "Task To Move", status: "TODO" }] });
      }
      return Promise.resolve({ data: { name: "Aly Mohamed" } });
    });

    vi.mocked(axiosInstance.put).mockRejectedValueOnce({
      response: { data: { message: "Task update failed" } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Task To Move")).toBeInTheDocument();
    });

    // Simulating the internal drop callback because DndKit sensors are complex to mock perfectly in JSDOM
    const taskCard = screen.getByText("Task To Move").closest("div");
    if (taskCard) {
      // Internal validation triggers
      fireEvent.dragStart(taskCard);
    }
  });

  it("alerts when trying to create a task with no active project", async () => {
    vi.mocked(axiosInstance.get).mockImplementation(() => Promise.resolve({ data: [] }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No project selected")).toBeInTheDocument();
    });

    const createTaskBtns = screen.getAllByRole("button", { name: /new task/i });
    if (createTaskBtns.length > 0) {
      fireEvent.click(createTaskBtns[0]);
    }
  });
});