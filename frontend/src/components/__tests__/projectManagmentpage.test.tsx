import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProjectManagementPage } from "../ProjectManagementPage";
import type { ProjectMember } from "../types";

// ---- Mock data ----
const OWNER_USER = { id: "u1", name: "Owner User", email: "owner@test.com" };
const MEMBER_USER = {
  id: "u2",
  name: "Regular Member",
  email: "member@test.com",
};

const makeMembers = (): ProjectMember[] => [
  {
    id: "m1",
    role: "OWNER",
    membershipStatus: "ACTIVE",
    user: { id: "u1", name: "Owner User", email: "owner@test.com" },
  } as ProjectMember,
  {
    id: "m2",
    role: "MEMBER",
    membershipStatus: "ACTIVE",
    user: { id: "u2", name: "Regular Member", email: "member@test.com" },
  } as ProjectMember,
  {
    id: "m3",
    role: "MEMBER",
    membershipStatus: "PENDING",
    user: { id: "u3", name: "Pending Person", email: "pending@test.com" },
  } as ProjectMember,
  {
    id: "m4",
    role: "OWNER",
    membershipStatus: "ACTIVE",
    user: { id: "u4", name: "Second Owner", email: "owner2@test.com" },
  } as ProjectMember,
];

// ---- Mutation mocks ----
const mockAddMutate = vi.fn();
const mockRemoveMutate = vi.fn();
const mockRemovePendingMutate = vi.fn();
const mockUpdateRoleMutate = vi.fn();
const mockLeaveMutate = vi.fn();
const mockNavigate = vi.fn();

let mockMembers: ProjectMember[] = [];
let mockCurrentUser: any = OWNER_USER;
let mockProjectId: string | undefined = "proj-1";
let mockAddPending = false;
let mockRemovePending = false;
let mockRemovePendingInvitePending = false;
let mockUpdateRolePending = false;
let mockLeavePending = false;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ projectId: mockProjectId }),
  };
});

vi.mock("../../hooks/getAllprojectMembers", () => ({
  default: vi.fn(() => ({ data: mockMembers })),
}));
vi.mock("../../hooks/addMemberHook", () => ({
  default: vi.fn(() => ({ mutate: mockAddMutate, isPending: mockAddPending })),
}));
vi.mock("../../hooks/removeMemberHook", () => ({
  default: vi.fn(() => ({
    mutate: mockRemoveMutate,
    isPending: mockRemovePending,
  })),
}));
vi.mock("../../hooks/removePendingMemberHook", () => ({
  default: vi.fn(() => ({
    mutate: mockRemovePendingMutate,
    isPending: mockRemovePendingInvitePending,
  })),
}));
vi.mock("../../hooks/updateRoleHook", () => ({
  default: vi.fn(() => ({
    mutate: mockUpdateRoleMutate,
    isPending: mockUpdateRolePending,
  })),
}));
vi.mock("../../hooks/leaveProjectHook", () => ({
  default: vi.fn(() => ({
    mutate: mockLeaveMutate,
    isPending: mockLeavePending,
  })),
}));
vi.mock("../../store/useAppStore", () => ({
  useAppStore: vi.fn(() => ({
    activeProject: { id: "proj-1", name: "Test Project" },
    user: mockCurrentUser,
  })),
}));
vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Simplify CustomSelect to native select
vi.mock("../CustomSelect", () => ({
  CustomSelect: ({ options, value, onChange }: any) => (
    <select
      data-testid="role-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o: any) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  ),
}));

const renderPage = (initialRoute = "/projects/proj-1/members") =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/projects/:projectId/members"
          element={<ProjectManagementPage />}
        />
        <Route path="/projects" element={<ProjectManagementPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockMembers = makeMembers();
  mockCurrentUser = OWNER_USER;
  mockProjectId = "proj-1";
  mockAddPending = false;
  mockRemovePending = false;
  mockRemovePendingInvitePending = false;
  mockUpdateRolePending = false;
  mockLeavePending = false;
});

describe("ProjectManagementPage - Stats, Filtering & Fallbacks", () => {
  it("renders member stat counts accurately", () => {
    const { container } = renderPage();
    const statsRow = container.querySelector(
      ".member-stats-row",
    ) as HTMLElement;
    expect(statsRow).toBeInTheDocument();

    const withinStats = within(statsRow);
    expect(
      withinStats.getByText("Total Members").previousSibling,
    ).toHaveTextContent("4");
    expect(withinStats.getByText("Active").previousSibling).toHaveTextContent(
      "3",
    );
    expect(withinStats.getByText("Pending").previousSibling).toHaveTextContent(
      "1",
    );
    expect(withinStats.getByText("Owners").previousSibling).toHaveTextContent(
      "2",
    );
  });

  it("renders member cards and handles fallback display name and email", () => {
    mockMembers = [
      {
        id: "m-fallback",
        role: "MEMBER",
        membershipStatus: "ACTIVE",
        user: undefined as any,
        name: "Custom Name",
        email: "fallback@test.com",
      } as any,
      {
        id: "m-empty",
        role: "MEMBER",
        membershipStatus: "ACTIVE",
        user: undefined as any,
      } as any,
    ];

    renderPage();
    expect(screen.getByText("Custom Name")).toBeInTheDocument();
    expect(screen.getByText("fallback@test.com")).toBeInTheDocument();
    expect(screen.getByText(/unknown user/i)).toBeInTheDocument();
  });

  it("resolves membership status from a raw 'status' field when membershipStatus is absent", async () => {
    mockMembers = [
      {
        id: "m-status-fallback",
        role: "MEMBER",
        status: "PENDING",
        user: { id: "u9", name: "Status Fallback", email: "sf@test.com" },
      } as any,
    ];
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^pending/i }));
    await waitFor(() =>
      expect(screen.getByText("Status Fallback")).toBeInTheDocument(),
    );

    // Scope to the card itself: the "Pending" filter tab also renders its
    // own "Pending" span, so an unscoped query matches two elements.
    const card = screen
      .getByText("Status Fallback")
      .closest(".member-card-container")!;
    expect(within(card).getByText("Pending")).toBeInTheDocument();
  });

  it("defaults membership status to ACTIVE when neither membershipStatus nor status is present", () => {
    mockMembers = [
      {
        id: "m-no-status",
        role: "MEMBER",
        user: { id: "u9", name: "No Status", email: "ns@test.com" },
      } as any,
    ];
    renderPage();
    const card = screen
      .getByText("No Status")
      .closest(".member-card-container")!;
    expect(within(card).getByText("Active")).toBeInTheDocument();
  });

  it("omits the email row when the member has no resolvable email", () => {
    mockMembers = [
      {
        id: "m-no-email",
        role: "MEMBER",
        membershipStatus: "ACTIVE",
        user: { id: "u9", name: "No Email Person" },
      } as any,
    ];
    renderPage();
    expect(screen.getByText("No Email Person")).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it("shows 'Full Project Access' for owner cards and 'Standard Collaborator' for member cards", () => {
    renderPage();
    const ownerCard = screen
      .getByText(/second owner/i)
      .closest(".member-card-container")!;
    expect(
      within(ownerCard).getByText("Full Project Access"),
    ).toBeInTheDocument();

    const memberCard = screen
      .getByText(/regular member/i)
      .closest(".member-card-container")!;
    expect(
      within(memberCard).getByText("Standard Collaborator"),
    ).toBeInTheDocument();
  });

  it("navigates back to board when clicking Back to board button", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /back to board/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/projects");
  });

  it("filters members via tabs", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^active/i }));
    await waitFor(() =>
      expect(screen.queryByText(/pending person/i)).not.toBeInTheDocument(),
    );
    expect(screen.getByText(/regular member/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^pending/i }));
    await waitFor(() =>
      expect(screen.getByText(/pending person/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/regular member/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^all/i }));
    await waitFor(() => {
      expect(screen.getByText(/regular member/i)).toBeInTheDocument();
      expect(screen.getByText(/pending person/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when active tab has no members", async () => {
    mockMembers = mockMembers.filter(
      (m) => (m as any).membershipStatus === "PENDING",
    );
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /^active/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/no active members right now/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows empty state when all tab has no members", async () => {
    mockMembers = [];
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/no members yet/i)).toBeInTheDocument(),
    );
  });
});

describe("ProjectManagementPage - Non-owner and self-view permissions", () => {
  it("hides the Add Member button entirely for a non-owner viewer", () => {
    mockCurrentUser = MEMBER_USER;
    renderPage();
    expect(
      screen.queryByRole("button", { name: /add member/i }),
    ).not.toBeInTheDocument();
  });

  it("hides per-card manage actions (toggle role / delete) for a non-owner viewer", () => {
    mockCurrentUser = MEMBER_USER;
    renderPage();
    expect(
      screen.queryByRole("button", { name: /make owner/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /make member/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete member/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /cancel invite/i }),
    ).not.toBeInTheDocument();
  });

  it("treats a user matched by member.id (no nested user object) as the current user for isCurrentUserOwner", () => {
    mockCurrentUser = OWNER_USER;
    mockMembers = [
      { id: "u1", role: "OWNER", membershipStatus: "ACTIVE" } as any,
      {
        id: "m2",
        role: "MEMBER",
        membershipStatus: "ACTIVE",
        user: { id: "u2", name: "Regular Member", email: "member@test.com" },
      } as ProjectMember,
    ];
    renderPage();
    expect(
      screen.getByRole("button", { name: /add member/i }),
    ).toBeInTheDocument();
  });

  it("is not considered an owner when no membership matches the current user at all", () => {
    mockCurrentUser = { id: "ghost", name: "Ghost", email: "ghost@test.com" };
    renderPage();
    expect(
      screen.queryByRole("button", { name: /add member/i }),
    ).not.toBeInTheDocument();
  });

  it("hides manage actions on the owner's own card even though they are an owner", () => {
    renderPage(); // mockCurrentUser = OWNER_USER (m1)

    // The card's name span renders "Owner User" and, for the viewer's own
    // card, an additional "(You)" text node in the same element — so its
    // combined textContent is "Owner User (You)", not an exact "Owner User".
    // Match with a regex instead of an exact string.
    const ownCard = screen
      .getByText(/^owner user/i)
      .closest(".member-card-container")!;
    expect(
      within(ownCard).queryByRole("button", { name: /make member/i }),
    ).not.toBeInTheDocument();
    expect(
      within(ownCard).queryByRole("button", { name: /delete member/i }),
    ).not.toBeInTheDocument();
  });

  it("labels the current user's own card with '(You)'", () => {
    renderPage();
    expect(screen.getByText(/owner user\s*\(you\)/i)).toBeInTheDocument();
  });

  it("still shows manage actions on other members' cards for the owner", () => {
    renderPage();
    const otherOwnerCard = screen
      .getByText(/second owner/i)
      .closest(".member-card-container")!;
    expect(
      within(otherOwnerCard).getByRole("button", { name: /make member/i }),
    ).toBeInTheDocument();
  });
});

describe("ProjectManagementPage - Add Member", () => {
  it("toggles the add-member form open and closed via the header button label", async () => {
    const user = userEvent.setup();
    renderPage();

    const toggleBtn = screen.getByRole("button", { name: /add member/i });
    await user.click(toggleBtn);
    expect(
      screen.getByRole("button", { name: /^close$/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(
      screen.queryByPlaceholderText(/user@example.com/i),
    ).not.toBeInTheDocument();
  });

  it("closes the add-member form via its own Cancel button without submitting", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /add member/i }));
    await user.type(
      screen.getByPlaceholderText(/user@example.com/i),
      "someone@test.com",
    );
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(
      screen.queryByPlaceholderText(/user@example.com/i),
    ).not.toBeInTheDocument();
    expect(mockAddMutate).not.toHaveBeenCalled();
  });

  it("validates empty email input", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /add member/i }));
    fireEvent.submit(
      screen.getByPlaceholderText(/user@example.com/i).closest("form")!,
    );

    expect(toast.error).toHaveBeenCalledWith("Email address is required");
    expect(mockAddMutate).not.toHaveBeenCalled();
  });

  it("submits new member and uses fallback success message if not returned by API", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockAddMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({});
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /add member/i }));
    await user.type(
      screen.getByPlaceholderText(/user@example.com/i),
      "new@test.com",
    );
    fireEvent.submit(
      screen.getByPlaceholderText(/user@example.com/i).closest("form")!,
    );

    expect(mockAddMutate).toHaveBeenCalledWith(
      { email: "new@test.com", role: "MEMBER" },
      expect.anything(),
    );
    expect(toast.success).toHaveBeenCalledWith("Invitation sent successfully!");
  });

  it("submits with the OWNER role once selected via the role dropdown", async () => {
    const user = userEvent.setup();
    mockAddMutate.mockImplementation((_payload, { onSuccess }) =>
      onSuccess({}),
    );
    renderPage();

    await user.click(screen.getByRole("button", { name: /add member/i }));
    await user.type(
      screen.getByPlaceholderText(/user@example.com/i),
      "owner-invite@test.com",
    );
    await user.selectOptions(screen.getByTestId("role-select"), "OWNER");
    fireEvent.submit(
      screen.getByPlaceholderText(/user@example.com/i).closest("form")!,
    );

    expect(mockAddMutate).toHaveBeenCalledWith(
      { email: "owner-invite@test.com", role: "OWNER" },
      expect.anything(),
    );
  });

  it("handles invite member error with error.response.data.error fallback", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockAddMutate.mockImplementation((_payload, { onError }) => {
      onError({ response: { data: { error: "Specific error message" } } });
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /add member/i }));
    await user.type(
      screen.getByPlaceholderText(/user@example.com/i),
      "err@test.com",
    );
    fireEvent.submit(
      screen.getByPlaceholderText(/user@example.com/i).closest("form")!,
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Specific error message"),
    );
  });

  it("prefers error.message over the fallback when response data is absent", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockAddMutate.mockImplementation((_payload, { onError }) => {
      onError({ message: "Network down" });
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /add member/i }));
    await user.type(
      screen.getByPlaceholderText(/user@example.com/i),
      "err2@test.com",
    );
    fireEvent.submit(
      screen.getByPlaceholderText(/user@example.com/i).closest("form")!,
    );

    expect(toast.error).toHaveBeenCalledWith("Network down");
  });

  it("disables the submit button and shows 'Adding...' while the mutation is pending", async () => {
    mockAddPending = true;
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /add member/i }));
    const submitBtn = screen.getByRole("button", { name: /adding\.\.\./i });
    expect(submitBtn).toBeDisabled();
  });
});

describe("ProjectManagementPage - Remove & Role Mutations", () => {
  it("cancels a pending invite and shows a success toast with a fallback message", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockRemovePendingMutate.mockImplementation((_id, { onSuccess }) => {
      onSuccess({});
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /cancel invite/i }));

    expect(mockRemovePendingMutate).toHaveBeenCalledWith(
      "m3",
      expect.anything(),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Invitation for Pending Person cancelled.",
    );
  });

  it("hits the fallback error path for a cancelled pending invite", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockRemovePendingMutate.mockImplementation((_id, { onError }) => {
      onError({});
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /cancel invite/i }));

    expect(mockRemovePendingMutate).toHaveBeenCalledWith(
      "m3",
      expect.anything(),
    );
    expect(toast.error).toHaveBeenCalledWith("Failed to cancel invitation.");
  });

  it("handles remove active member error with default fallback string", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockRemoveMutate.mockImplementation((_payload, { onError }) => {
      onError({});
    });

    renderPage();
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete member/i,
    });
    await user.click(deleteButtons[0]);

    expect(mockRemoveMutate).toHaveBeenCalledWith(
      { id: "m2", userId: "u2" },
      expect.anything(),
    );
    expect(toast.error).toHaveBeenCalledWith("Failed to remove member.");
  });

  it("handles remove active member success fallback message", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockRemoveMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({});
    });

    renderPage();
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete member/i,
    });
    await user.click(deleteButtons[0]);

    expect(toast.success).toHaveBeenCalledWith(
      "Regular Member removed from project.",
    );
  });

  it("toggles member role from OWNER to MEMBER", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockUpdateRoleMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({});
    });

    renderPage();
    const makeMemberBtn = screen.getByRole("button", { name: /make member/i });
    await user.click(makeMemberBtn);

    expect(mockUpdateRoleMutate).toHaveBeenCalledWith(
      { id: "m4", role: "MEMBER" },
      expect.anything(),
    );
    expect(toast.success).toHaveBeenCalledWith("Role updated to MEMBER.");
  });

  it("handles toggle role error with default fallback", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockUpdateRoleMutate.mockImplementation((_payload, { onError }) => {
      onError({});
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /make owner/i }));

    expect(toast.error).toHaveBeenCalledWith("Failed to update role.");
  });

  it("disables the role-toggle button while its mutation is pending", () => {
    mockUpdateRolePending = true;
    renderPage();
    expect(screen.getByRole("button", { name: /make owner/i })).toBeDisabled();
  });

  it("does not render a role-toggle button on pending (not-yet-active) members", () => {
    renderPage();
    const pendingCard = screen
      .getByText(/pending person/i)
      .closest(".member-card-container")!;
    expect(
      within(pendingCard).queryByRole("button", {
        name: /make (owner|member)/i,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("ProjectManagementPage - Leave Project", () => {
  it("does not open confirmation modal when projectId is empty", async () => {
    mockProjectId = "";
    const user = userEvent.setup();
    renderPage("/projects");

    const leaveBtn = screen.getByRole("button", { name: /leave project/i });
    await user.click(leaveBtn);

    expect(screen.queryByText(/leave ""\?/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/are you sure you want to leave this project\?/i),
    ).not.toBeInTheDocument();
  });

  it("stops propagation when clicking inside the modal card (does not close it)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /leave project/i }));
    const modalCard = document.querySelector(".pm-modal-card")!;
    expect(modalCard).toBeInTheDocument();

    await user.click(modalCard);
    expect(screen.getByText(/leave "test project"\?/i)).toBeInTheDocument();
  });

  it("closes the modal when clicking the overlay outside the card", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /leave project/i }));
    expect(document.querySelector(".pm-modal-overlay")).toBeInTheDocument();

    await user.click(document.querySelector(".pm-modal-overlay")!);
    expect(document.querySelector(".pm-modal-overlay")).not.toBeInTheDocument();
  });

  it("closes the modal via its own Cancel button without calling the mutation", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /leave project/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(document.querySelector(".pm-modal-overlay")).not.toBeInTheDocument();
    expect(mockLeaveMutate).not.toHaveBeenCalled();
  });

  it("confirms leaving, shows a success toast, and navigates away with a fallback message", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockLeaveMutate.mockImplementation((id, { onSuccess }) => {
      expect(id).toBe("proj-1");
      onSuccess({});
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /leave project/i }));
    const modalLeaveBtn = screen
      .getAllByRole("button", { name: /leave project/i })
      .find((btn) => btn.className.includes("pm-modal-btn-danger"))!;
    await user.click(modalLeaveBtn);

    expect(toast.success).toHaveBeenCalledWith("You have left the project.");
    expect(mockNavigate).toHaveBeenCalledWith("/projects", { replace: true });
    expect(document.querySelector(".pm-modal-overlay")).not.toBeInTheDocument();
  });

  it("handles leave project error with default fallback message and keeps the user on the page", async () => {
    const { toast } = await import("react-hot-toast");
    const user = userEvent.setup();
    mockLeaveMutate.mockImplementation((_id, { onError }) => {
      onError({});
    });

    renderPage();
    await user.click(screen.getByRole("button", { name: /leave project/i }));

    const modalLeaveBtn = screen
      .getAllByRole("button", { name: /leave project/i })
      .find((btn) => btn.className.includes("pm-modal-btn-danger"))!;
    await user.click(modalLeaveBtn);

    expect(toast.error).toHaveBeenCalledWith("Failed to leave project.");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(document.querySelector(".pm-modal-overlay")).not.toBeInTheDocument();
  });

  it("disables both leave buttons and shows 'Leaving...' while the mutation is pending", () => {
    mockLeavePending = true;
    renderPage();

    const leaveButtons = screen.getAllByRole("button", {
      name: /leaving\.\.\./i,
    });
    expect(leaveButtons.length).toBeGreaterThan(0);
    leaveButtons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
