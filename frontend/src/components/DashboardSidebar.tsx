import { useState } from "react";
import {
  Folder,
  LogOut,
  Plus,
  Trash2,
  Clock,
  Mail,
  UserIcon,
} from "lucide-react";
import { User, type Project } from "./types";
import UserProfileModal from "./UserProfileModal";

interface DashboardSidebarProps {
  projects: Project[];
  user: User | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  activeProjectId: string | null;
  onLogout: () => void;
  onDeleteProject: (bool: boolean) => void;
  onModifyPhoto?: () => void;
  onDeletePhoto?: () => void;
}

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

const DashboardSidebar = ({
  projects,
  user,
  onSelectProject,
  onCreateProject,
  activeProjectId,
  onDeleteProject,
  onLogout,
}: DashboardSidebarProps) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const userUpdatedDate = formatDate(user?.updatedAt);

  return (
    <>
      <aside className="sidebar">
        <p className="sidebar-title">Projects</p>
        <nav className="project-list">
          {projects.map((project) => (
            <div key={project.id} className="project-item-row">
              <button
                className={`project-item ${
                  project.id === activeProjectId ? "project-item-active" : ""
                }`}
                onClick={() => onSelectProject(project.id)}
              >
                <Folder size={16} aria-hidden="true" />
                <span>{project.name}</span>
              </button>
              <button
                type="button"
                className="project-delete-inline-btn"
                title="Delete project"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProject(project.id);
                  onDeleteProject(true);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            className="project-item project-item-new"
            onClick={onCreateProject}
          >
            <Plus size={16} aria-hidden="true" />
            <span>New project</span>
          </button>
        </nav>

        {/* Clickable User Card trigger for Profile Modal */}
        <div
          className="sidebar-user"
          onClick={() => setIsProfileModalOpen(true)}
          role="button"
          tabIndex={0}
          title="View profile details"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsProfileModalOpen(true);
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
            <div className="user-name">
              <UserIcon
                size={14}
                className="user-info-icon"
                aria-hidden="true"
              />
              <span>{user?.name}</span>
            </div>
            <div className="user-email">
              <Mail size={14} className="user-info-icon" aria-hidden="true" />
              <span>{user?.email}</span>
            </div>

            {userUpdatedDate && (
              <div className="user-dates">
                {userUpdatedDate && (
                  <span className="user-date-item">
                    <Clock size={11} aria-hidden="true" />
                    <span>Updated {userUpdatedDate}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-user-actions">
          <button
            className="sidebar-action-button sidebar-action-button-danger"
            onClick={onLogout}
          >
            <LogOut size={15} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      {/* Render Profile Modal when state is true */}
      {isProfileModalOpen && user && (
        <UserProfileModal
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};

export default DashboardSidebar;
