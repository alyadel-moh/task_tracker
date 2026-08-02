import { Folder, LogOut, Plus, Pencil } from "lucide-react";
import { type Project } from "./types";

interface DashboardSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  userName: string;
  userEmail: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onEditProject: (projectId: string) => void;
  onLogout: () => void;
}

const DashboardSidebar = ({
  projects,
  activeProjectId,
  userName,
  userEmail,
  onSelectProject,
  onCreateProject,
  onEditProject,
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
              className="project-item-edit"
              aria-label={`Edit ${project.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onEditProject(project.id);
              }}
            >
              <Pencil size={13} aria-hidden="true" />
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
