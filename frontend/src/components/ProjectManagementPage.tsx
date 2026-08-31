import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "../css/ProjectManagementPage.css";
import useAddMember from "../hooks/addMemberHook";
import useGetProjectMembers from "../hooks/getAllprojectMembers";
import useRemoveMember from "../hooks/removeMemberHook";
import useRemovePendingMember from "../hooks/removePendingMemberHook";
import useUpdateRole from "../hooks/updateRoleHook";
import useLeaveProject from "../hooks/leaveProjectHook";
import { CustomSelect } from "./CustomSelect";
import { type ProjectMember, type Role, type MembershipStatus } from "./types";
import {
  FiArrowLeft,
  FiUsers,
  FiUserPlus,
  FiMail,
  FiShield,
  FiCheck,
  FiX,
  FiLayers,
  FiTrash2,
  FiXCircle,
  FiRepeat,
  FiLogOut,
  FiAlertTriangle,
  FiAward,
  FiClock,
} from "react-icons/fi";
import { useAppStore } from "../store/useAppStore";

const ROLE_OPTIONS = [
  { id: "MEMBER", name: "Member" },
  { id: "OWNER", name: "Owner" },
];

const getErrorMessage = (error: any, fallback: string): string => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

export function ProjectManagementPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject, user } = useAppStore();

  const { data: members = [] } = useGetProjectMembers(projectId);
  const addMemberMutation = useAddMember(projectId);
  const removeMemberMutation = useRemoveMember(projectId);
  const removePendingMemberMutation = useRemovePendingMember(projectId);
  const updateRoleMutation = useUpdateRole(projectId);
  const leaveProjectMutation = useLeaveProject(projectId);

  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "PENDING">(
    "ALL",
  );
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);

  const getStatus = (m: ProjectMember): MembershipStatus =>
    (m.membershipStatus || (m as any).status || "ACTIVE") as MembershipStatus;

  const isCurrentUserOwner = Boolean(
    user?.id &&
    members.some((m) => {
      const memberUserId = m.user?.id || m.id;
      return memberUserId === user.id && m.role === "OWNER";
    }),
  );

  const activeCount = members.filter((m) => getStatus(m) === "ACTIVE").length;
  const pendingCount = members.filter((m) => getStatus(m) === "PENDING").length;
  const ownerCount = members.filter((m) => m.role === "OWNER").length;

  const filteredMembers = members.filter((m) => {
    const status = getStatus(m);
    if (activeTab === "ACTIVE") return status === "ACTIVE";
    if (activeTab === "PENDING") return status === "PENDING";
    return true;
  });

  const emptyStateCopy: Record<typeof activeTab, string> = {
    ALL: "No members yet. Invite someone to get started.",
    ACTIVE: "No active members right now.",
    PENDING: "No pending invitations.",
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Email address is required");
      return;
    }

    addMemberMutation.mutate(
      {
        email: inviteEmail.trim(),
        role: inviteRole,
      },
      {
        onSuccess: (data: any) => {
          toast.success(data?.message || "Invitation sent successfully!");
          setInviteEmail("");
          setInviteRole("MEMBER");
          setShowAddMember(false);
        },
        onError: (error: any) => {
          toast.error(getErrorMessage(error, "Failed to invite member."));
        },
      },
    );
  };

  const handleRemoveMember = (targetMember: ProjectMember) => {
    const isPending = getStatus(targetMember) === "PENDING";
    const memberName =
      targetMember.user?.name ||
      (targetMember as any).name ||
      targetMember.user?.email ||
      "Member";

    if (isPending) {
      removePendingMemberMutation.mutate(targetMember.id, {
        onSuccess: (data: any) => {
          toast.success(
            data?.message || `Invitation for ${memberName} cancelled.`,
          );
        },
        onError: (error: any) => {
          toast.error(getErrorMessage(error, "Failed to cancel invitation."));
        },
      });
    } else {
      removeMemberMutation.mutate(
        { id: targetMember.id, userId: targetMember.user.id },
        {
          onSuccess: (data: any) => {
            toast.success(
              data?.message || `${memberName} removed from project.`,
            );
          },
          onError: (error: any) => {
            toast.error(getErrorMessage(error, "Failed to remove member."));
          },
        },
      );
    }
  };

  const handleToggleRole = (targetMember: ProjectMember) => {
    const nextRole: Role = targetMember.role === "OWNER" ? "MEMBER" : "OWNER";
    updateRoleMutation.mutate(
      {
        id: targetMember.id,
        role: nextRole,
      },
      {
        onSuccess: (data: any) => {
          toast.success(data?.message || `Role updated to ${nextRole}.`);
        },
        onError: (error: any) => {
          toast.error(getErrorMessage(error, "Failed to update role."));
        },
      },
    );
  };

  const handleLeaveProjectClick = () => {
    if (!projectId) return;
    setIsConfirmingLeave(true);
  };

  const handleConfirmLeave = () => {
    leaveProjectMutation.mutate(projectId, {
      onSuccess: (data: any) => {
        toast.success(data?.message || "You have left the project.");
        setIsConfirmingLeave(false);
        navigate("/projects", { replace: true });
      },
      onError: (error: any) => {
        setIsConfirmingLeave(false);
        toast.error(getErrorMessage(error, "Failed to leave project."));
      },
    });
  };

  return (
    <div className="pm-page">
      <div className="pm-page-container">
        {/* Header Bar */}
        <div className="pm-page-header">
          <div className="pm-header-nav-group">
            <button
              type="button"
              className="pm-back-btn"
              onClick={() => navigate(`/projects`)}
            >
              <FiArrowLeft size={16} />
              <span>Back to board</span>
            </button>

            <div className="pm-header-divider" />

            <div className="pm-brand-badge">
              <div className="pm-brand-icon">
                <FiLayers size={14} />
              </div>
              <div className="pm-brand-meta">
                <span className="pm-brand-name">{activeProject?.name}</span>
              </div>
            </div>
          </div>

          <div className="pm-header-right">
            <button
              type="button"
              className="pm-leave-btn"
              onClick={handleLeaveProjectClick}
              disabled={leaveProjectMutation.isPending}
            >
              <FiLogOut size={14} />
              <span>
                {leaveProjectMutation.isPending
                  ? "Leaving..."
                  : "Leave Project"}
              </span>
            </button>
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="member-stats-row">
          <div className="member-stat-card">
            <div className="member-stat-icon stat-icon-total">
              <FiUsers size={18} />
            </div>
            <div className="member-stat-meta">
              <span className="member-stat-value">{members.length}</span>
              <span className="member-stat-label">Total Members</span>
            </div>
          </div>

          <div className="member-stat-card">
            <div className="member-stat-icon stat-icon-active">
              <FiCheck size={18} />
            </div>
            <div className="member-stat-meta">
              <span className="member-stat-value">{activeCount}</span>
              <span className="member-stat-label">Active</span>
            </div>
          </div>

          <div className="member-stat-card">
            <div className="member-stat-icon stat-icon-pending">
              <FiClock size={18} />
            </div>
            <div className="member-stat-meta">
              <span className="member-stat-value">{pendingCount}</span>
              <span className="member-stat-label">Pending</span>
            </div>
          </div>

          <div className="member-stat-card">
            <div className="member-stat-icon stat-icon-owner">
              <FiAward size={18} />
            </div>
            <div className="member-stat-meta">
              <span className="member-stat-value">{ownerCount}</span>
              <span className="member-stat-label">Owners</span>
            </div>
          </div>
        </div>

        {/* Full-Width Project Members Card */}
        <div className="pm-card">
          <div className="pm-card-header">
            <div className="pm-card-header-left">
              <div className="pm-icon-wrapper">
                <FiUsers size={22} />
              </div>
              <div>
                <h1 className="pm-main-title">Project Members</h1>
              </div>
            </div>

            {isCurrentUserOwner && (
              <button
                type="button"
                className="pm-add-member-btn"
                onClick={() => setShowAddMember((prev) => !prev)}
              >
                <FiUserPlus size={14} />
                <span>{showAddMember ? "Close" : "Add Member"}</span>
              </button>
            )}
          </div>

          {isCurrentUserOwner && showAddMember && (
            <form className="pm-add-form" onSubmit={handleAddMember}>
              <div className="pm-add-form-row">
                <div className="pm-add-field">
                  <label>Member Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="pm-add-field">
                  <label>Role</label>
                  <CustomSelect
                    options={ROLE_OPTIONS}
                    value={inviteRole}
                    onChange={(val) => setInviteRole(val as Role)}
                    placeholder="Select Role"
                    icon={<FiShield size={14} />}
                  />
                </div>
              </div>

              <div className="pm-add-actions">
                <button
                  type="button"
                  className="pm-form-action pm-form-cancel"
                  onClick={() => setShowAddMember(false)}
                >
                  <FiX size={14} style={{ marginRight: "4px" }} /> Cancel
                </button>
                <button
                  type="submit"
                  className="pm-form-action pm-form-save"
                  disabled={addMemberMutation.isPending}
                >
                  <FiCheck size={14} style={{ marginRight: "4px" }} />
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          )}

          {/* Filter Tabs */}
          <div className="member-filter-tabs">
            <button
              type="button"
              className={`member-filter-tab ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              <span>All</span>
              <span className="tab-count-pill">{members.length}</span>
            </button>
            <button
              type="button"
              className={`member-filter-tab ${activeTab === "ACTIVE" ? "active" : ""}`}
              onClick={() => setActiveTab("ACTIVE")}
            >
              <span className="tab-status-dot dot-green" />
              <span>Active</span>
              <span className="tab-count-pill">{activeCount}</span>
            </button>
            <button
              type="button"
              className={`member-filter-tab ${activeTab === "PENDING" ? "active" : ""}`}
              onClick={() => setActiveTab("PENDING")}
            >
              <span className="tab-status-dot dot-amber" />
              <span>Pending</span>
              <span className="tab-count-pill">{pendingCount}</span>
            </button>
          </div>

          {/* Member Cards Grid */}
          <div className="pm-members-grid">
            {filteredMembers.length === 0 ? (
              <div className="member-list-empty">
                <FiUsers size={28} />
                <p>{emptyStateCopy[activeTab]}</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const displayName =
                  member.user?.name || (member as any).name || "Unknown User";
                const displayEmail =
                  member.user?.email || (member as any).email || "";
                const isPending = getStatus(member) === "PENDING";
                const initials = displayName.substring(0, 2).toUpperCase();
                const memberUserId = member.user?.id || member.id;
                const isSelf = Boolean(user?.id && memberUserId === user.id);
                const canManageCard = isCurrentUserOwner && !isSelf;
                const isOwner = member.role === "OWNER";

                return (
                  <div
                    key={member.id}
                    className={`member-card-container ${
                      isPending ? "pending-style" : ""
                    } ${isOwner ? "owner-style" : ""}`}
                  >
                    <div className="member-card-header-row">
                      <div className="member-card-badges">
                        <span className="member-badge-role">
                          {isOwner ? (
                            <FiAward size={11} />
                          ) : (
                            <FiShield size={11} />
                          )}{" "}
                          {isOwner ? "Owner" : "Member"}
                        </span>
                        <span
                          className={`member-badge-status ${
                            isPending ? "status-pending" : "status-active"
                          }`}
                        >
                          <span
                            className={`badge-dot ${isPending ? "dot-amber" : "dot-green"}`}
                          />
                          {isPending ? "Pending" : "Active"}
                        </span>
                      </div>

                      {canManageCard && (
                        <div className="member-card-actions-group">
                          {!isPending && (
                            <button
                              type="button"
                              className="member-card-action-btn action-toggle-role"
                              disabled={updateRoleMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRole(member);
                              }}
                            >
                              <FiRepeat size={12} />
                              <span>
                                {member.role === "OWNER"
                                  ? "Make Member"
                                  : "Make Owner"}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            className={`member-card-action-btn ${
                              isPending
                                ? "action-cancel-invite"
                                : "action-delete-member"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(member);
                            }}
                          >
                            {isPending ? (
                              <>
                                <FiXCircle size={13} />
                                <span>Cancel Invite</span>
                              </>
                            ) : (
                              <>
                                <FiTrash2 size={13} />
                                <span>Delete Member</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="member-card-main-content">
                      <div className="member-card-avatar">{initials}</div>
                      <div className="member-card-details">
                        <span className="member-card-name">
                          {displayName} {isSelf && "(You)"}
                        </span>
                        {displayEmail && (
                          <span className="member-card-email">
                            <FiMail size={12} />
                            {displayEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="member-card-footer-row">
                      <div className="member-footer-item">
                        <span className="footer-label">Access Level</span>
                        <span className="footer-value">
                          {isOwner
                            ? "Full Project Access"
                            : "Standard Collaborator"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isConfirmingLeave && (
        <div
          className="pm-modal-overlay"
          onClick={() => setIsConfirmingLeave(false)}
        >
          <div
            className="pm-modal-card"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-modal-header">
              <div className="pm-modal-header-icon pm-modal-header-icon-danger">
                <FiAlertTriangle size={18} aria-hidden="true" />
              </div>
            </div>

            <h2 className="pm-modal-title">Leave "{activeProject?.name}"?</h2>
            <p className="pm-modal-subtitle">
              Are you sure you want to leave this project? You will lose access
              to its resources and boards.
            </p>

            <div className="pm-modal-actions">
              <button
                type="button"
                className="pm-modal-btn pm-modal-btn-secondary"
                onClick={() => setIsConfirmingLeave(false)}
                disabled={leaveProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pm-modal-btn pm-modal-btn-danger"
                onClick={handleConfirmLeave}
                disabled={leaveProjectMutation.isPending}
              >
                {leaveProjectMutation.isPending
                  ? "Leaving..."
                  : "Leave Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
