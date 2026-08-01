import { useState } from "react";
import { X, Folder, Trash2, AlertTriangle } from "lucide-react";
import "../css/ProjectDetailsModal.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import useDeleteProject from "../hooks/deleteProjectHook";
import useUpdateProject from "../hooks/updateProjectHook";

const schema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;
interface ProjectDetailsModalProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };
  onClose: () => void;
  taskCount: number;
  refetchProjects?: () => void;
}

const ProjectDetailsModal = ({
  project,
  onClose,
  taskCount,
  refetchProjects,
}: ProjectDetailsModalProps) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const updateProjectMutation = useUpdateProject(project.id);
  const deleteProjectmutation = useDeleteProject();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const onSubmit = (data: FormData) => {
    updateProjectMutation.mutate(
      {
        name: data.name,
        description: data.description ?? "",
      },
      {
        onSuccess: () => {
          onClose();
          refetchProjects?.();
        },
      },
    );
  };

  const errorMessage =
    (updateProjectMutation.error as any)?.response?.data?.message ??
    "Error occurred during project update.";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        {!isConfirmingDelete ? (
          <>
            <div className="modal-header">
              <div className="modal-header-icon">
                <Folder size={18} aria-hidden="true" />
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            <h2 id="project-details-title" className="modal-title">
              Project details
            </h2>
            <p className="modal-subtitle">
              {taskCount} tasks · Created {project.createdAt}
              {project.updatedAt !== project.createdAt && (
                <> · Updated {project.updatedAt}</>
              )}
            </p>

            <form className="modal-form" noValidate>
              <label className="field">
                <span className="field-label">Name</span>
                <input
                  type="text"
                  defaultValue={project.name}
                  {...register("name")}
                />
              </label>

              <label className="field">
                <span className="field-label">
                  Description{" "}
                  <span className="field-label-optional">(optional)</span>
                </span>
                <textarea
                  defaultValue={project.description ?? ""}
                  placeholder="What is this project about?"
                  rows={3}
                  {...register("description")}
                />
              </label>

              <div className="modal-actions modal-actions-split">
                <button
                  type="button"
                  className="modal-button modal-button-danger-ghost"
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete project
                </button>

                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="modal-button modal-button-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-button modal-button-primary"
                    onClick={handleSubmit(onSubmit)}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-header-icon modal-header-icon-danger">
                <AlertTriangle size={18} aria-hidden="true" />
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="modal-title">Delete "{project.name}"?</h2>
            <p className="modal-subtitle">
              This permanently deletes the project and all {taskCount} of its
              tasks, including their time entries and history. This can't be
              undone.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-button modal-button-secondary"
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-button modal-button-danger"
                onClick={() => {
                  deleteProjectmutation.mutate(project.id, {
                    onSuccess: () => {
                      onClose();
                      refetchProjects?.();
                    },
                  });
                }}
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete permanently
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
