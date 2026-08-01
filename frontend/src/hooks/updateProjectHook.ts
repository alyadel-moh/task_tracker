import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
interface UpdateProjectData {
  name: string;
  description: string;
}
interface UpdateProjectResponse {
  status: string;
  message: string;
}
const useUpdateProject = (id: string) => {
  return useMutation<UpdateProjectResponse, AxiosError, UpdateProjectData>({
    mutationFn: (projectData: UpdateProjectData) => {
      return axiosInstance
        .put<UpdateProjectResponse>(`projects/update/${id}`, projectData)
        .then((response) => response.data);
    },
    onMutate: async (newProjectData: UpdateProjectData) => {
      console.log("Updating project:", newProjectData);
    },
    onSuccess: (data: UpdateProjectResponse) => {
      console.log("Project updated successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error updating project:", error);
    },
  });
};
export default useUpdateProject;
