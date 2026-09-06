import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import PublicOnlyRoute from "../PublicOnlyRoute";

vi.mock("../../hooks/meHook", () => ({ default: vi.fn() }));
import useGetUser from "../../hooks/meHook";

describe("route guards", () => {
  it("renders protected children with a valid token and redirects errors", () => {
    vi.mocked(useGetUser).mockReturnValue({ isError: false } as never);
    localStorage.setItem("token", "token");
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <span>Private</span>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText("Private")).toBeInTheDocument();
    vi.mocked(useGetUser).mockReturnValue({ isError: true } as never);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <span>Hidden</span>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("renders public children without a token and redirects authenticated users", () => {
    localStorage.removeItem("token");
    render(
      <MemoryRouter>
        <PublicOnlyRoute>
          <span>Public</span>
        </PublicOnlyRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText("Public")).toBeInTheDocument();
    localStorage.setItem("token", "token");
    render(
      <MemoryRouter>
        <PublicOnlyRoute>
          <span>Hidden</span>
        </PublicOnlyRoute>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});
