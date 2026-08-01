import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
interface CreateProjectData {
  name: string;
  description: string;
}
interface CreateProjectResponse {
  status: string;
  message: string;
}
const useCreateProject = () => {
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
      console.log("Project created successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error creating project:", error);
    },
  });
};
export default useCreateProject;
