import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Project } from "../components/types";
interface CreateProjectData {
  name: string;
  description: string;
}
interface CreateProjectResponse {
  project: Project;
  status: string;
  message: string;
}
const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateProjectResponse, AxiosError, CreateProjectData>({
    mutationFn: (newProjectData: CreateProjectData) => {
      return axiosInstance
        .post<CreateProjectResponse>("projects/create", newProjectData)
        .then((response) => response.data);
    },
    onMutate: async (newProjectData: CreateProjectData) => {
      console.log("Creating project:", newProjectData);
    },
    onSuccess: (data: CreateProjectResponse) => {
      const createdProject = data.project;
      queryClient.setQueryData<Project[]>(["projects"], (oldProjects) => {
        if (!oldProjects) return [createdProject];
        if (Array.isArray(oldProjects)) {
          return [...oldProjects, createdProject];
        }
        return oldProjects;
      });
      console.log("Project created successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error creating project:", error);
    },
  });
};
export default useCreateProject;
