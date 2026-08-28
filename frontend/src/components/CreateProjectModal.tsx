import { useEffect } from "react";
import { X, FolderPlus, Loader2, Folder, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import useCreateProject from "../hooks/createProjectHook";
import "../css/CreateProjectModal.css";

const schema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateProjectModalProps {
  onClose: () => void;
}

const CreateProjectModal = ({ onClose }: CreateProjectModalProps) => {
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    createProject.mutate(
      {
        name: data.name.trim(),
        description: data.description ?? "",
      },
      {
        onSuccess: (data: any) => {
          toast.success(data?.message || "Project created successfully!");
          onClose();
        },
        onError: (error: any) => {
          const apiError =
            error?.response?.data?.message ??
            "Failed to create project. Please try again.";
          toast.error(apiError);
        },
      },
    );
  };

  const onInvalid = () => {
    toast.error("Please enter a project name.");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon task-modal-header-icon">
            <FolderPlus size={18} aria-hidden="true" />
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

        <h2 id="create-project-title" className="modal-title">
          New project
        </h2>
        <p className="modal-subtitle modal-subtitle-compact">
          Give your project a name to start adding tasks.
        </p>

        <form
          className="modal-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          {/* Project Name Field */}
          <div className="field">
            <span className="field-label">Name</span>
            <div className="input-with-icon">
              <Folder size={15} className="input-icon" />
              <input
                type="text"
                placeholder="e.g. Website redesign"
                autoFocus
                className={errors.name ? "input-error" : ""}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <small className="field-error">{errors.name.message}</small>
            )}
          </div>

          {/* Description Field */}
          <div className="field">
            <span className="field-label">
              Description{" "}
              <span className="field-label-optional">(optional)</span>
            </span>
            <div className="input-with-icon textarea-wrapper">
              <FileText size={15} className="input-icon textarea-icon" />
              <textarea
                placeholder="What is this project about?"
                rows={3}
                {...register("description")}
              />
            </div>
          </div>

          {/* Full-width Action Button */}
          <div className="modal-actions-full">
            <button
              type="submit"
              className="modal-button modal-button-primary modal-button-full"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
