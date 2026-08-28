import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { AssignedProjectMembership } from "../components/types";
interface DeleteProjectResponse {
  status: string;
  message: string;
}

const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteProjectResponse, AxiosError, string>({
    mutationFn: (projectId: string) => {
      return axiosInstance
        .delete<DeleteProjectResponse>(`projects/delete/${projectId}`)
        .then((response) => response.data);
    },
    onSuccess: (data, deletedProjectId) => {
      queryClient.setQueryData<AssignedProjectMembership[]>(
        ["assigned-projects"],
        (oldMemberships) => {
          if (!oldMemberships) return [];
          return oldMemberships.filter(
            (membership) => membership.project.id !== deletedProjectId,
          );
        },
      );
      console.log("Project deleted successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting project:", error);
    },
  });
};

export default useDeleteProject;
