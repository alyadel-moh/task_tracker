import { useEffect } from "react";
import { X, FolderPlus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import useCreateProject from "../hooks/createProjectHook";
import "../css/createProjectmodal.css";

const schema = z.object({
  name: z.string().min(1, { message: "Project name is required" }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateProjectModalProps {
  onClose: () => void;
  refetchprojects: () => void;
}

const CreateProjectModal = ({
  onClose,
  refetchprojects,
}: CreateProjectModalProps) => {
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    createProject.mutate(
      {
        name: data.name,
        description: data.description ?? "",
      },
      {
        onSuccess: () => {
          toast.success("Project created successfully!");
          reset();
          refetchprojects();
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

  // Trigger toast when form validation fails (e.g., clicking Submit with empty name)
  const onInvalid = () => {
    toast.error("Please fill in all required fields.");
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
          <div className="modal-header-icon">
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
        <p className="modal-subtitle">
          Give your project a name to start adding tasks.
        </p>

        <form
          className="modal-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          <label className="field">
            <span className="field-label">Name</span>
            <input
              type="text"
              placeholder="e.g. Website redesign"
              autoFocus
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
              placeholder="What is this project about?"
              rows={3}
              {...register("description")}
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button modal-button-secondary"
              onClick={onClose}
              disabled={createProject.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button modal-button-primary"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Creating...
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
