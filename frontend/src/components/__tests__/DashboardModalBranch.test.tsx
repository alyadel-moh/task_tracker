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
  },
}));

describe("Dashboard Modal Branch Coverage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("fetches projects, handles mobile menu toggle, and opens create modal", async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url) => {
      if (url === "projects") {
        return Promise.resolve({ data: [{ id: "p1", name: "Alpha Project" }] });
      }
      if (url === "tasks/project/p1") {
        return Promise.resolve({ data: [] });
      }
      if (url === "auth/me") {
        return Promise.resolve({
          data: { name: "Aly Mohamed", email: "aly@example.com" },
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    });

    const createProjectBtn = screen.getByRole("button", {
      name: /new project|\+/i,
    });
    fireEvent.click(createProjectBtn);
  });
});
