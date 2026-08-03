import { Folder, LogOut, Plus, Trash2 } from "lucide-react";
import { type Project } from "./types";

interface DashboardSidebarProps {
  projects: Project[];
  userName: string;
  userEmail: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  activeProjectId: string | null;
  refetchProjects?: () => void;
  onLogout: () => void;
  onDeleteProject: (bool: boolean) => void;
}

const DashboardSidebar = ({
  projects,
  userName,
  userEmail,
  onSelectProject,
  onCreateProject,
  activeProjectId,
  onDeleteProject,
  onLogout,
}: DashboardSidebarProps) => {
  return (
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

      <div className="sidebar-user">
        <div className="user-avatar">
          {userName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="user-info">
          <p className="user-name">{userName}</p>
          <p className="user-email">{userEmail}</p>
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
  );
};

export default DashboardSidebar;
