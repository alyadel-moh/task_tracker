import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import MemberFilterGroup from "../MemberFilterGroup";
import { useAppStore } from "../../store/useAppStore";

describe("MemberFilterGroup 100% Branch Coverage", () => {
  it("filters members, toggles selection, shows initials and overflow", () => {
    useAppStore.setState({ user: { id: "u1" } as never });
    const onSelect = vi.fn();
    render(
      <MemberFilterGroup
        members={[
          { id: "u1", name: "Aly User", email: "aly@example.com" } as never,
          { id: "u2", name: "", email: "bob@example.com" } as never,
          {
            id: "u3",
            name: "Cara",
            email: "cara@example.com",
            photoUrl: "/cara.png",
          } as never,
        ]}
        selectedMemberId="u1"
        maxVisible={2}
        onSelectMember={onSelect}
      />,
    );
    expect(screen.getByText("AU")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();

    // Click All Members button
    fireEvent.click(screen.getByRole("button", { name: "" }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("renders image avatar with fallback alt 'Member' when name is empty (Lines 91-94)", () => {
    useAppStore.setState({ user: { id: "u1" } as never });
    render(
      <MemberFilterGroup
        members={[
          {
            id: "u4",
            name: "",
            email: "noname@example.com",
            photoUrl: "/avatar.png",
          } as never,
        ]}
        selectedMemberId={null}
        onSelectMember={vi.fn()}
      />,
    );

    const img = screen.getByRole("img", { name: "Member" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/avatar.png");
  });

  it("falls back to 'U' when a member has neither name nor email", () => {
    useAppStore.setState({ user: { id: "u1" } as never });
    render(
      <MemberFilterGroup
        members={[{ id: "u9", name: "", email: "" } as never]}
        selectedMemberId={null}
        onSelectMember={vi.fn()}
      />,
    );
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("selects an unselected member and deselects an already-selected one", () => {
    useAppStore.setState({ user: { id: "u1" } as never });
    const onSelect = vi.fn();
    render(
      <MemberFilterGroup
        members={[
          { id: "u1", name: "Aly User", email: "aly@example.com" } as never,
          { id: "u2", name: "Bob", email: "bob@example.com" } as never,
        ]}
        selectedMemberId="u1"
        onSelectMember={onSelect}
      />,
    );

    // Click selected member -> deselect (null)
    fireEvent.click(screen.getByText("AU"));
    expect(onSelect).toHaveBeenCalledWith(null);

    // Click unselected member -> select their id
    fireEvent.click(screen.getByText("B"));
    expect(onSelect).toHaveBeenCalledWith("u2");
  });

  it("shows a 'You' tooltip for the current user and the name/email otherwise", () => {
    useAppStore.setState({ user: { id: "u1" } as never });
    render(
      <MemberFilterGroup
        members={[
          { id: "u1", name: "Aly User", email: "aly@example.com" } as never,
          { id: "u2", name: "", email: "bob@example.com" } as never,
        ]}
        selectedMemberId={null}
        onSelectMember={vi.fn()}
      />,
    );

    expect(screen.getByText("AU").closest("button")).toHaveAttribute(
      "data-tooltip",
      "You",
    );
    expect(screen.getByText("B").closest("button")).toHaveAttribute(
      "data-tooltip",
      "bob@example.com",
    );
  });

  it("does not show an overflow badge when members fit within maxVisible", () => {
    useAppStore.setState({ user: { id: "u1" } as never });
    render(
      <MemberFilterGroup
        members={[
          { id: "u1", name: "Aly User", email: "aly@example.com" } as never,
        ]}
        selectedMemberId={null}
        maxVisible={4}
        onSelectMember={vi.fn()}
      />,
    );
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("handles default props when members and maxVisible are not provided", () => {
    useAppStore.setState({ user: null as never });
    render(
      <MemberFilterGroup
        members={undefined as never}
        onSelectMember={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Filter by member" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "" })).toBeInTheDocument();
  });
});
