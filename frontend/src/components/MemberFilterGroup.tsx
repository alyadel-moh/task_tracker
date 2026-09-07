import React from "react";
import { User as UserIcon } from "lucide-react";
import "../css/MemberFilterGroup.css";
import { User } from "./types";
import { useAppStore } from "../store/useAppStore";

interface MemberFilterGroupProps {
  members: User[];
  maxVisible?: number;
}

const getInitials = (name?: string | null, email?: string | null): string => {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email && email.trim()) {
    return email[0].toUpperCase();
  }
  return "U";
};

// Generates consistent distinct background colors for avatars without pictures
const getAvatarBgColor = (id: string): string => {
  const colors = [
    "#2e7d32", // Green (like image)
    "#2563eb", // Blue (like image)
    "#d97706", // Amber
    "#7c3aed", // Purple
    "#0891b2", // Cyan
    "#e11d48", // Rose
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const MemberFilterGroup: React.FC<MemberFilterGroupProps> = ({
  members = [],
  maxVisible = 4,
}) => {
  const visibleMembers = members.slice(0, maxVisible);
  const overflowCount = members.length - maxVisible;
  const { user, selectedAssigneeId, setSelectedAssigneeId } = useAppStore();

  return (
    <div
      className="member-filter-group"
      role="group"
      aria-label="Filter by member"
    >
      {/* 1. "All Members" Icon Button */}
      <button
        type="button"
        className={`member-avatar-btn all-members-btn ${
          !selectedAssigneeId ? "selected" : ""
        }`}
        data-tooltip="All Members"
        onClick={() => setSelectedAssigneeId(null)}
      >
        <UserIcon size={16} className="all-icon" />
      </button>

      {/* 2. Overlapping Member Avatars */}
      {visibleMembers.map((member) => {
        const isSelected = selectedAssigneeId === member.id;
        const initials = getInitials(member.name, member.email);
        const bgColor = getAvatarBgColor(member.id);

        return (
          <button
            key={member.id}
            type="button"
            data-tooltip={
              user?.id === member.id ? "You" : member.name || member.email
            }
            className={`member-avatar-btn ${isSelected ? "selected" : ""}`}
            onClick={() => setSelectedAssigneeId(member.id)}
          >
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name || "Member"}
                className="member-avatar-img"
              />
            ) : (
              <span
                className="member-avatar-fallback"
                style={{ backgroundColor: bgColor }}
              >
                {initials}
              </span>
            )}
          </button>
        );
      })}

      {/* 3. Overflow Counter */}
      {overflowCount > 0 && (
        <span className="member-avatar-overflow">+{overflowCount}</span>
      )}
    </div>
  );
};

export default MemberFilterGroup;
