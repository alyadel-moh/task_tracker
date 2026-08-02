import { useState } from "react";
import { X, Folder, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import "../css/ProjectDetailsModal.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

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

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
  return formatted.replace(/ /g, "\u00A0");
};

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
          toast.success("Project updated successfully!");
          onClose();
          refetchProjects?.();
        },
        onError: (error: any) => {
          const apiError =
            error?.response?.data?.message ??
            "Failed to update project. Please try again.";
          toast.error(apiError);
        },
      },
    );
  };

  const onInvalid = () => {
    toast.error("Please enter a valid project name.");
  };

  const handleDelete = () => {
    deleteProjectmutation.mutate(project.id, {
      onSuccess: () => {
        toast.success("Project deleted successfully!");
        onClose();
        refetchProjects?.();
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ??
          "Failed to delete project. Please try again.";
        toast.error(apiError);
      },
    });
  };

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

            <div
              className="modal-title-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2
                id="project-details-title"
                className="modal-title"
                style={{ margin: 0 }}
              >
                Project details
              </h2>
              <span
                className="modal-badge"
                style={{
                  flexShrink: 0,
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: 13,
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                }}
              >
                {taskCount} {taskCount === 1 ? "task" : "tasks"}
              </span>
            </div>
            <div
              className="modal-subtitle"
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                margin: "4px 0 20px",
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>
                Created {formatTimestamp(project.createdAt)}
              </span>
              {project.updatedAt !== project.createdAt && (
                <span style={{ whiteSpace: "nowrap" }}>
                  Updated {formatTimestamp(project.updatedAt)}
                </span>
              )}
            </div>

            <form
              className="modal-form"
              noValidate
              onSubmit={handleSubmit(onSubmit, onInvalid)}
            >
              <label className="field">
                <span className="field-label">Name</span>
                <input
                  type="text"
                  defaultValue={project.name}
                  {...register("name")}
                />
                {errors.name && (
                  <small className="field-error">{errors.name.message}</small>
                )}
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
                  disabled={updateProjectMutation.isPending}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete project
                </button>

                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="modal-button modal-button-secondary"
                    onClick={onClose}
                    disabled={updateProjectMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-button modal-button-primary"
                    disabled={updateProjectMutation.isPending}
                  >
                    {updateProjectMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
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
                disabled={deleteProjectmutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-button modal-button-danger"
                onClick={handleDelete}
                disabled={deleteProjectmutation.isPending}
              >
                {deleteProjectmutation.isPending ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} aria-hidden="true" />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
