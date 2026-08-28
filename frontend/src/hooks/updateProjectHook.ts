import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { AssignedProjectMembership, Project } from "../components/types";

interface UpdateProjectData {
  name?: string;
  description?: string;
}

interface UpdateProjectResponse {
  project: Partial<Project>;
  status: string;
  message: string;
}

const useUpdateProject = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProjectResponse, AxiosError, UpdateProjectData>({
    mutationFn: (projectData: UpdateProjectData) => {
      return axiosInstance
        .patch<UpdateProjectResponse>(`projects/update/${id}`, projectData)
        .then((response) => response.data);
    },
    onMutate: async (newProjectData: UpdateProjectData) => {
      console.log("Updating project:", newProjectData);
    },
    onSuccess: (data) => {
      console.log("Project updated successfully:", data);
      queryClient.setQueryData<AssignedProjectMembership[]>(
        ["assigned-projects"],
        (old) => {
          if (!old) return old;
          return old.map((membership) =>
            membership.project.id === id
              ? {
                  ...membership,
                  project: {
                    ...membership.project,
                    ...data.project,
                  },
                }
              : membership,
          );
        },
      );
    },
    onError: (error: AxiosError) => {
      console.error("Error updating project:", error);
    },
  });
};

export default useUpdateProject;
