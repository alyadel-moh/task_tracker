import {
  Folder,
  LogOut,
  Plus,
  Trash2,
  Clock,
  Mail,
  UserIcon,
  Users,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import PendingInvitations from "./PendingInvitationsComponent";
import { useAppStore } from "../store/useAppStore";
import useGetAssignedProjects from "../hooks/getProjectsHook";
import useLogout from "../hooks/logoutHook";

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const {
    user,
    setUser,
    activeProject,
    setActiveProject,
    setCreateProjectOpen,
    setUserProfileModalOpen,
    setProjectToDelete,
  } = useAppStore();

  const { data: projects = [] } = useGetAssignedProjects();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        setUser(null);
        toast.success(data?.message || "Logged out successfully");
        navigate("/login", { replace: true });
      },
      onError: () => {
        setUser(null);
        navigate("/login", { replace: true });
        toast.error("Logged out");
      },
    });
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const userUpdatedDate = formatDate(user?.updatedAt);
  const activeMembership = projects.find((p: any) => {
    const projId = p?.project?.id || p?.id;
    return projId === activeProject?.id;
  });
  const activeProjectName = activeMembership?.project?.name;
  const userRole = activeMembership?.role;
  return (
    <>
      <aside className="sidebar">
        <p className="sidebar-title">Projects</p>
        <nav className="project-list">
          {projects.map((item: any) => {
            const project = item?.project || item;
            const isOwner = item?.role === "OWNER";
            if (!project?.id) return null;
            return (
              <div key={project.id} className="project-item-row">
                <button
                  className={`project-item ${
                    project.id === activeProject?.id
                      ? "project-item-active"
                      : ""
                  }`}
                  onClick={() => setActiveProject(project)}
                >
                  <Folder size={16} aria-hidden="true" />
                  <span>{project.name}</span>
                </button>
                {isOwner && (
                  <button
                    type="button"
                    className="project-delete-inline-btn"
                    data-tooltip={`Delete ${project.name}`}
                    data-tooltip-pos="left"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectToDelete({
                        id: project.id,
                        name: project.name,
                      });
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            className="project-item project-item-new"
            onClick={() => setCreateProjectOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
            <span>New project</span>
          </button>

          <PendingInvitations />
        </nav>

        <div className="sidebar-bottom-section">
          {activeProject?.id && (
            <button
              className="sidebar-members-btn"
              onClick={() =>
                navigate(`/projects/${activeProject?.id}/memberships`, {
                  state: { activeProjectName },
                })
              }
            >
              <Users size={16} aria-hidden="true" />
              <span>Project Management</span>
            </button>
          )}

          {/* Clickable User Card */}
          <div
            className="sidebar-user"
            onClick={() => setUserProfileModalOpen(true)}
            role="button"
            tabIndex={0}
            data-tooltip={`View ${user?.name}'s  profile details`}
            data-tooltip-pos="right"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setUserProfileModalOpen(true);
              }
            }}
          >
            <div className="user-avatar">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="user-avatar-img"
                />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>
            <div className="user-info">
              <div className="user-info-row">
                <span className="icon-box">
                  <UserIcon size={13} aria-hidden="true" />
                </span>
                <span className="user-name-text">{user?.name}</span>
              </div>
              <div className="user-info-row">
                <span className="icon-box">
                  <Mail size={13} aria-hidden="true" />
                </span>
                <span className="user-email-text">{user?.email}</span>
              </div>
              {userRole && (
                <div className="user-info-row">
                  <span className="icon-box">
                    <Shield
                      size={14}
                      className="user-info-icon"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="user-role-text">
                    {userRole?.toUpperCase()}
                  </span>
                </div>
              )}

              {userUpdatedDate && (
                <div className="user-dates">
                  <span className="user-date-item">
                    <Clock size={11} aria-hidden="true" />
                    <span>Updated {userUpdatedDate}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Logout Action */}
          <div className="sidebar-user-actions">
            <button
              className="sidebar-action-button sidebar-action-button-danger"
              onClick={handleLogout}
            >
              <LogOut size={15} aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
