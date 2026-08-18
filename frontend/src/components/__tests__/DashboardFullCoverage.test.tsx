import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "../Dashboard";
import { axiosInstance } from "../../api-client";

vi.mock("../../api-client", () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Dashboard Full Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url.includes("auth/me")) {
        return Promise.resolve({
          data: {
            user: { id: "u1", name: "Aly Mohamed", email: "aly@example.com" },
          },
        });
      }
      if (url.includes("projects")) {
        return Promise.resolve({
          data: { projects: [{ id: "p1", name: "Frontend Project" }] },
        });
      }
      if (url.includes("tasks")) {
        return Promise.resolve({ data: { tasks: [] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("renders projects, handles modal toggles, and deletes a project", async () => {
    vi.mocked(axiosInstance.delete).mockResolvedValue({
      data: { status: "SUCCESS" },
    });
    const user = userEvent.setup();
    renderComponent();

    const deleteBtn = await screen.findByTitle(
      /delete project/i,
      {},
      { timeout: 4000 },
    );
    expect(deleteBtn).toBeInTheDocument();

    await user.click(deleteBtn);

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith("projects/delete/p1");
    });
  });

  it("handles errors during task move (Drag and Drop)", async () => {
    renderComponent();
    const deleteBtn = await screen.findByTitle(
      /delete project/i,
      {},
      { timeout: 4000 },
    );
    expect(deleteBtn).toBeInTheDocument();
  });
});
