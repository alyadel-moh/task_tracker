import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import DashboardSidebar from "../DashboardSidebar";
import { useAppStore } from "../../store/useAppStore";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogoutMutate = vi.fn();
vi.mock("../../hooks/logoutHook", () => ({
  default: () => ({
    mutate: mockLogoutMutate,
  }),
}));

const mockProjects = [
  {
    role: "OWNER",
    project: { id: "p1", name: "Website Redesign" },
  },
  {
    role: "MEMBER",
    project: { id: "p2", name: "Mobile App" },
  },
];

const mockGetAssignedProjects = vi.fn(() => ({ data: mockProjects }));
vi.mock("../../hooks/getProjectsHook", () => ({
  default: (...args: any[]) => mockGetAssignedProjects(...args),
}));

vi.mock("../PendingInvitationsComponent", () => ({
  default: () => <div data-testid="pending-invitations">Invitations</div>,
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <DashboardSidebar />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DashboardSidebar", () => {
  const baseUser = {
    id: "u1",
    name: "Aly Adel",
    email: "aly@example.com",
    updatedAt: "2026-03-01T12:00:00.000Z",
    photoUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAssignedProjects.mockReturnValue({ data: mockProjects });
    useAppStore.setState({
      user: baseUser as any,
      activeProject: mockProjects[0].project as any,
      userRole: "OWNER",
      isCreateProjectOpen: false,
      isUserProfileModalOpen: false,
      projectToDelete: null,
    });
  });

  describe("Project Navigation & State", () => {
    it("renders the projects list with correct active class", () => {
      renderSidebar();

      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("Website Redesign")).toBeInTheDocument();
      expect(screen.getByText("Mobile App")).toBeInTheDocument();
      expect(screen.getByTestId("pending-invitations")).toBeInTheDocument();

      const websiteBtn = screen.getByText("Website Redesign").closest("button");
      expect(websiteBtn).toHaveClass("project-item-active");
    });

    it("switches active project on click and updates role in store", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const mobileAppBtn = screen.getByText("Mobile App");
      await user.click(mobileAppBtn);

      expect(useAppStore.getState().activeProject).toEqual(
        mockProjects[1].project,
      );
      expect(useAppStore.getState().userRole).toBe("MEMBER");
    });

    it("opens the create project modal when clicking 'New project'", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const newProjectBtn = screen.getByRole("button", {
        name: /new project/i,
      });
      await user.click(newProjectBtn);

      expect(useAppStore.getState().isCreateProjectOpen).toBe(true);
    });

    it("skips rendering a project row when the item has no resolvable project id", () => {
      mockGetAssignedProjects.mockReturnValue({
        data: [
          ...mockProjects,
          { role: "MEMBER", project: null },
          { role: "MEMBER" },
        ],
      });
      renderSidebar();

      // Only the two valid projects render as project-item rows.
      const rows = document.querySelectorAll(".project-item-row");
      expect(rows).toHaveLength(2);
      expect(screen.getByText("Website Redesign")).toBeInTheDocument();
      expect(screen.getByText("Mobile App")).toBeInTheDocument();
    });

    it("resolves the project id from a flattened item (no nested 'project' key)", () => {
      mockGetAssignedProjects.mockReturnValue({
        data: [{ role: "MEMBER", id: "p3", name: "Flat Project" }],
      });
      renderSidebar();

      expect(screen.getByText("Flat Project")).toBeInTheDocument();
    });
  });

  describe("Owner Project Actions", () => {
    it("renders delete button only for projects where user is OWNER", () => {
      renderSidebar();

      const deleteButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.classList.contains("project-delete-inline-btn"));
      expect(deleteButtons).toHaveLength(1);
      expect(deleteButtons[0]).toHaveAttribute(
        "data-tooltip",
        "Delete Website Redesign",
      );
    });

    it("sets projectToDelete without changing active project when delete button is clicked", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const deleteBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.classList.contains("project-delete-inline-btn"))!;

      await user.click(deleteBtn);

      expect(useAppStore.getState().projectToDelete).toEqual({
        id: "p1",
        name: "Website Redesign",
      });
      expect(useAppStore.getState().activeProject?.id).toBe("p1");
    });
  });

  describe("Project Management Link", () => {
    it("navigates to memberships page when clicking Project Management", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const mgmtBtn = screen.getByRole("button", {
        name: /project management/i,
      });
      await user.click(mgmtBtn);

      expect(mockNavigate).toHaveBeenCalledWith("/projects/p1/memberships", {
        state: { activeProjectName: "Website Redesign" },
      });
    });

    it("hides Project Management button when activeProject is null", () => {
      useAppStore.setState({ activeProject: null });
      renderSidebar();

      expect(
        screen.queryByRole("button", { name: /project management/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("User role resolution effect", () => {
    it("sets userRole from the matching membership when the active project is found", () => {
      useAppStore.setState({ activeProject: mockProjects[0].project as any });
      renderSidebar();
      expect(useAppStore.getState().userRole).toBe("OWNER");
    });

    it("clears userRole to undefined when the active project has no matching membership", () => {
      useAppStore.setState({
        activeProject: { id: "does-not-exist", name: "Ghost Project" } as any,
        userRole: "OWNER",
      });
      renderSidebar();
      expect(useAppStore.getState().userRole).toBeUndefined();
    });

    it("clears userRole to undefined when there is no active project at all", () => {
      useAppStore.setState({ activeProject: null, userRole: "OWNER" });
      renderSidebar();
      expect(useAppStore.getState().userRole).toBeUndefined();
    });

    it("does not render a role row once userRole has been cleared", () => {
      useAppStore.setState({ activeProject: null, userRole: "OWNER" });
      renderSidebar();
      expect(screen.queryByText("OWNER")).not.toBeInTheDocument();
    });
  });

  describe("User Profile Controls", () => {
    it("renders user details, initials, and role", () => {
      renderSidebar();

      expect(screen.getByText("Aly Adel")).toBeInTheDocument();
      expect(screen.getByText("aly@example.com")).toBeInTheDocument();
      expect(screen.getByText("OWNER")).toBeInTheDocument();
      expect(screen.getByText("AA")).toBeInTheDocument();
      expect(screen.getByText(/updated mar 1, 2026/i)).toBeInTheDocument();
    });

    it("renders user avatar image when photoUrl is present", () => {
      useAppStore.setState({
        user: {
          ...baseUser,
          photoUrl: "https://example.com/avatar.jpg",
        } as any,
      });
      renderSidebar();

      const avatar = screen.getByRole("img", { name: "Aly Adel" });
      expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
    });

    it("omits the 'Updated ...' row when updatedAt is missing", () => {
      useAppStore.setState({
        user: { ...baseUser, updatedAt: undefined } as any,
      });
      renderSidebar();

      expect(screen.queryByText(/updated /i)).not.toBeInTheDocument();
      expect(document.querySelector(".user-dates")).not.toBeInTheDocument();
    });

    it("omits the 'Updated ...' row when updatedAt is an unparsable date string", () => {
      useAppStore.setState({
        user: { ...baseUser, updatedAt: "not-a-real-date" } as any,
      });
      renderSidebar();

      expect(screen.queryByText(/updated /i)).not.toBeInTheDocument();
      expect(document.querySelector(".user-dates")).not.toBeInTheDocument();
    });

    it("opens the user profile modal on click and keyboard press", async () => {
      const user = userEvent.setup();
      const { container } = renderSidebar();

      const userCard = container.querySelector(".sidebar-user") as HTMLElement;
      expect(userCard).toBeInTheDocument();

      // Click
      await user.click(userCard);
      expect(useAppStore.getState().isUserProfileModalOpen).toBe(true);

      useAppStore.setState({ isUserProfileModalOpen: false });

      // Enter key
      fireEvent.keyDown(userCard, { key: "Enter" });
      expect(useAppStore.getState().isUserProfileModalOpen).toBe(true);

      useAppStore.setState({ isUserProfileModalOpen: false });

      // Space key
      fireEvent.keyDown(userCard, { key: " " });
      expect(useAppStore.getState().isUserProfileModalOpen).toBe(true);

      useAppStore.setState({ isUserProfileModalOpen: false });

      // An unrelated key should not open the modal.
      fireEvent.keyDown(userCard, { key: "Tab" });
      expect(useAppStore.getState().isUserProfileModalOpen).toBe(false);
    });
  });

  describe("Logout Flow", () => {
    it("handles successful logout, resets store user, and navigates to /login", async () => {
      const user = userEvent.setup();
      const { toast } = await import("react-hot-toast");

      mockLogoutMutate.mockImplementation((_args, { onSuccess }) => {
        onSuccess({ message: "Goodbye!" });
      });

      renderSidebar();

      await user.click(screen.getByRole("button", { name: /log out/i }));

      expect(mockLogoutMutate).toHaveBeenCalledTimes(1);
      expect(useAppStore.getState().user).toBeNull();
      expect(toast.success).toHaveBeenCalledWith("Goodbye!");
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });

    it("falls back to a default success message when the API returns none", async () => {
      const user = userEvent.setup();
      const { toast } = await import("react-hot-toast");

      mockLogoutMutate.mockImplementation((_args, { onSuccess }) => {
        onSuccess({});
      });

      renderSidebar();
      await user.click(screen.getByRole("button", { name: /log out/i }));

      expect(toast.success).toHaveBeenCalledWith("Logged out successfully");
    });

    it("clears user and redirects to /login even if logout API returns an error", async () => {
      const user = userEvent.setup();
      const { toast } = await import("react-hot-toast");

      mockLogoutMutate.mockImplementation((_args, { onError }) => {
        onError(new Error("Network Error"));
      });

      renderSidebar();

      await user.click(screen.getByRole("button", { name: /log out/i }));

      expect(useAppStore.getState().user).toBeNull();
      expect(toast.error).toHaveBeenCalledWith("Logged out");
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });
  });
});
