import { useEffect } from "react";
import {
  X,
  Columns,
  Loader2,
  Type,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import useCreateStatus from "../hooks/createStatusHook";
import { columns as staticColumns, type Status } from "./types";
import "../css/CreateProjectModal.css";

const schema = z.object({
  name: z.string().min(1, { message: "Column name is required" }),
  mappedStatus: z.enum(["TODO", "IN_PROGRESS", "DONE", "NONE"]),
});

type FormData = z.infer<typeof schema>;

interface CreateStatusModalProps {
  projectId: string | null;
  onClose: () => void;
}

const CreateStatusModal = ({ projectId, onClose }: CreateStatusModalProps) => {
  const createStatusMutation = useCreateStatus(projectId ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      mappedStatus: "NONE",
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      name: data.name.trim(),
      mappedStatus:
        data.mappedStatus === "NONE" ? null : (data.mappedStatus as Status),
    };

    createStatusMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Column added successfully!");
        onClose();
      },
      onError: (error: any) => {
        const apiError =
          error?.response?.data?.message ??
          "Failed to create column. Please try again.";
        toast.error(apiError);
      },
    });
  };

  const onInvalid = () => {
    toast.error("Please enter a column name.");
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
        className="modal-card status-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-status-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon status-icon-accent">
            <Columns size={18} aria-hidden="true" />
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

        <h2 id="create-status-title" className="modal-title">
          Add column
        </h2>
        <p className="modal-subtitle modal-subtitle-compact">
          Add a new stage to your board.
        </p>

        <form
          className="modal-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          <div className="field">
            <span className="field-label">Column Name</span>
            <div className="input-with-icon">
              <Type size={15} className="input-icon" />
              <input
                type="text"
                placeholder="e.g. In Review, QA"
                autoFocus
                className={errors.name ? "input-error" : ""}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <small className="field-error">{errors.name.message}</small>
            )}
          </div>

          <div className="field">
            <span className="field-label">
              Lifecycle Mapping{" "}
              <span className="field-label-optional">(optional)</span>
            </span>
            <div className="input-with-icon select-wrapper">
              <GitBranch size={15} className="input-icon" />
              <select {...register("mappedStatus")}>
                <option value="NONE">None (Custom Stage)</option>
                {staticColumns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="select-chevron" />
            </div>
          </div>

          <div className="modal-actions-full">
            <button
              type="submit"
              className="modal-button modal-button-primary modal-button-full"
              disabled={createStatusMutation.isPending}
            >
              {createStatusMutation.isPending ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create column"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStatusModal;
