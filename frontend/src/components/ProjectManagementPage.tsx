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

  const filteredMembers = members.filter((m) => {
    const status = getStatus(m);
    if (activeTab === "ACTIVE") return status === "ACTIVE";
    if (activeTab === "PENDING") return status === "PENDING";
    return true;
  });

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
    <div className="task-page">
      <div className="task-page-container">
        {/* Header Bar */}
        <div className="task-page-header">
          <div className="task-page-header-nav-group">
            <button
              type="button"
              className="task-page-back"
              onClick={() => navigate(`/projects`)}
            >
              <FiArrowLeft size={16} />
              <span>Back to board</span>
            </button>

            <div className="header-divider" />

            {/* Live Project Identity */}
            <div className="project-brand-badge">
              <div className="project-brand-icon">
                <FiLayers size={14} />
              </div>
              <div className="project-brand-meta">
                <span className="project-brand-name">
                  {activeProject?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Leave Project Action */}
          <div className="header-right-meta">
            <button
              type="button"
              className="header-leave-project-btn"
              onClick={handleLeaveProjectClick}
              disabled={leaveProjectMutation.isPending}
              title="Leave this project"
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

        {/* Full-Width Project Members Card */}
        <div className="task-page-card">
          <div className="task-page-card-header">
            <div className="task-page-header-left">
              <div className="task-page-icon-wrapper">
                <FiUsers size={22} />
              </div>
              <div>
                <h1 className="task-page-main-title">Project Members</h1>
              </div>
            </div>

            {/* Add Member Button - Only visible to owners */}
            {isCurrentUserOwner && (
              <button
                type="button"
                className="add-entry-btn"
                onClick={() => setShowAddMember((prev) => !prev)}
              >
                <FiUserPlus size={14} />
                <span>{showAddMember ? "Close" : "Add Member"}</span>
              </button>
            )}
          </div>

          {/* Add Member Form - Only rendered for owners */}
          {isCurrentUserOwner && showAddMember && (
            <form className="add-entry-form" onSubmit={handleAddMember}>
              <div className="add-entry-row">
                <div className="add-entry-field">
                  <label>Member Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="add-entry-field">
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

              <div className="add-entry-actions">
                <button
                  type="button"
                  className="inline-field-action inline-field-cancel"
                  onClick={() => setShowAddMember(false)}
                >
                  <FiX size={14} style={{ marginRight: "4px" }} /> Cancel
                </button>
                <button
                  type="submit"
                  className="inline-field-action inline-field-save"
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

          {/* Member Cards List */}
          <div className="task-page-body">
            {filteredMembers.map((member) => {
              const displayName =
                member.user?.name || (member as any).name || "Unknown User";
              const displayEmail =
                member.user?.email || (member as any).email || "";
              const isPending = getStatus(member) === "PENDING";
              const initials = displayName.substring(0, 2).toUpperCase();
              const memberUserId = member.user?.id || member.id;
              const isSelf = Boolean(user?.id && memberUserId === user.id);
              const canManageCard = isCurrentUserOwner && !isSelf;

              return (
                <div
                  key={member.id}
                  className={`member-card-container ${isPending ? "pending-style" : ""}`}
                >
                  {canManageCard && (
                    <div className="member-card-actions-group">
                      {!isPending && (
                        <button
                          type="button"
                          className="member-card-action-btn action-toggle-role"
                          title={`Change role to ${member.role === "OWNER" ? "Member" : "Owner"}`}
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

                  {/* Badges */}
                  <div className="member-card-header-row">
                    <div className="member-card-badges">
                      <span className="member-badge-role">
                        <FiShield size={11} />{" "}
                        {member.role === "OWNER" ? "Owner" : "Member"}
                      </span>
                      <span
                        className={`member-badge-status ${
                          isPending ? "status-pending" : "status-active"
                        }`}
                      >
                        <span
                          className={`badge-dot ${
                            isPending ? "dot-amber" : "dot-green"
                          }`}
                        />
                        {isPending ? "Pending" : "Active"}
                      </span>
                    </div>
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
                        {member.role === "OWNER"
                          ? "Full Project Access"
                          : "Standard Collaborator"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Leaving Project */}
      {isConfirmingLeave && (
        <div
          className="modal-overlay"
          onClick={() => setIsConfirmingLeave(false)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon modal-header-icon-danger">
                <FiAlertTriangle size={18} aria-hidden="true" />
              </div>
            </div>

            <h2 className="modal-title">Leave "{activeProject?.name}"?</h2>
            <p className="modal-subtitle">
              Are you sure you want to leave this project? You will lose access
              to its resources and boards.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-button modal-button-secondary"
                onClick={() => setIsConfirmingLeave(false)}
                disabled={leaveProjectMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-button modal-button-danger"
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
