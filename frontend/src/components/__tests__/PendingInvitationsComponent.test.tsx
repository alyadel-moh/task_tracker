import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PendingInvitations from "../PendingInvitationsComponent";
import getPendingInvitations from "../../hooks/getPendingInvitations";

const mockAccept = vi.fn();
const mockDecline = vi.fn();

vi.mock("../../hooks/getPendingInvitations", () => ({ default: vi.fn() }));
vi.mock("../../hooks/acceptInvitationHook", () => ({
  default: vi.fn(() => ({ mutate: mockAccept })),
}));
vi.mock("../../hooks/declineInvitationHook", () => ({
  default: vi.fn(() => ({ mutate: mockDecline })),
}));

describe("PendingInvitations 100% Branch Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null while loading or when data is null or empty (Line 20)", () => {
    // 1. isLoading true
    vi.mocked(getPendingInvitations).mockReturnValue({
      isLoading: true,
      data: [],
    } as any);
    const { rerender, container } = render(<PendingInvitations />);
    expect(container.firstChild).toBeNull();

    // 2. data is null (Line 20: !invitations branch)
    vi.mocked(getPendingInvitations).mockReturnValue({
      isLoading: false,
      data: null as any,
    } as any);
    rerender(<PendingInvitations />);
    expect(container.firstChild).toBeNull();

    // 3. data is empty array
    vi.mocked(getPendingInvitations).mockReturnValue({
      isLoading: false,
      data: [],
    } as any);
    rerender(<PendingInvitations />);
    expect(container.firstChild).toBeNull();
  });

  it("renders pending invitations, accepts invitation, and manages loading spinner state", async () => {
    vi.mocked(getPendingInvitations).mockReturnValue({
      isLoading: false,
      data: [{ role: "OWNER", project: { id: "p1", name: "Website" } }],
    } as any);

    render(<PendingInvitations />);

    expect(screen.getByText("INVITATIONS")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();

    const acceptBtn = screen.getByRole("button", { name: /accept/i });
    const declineBtn = screen.getByRole("button", { name: /decline/i });

    // Click Accept -> sets loadingProjectId to "p1"
    fireEvent.click(acceptBtn);

    expect(mockAccept).toHaveBeenCalledWith("p1", expect.any(Object));

    // While mutating: acceptBtn shows spinner and both buttons become disabled
    expect(declineBtn).toBeDisabled();

    // Settle mutation
    const acceptOptions = mockAccept.mock.calls.at(-1)?.[1];
    act(() => {
      acceptOptions.onSettled();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /decline/i }),
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: /accept/i }),
      ).not.toBeDisabled();
    });
  });

  it("declines invitation and resets loading state via onSettled callback", async () => {
    vi.mocked(getPendingInvitations).mockReturnValue({
      isLoading: false,
      data: [{ role: "MEMBER", project: { id: "p2", name: "App" } }],
    } as any);

    render(<PendingInvitations />);

    const declineBtn = screen.getByRole("button", { name: /decline/i });
    fireEvent.click(declineBtn);

    expect(mockDecline).toHaveBeenCalledWith("p2", expect.any(Object));

    // Buttons are disabled during decline mutation
    expect(declineBtn).toBeDisabled();

    // Settle decline mutation
    const declineOptions = mockDecline.mock.calls.at(-1)?.[1];
    act(() => {
      declineOptions.onSettled();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /decline/i }),
      ).not.toBeDisabled();
    });
  });

  it("handles fallback project name and fallback role name (Lines 54 & 57)", () => {
    vi.mocked(getPendingInvitations).mockReturnValue({
      isLoading: false,
      data: [
        {
          role: null as any, // hits fallback: "member"
          project: { id: "p3", name: "" }, // hits fallback: "Untitled Project"
        },
      ],
    } as any);

    render(<PendingInvitations />);

    expect(screen.getByText("Untitled Project")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });
});
