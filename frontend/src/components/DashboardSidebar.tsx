import { useState } from "react";
import { Folder, LogOut, Plus, Trash2 } from "lucide-react";
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
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

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
            <p className="user-name">{user?.name}</p>
            <p className="user-email">{user?.email}</p>
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
