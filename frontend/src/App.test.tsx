import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock the child Login component so App tests focus strictly on rendering App
vi.mock("./components/Login", () => ({
  default: () => <div data-testid="mock-login">Mocked Login Component</div>,
}));

describe("App Component", () => {
  it("renders without crashing and displays the Login component", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("mock-login")).toBeInTheDocument();
  });
});
