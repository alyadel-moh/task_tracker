import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Project } from "../components/types";

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
      const updatedFields = data.project;
      console.log("Project updated successfully:", data);

      queryClient.setQueryData<Project[]>(["projects"], (oldProjects) => {
        if (!oldProjects) return oldProjects;
        return oldProjects.map((project) =>
          project.id === id
            ? {
                ...project,
                ...updatedFields,
                updatedAt: new Date().toISOString(),
              }
            : project,
        );
      });
    },
    onError: (error: AxiosError) => {
      console.error("Error updating project:", error);
    },
  });
};

export default useUpdateProject;
