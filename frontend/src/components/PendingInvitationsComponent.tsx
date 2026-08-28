import React, { useState } from "react";
import getPendingInviations from "../hooks/getPendingInvitations";
import useAcceptInvitation from "../hooks/acceptInvitationHook";
import useDeclineInvitation from "../hooks/declineInvitationHook";
import { FiCheck, FiX, FiMail, FiLoader } from "react-icons/fi";
import "../css/PendingInvitations.css";

export function PendingInvitations() {
  const { data: invitations = [], isLoading } = getPendingInviations();
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  if (isLoading) {
    return null; // Keep sidebar clean while initially fetching
  }

  if (!invitations || invitations.length === 0) {
    return null; // Hide completely when there are no pending invites
  }

  const handleAccept = (projectId: string) => {
    setLoadingProjectId(projectId);
    acceptMutation.mutate(projectId, {
      onSettled: () => setLoadingProjectId(null),
    });
  };

  const handleDecline = (projectId: string) => {
    setLoadingProjectId(projectId);
    declineMutation.mutate(projectId, {
      onSettled: () => setLoadingProjectId(null),
    });
  };

  return (
    <div className="sidebar-invitations-container">
      {/* Section Header */}
      <div className="sidebar-invitations-header">
        <div className="sidebar-invitations-title-group">
          <FiMail size={12} className="invitation-header-icon" />
          <span className="sidebar-invitations-title">INVITATIONS</span>
        </div>
        <span className="sidebar-invitations-badge">{invitations.length}</span>
      </div>

      {/* Invitations List */}
      <div className="sidebar-invitations-list">
        {invitations.map((invitation) => {
          const isMutating = loadingProjectId === invitation.project.id;
          const projectName = invitation.project?.name || "Untitled Project";
          const roleName = invitation.role
            ? invitation.role.toLowerCase()
            : "member";

          return (
            <div
              key={invitation.project.id}
              className="sidebar-invitation-card"
            >
              <div className="sidebar-invitation-body">
                <div className="sidebar-invitation-top">
                  <span className="status-indicator-dot" />
                  <span className="sidebar-invitation-name" title={projectName}>
                    {projectName}
                  </span>
                </div>
                <span className="sidebar-invitation-role">
                  Role: <span className="role-highlight">{roleName}</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="sidebar-invitation-actions">
                <button
                  type="button"
                  className="invitation-action-btn btn-accept"
                  disabled={isMutating}
                  onClick={() => handleAccept(invitation.project.id)}
                >
                  {isMutating ? (
                    <FiLoader size={12} className="spinner-icon" />
                  ) : (
                    <>
                      <FiCheck size={13} />
                      <span>Accept</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="invitation-action-btn btn-decline"
                  disabled={isMutating}
                  onClick={() => handleDecline(invitation.project.id)}
                >
                  <FiX size={13} />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PendingInvitations;
