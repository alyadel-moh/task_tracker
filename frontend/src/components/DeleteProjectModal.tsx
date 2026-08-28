import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAppStore } from "../store/useAppStore";
import useDeleteProject from "../hooks/deleteProjectHook";

const DeleteProjectModal = () => {
  const {
    projectToDelete,
    setProjectToDelete,
    activeProject,
    setActiveProject,
  } = useAppStore();
  const deleteProjectMutation = useDeleteProject();

  if (!projectToDelete) return null;

  const handleDelete = () => {
    deleteProjectMutation.mutate(projectToDelete.id, {
      onSuccess: (data) => {
        toast.success(data.message);
        if (activeProject?.id === projectToDelete.id) {
          setActiveProject(null);
        }
        setProjectToDelete(null);
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ?? "Failed to delete project.";
        toast.error(apiError);
      },
    });
  };

  return (
    <div className="modal-overlay" onClick={() => setProjectToDelete(null)}>
      <div
        className="modal-card"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon modal-header-icon-danger">
            <AlertTriangle size={18} aria-hidden="true" />
          </div>
        </div>

        <h2 className="modal-title">Delete "{projectToDelete.name}"?</h2>
        <p className="modal-subtitle">
          This permanently deletes the project and all associated tasks.
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-button modal-button-secondary"
            onClick={() => setProjectToDelete(null)}
            disabled={deleteProjectMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal-button modal-button-danger"
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
          >
            {deleteProjectMutation.isPending ? (
              <>
                <Loader2 size={14} className="spin" />
                Deleting...
              </>
            ) : (
              "Delete permanently"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
