import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Project } from "../components/types";
import { Task } from "../components/types";
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
      queryClient.setQueryData<Project[]>(["projects"], (oldProjects) => {
        if (!oldProjects) return [];
        return oldProjects.filter((project) => project.id !== deletedProjectId);
      });
      console.log("Project deleted successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting project:", error);
    },
  });
};

export default useDeleteProject;
