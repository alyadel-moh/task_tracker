import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { AssignedProjectMembership } from "../components/types";
interface CreateProjectData {
  name: string;
  description: string;
}
interface CreateProjectResponse {
  assignedProjectMembership: AssignedProjectMembership;
  status: string;
  message: string;
}
const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateProjectResponse, AxiosError, CreateProjectData>({
    mutationFn: (newProjectData: CreateProjectData) => {
      return axiosInstance
        .post<CreateProjectResponse>("projects", newProjectData)
        .then((response) => response.data);
    },
    onMutate: async (newProjectData: CreateProjectData) => {
      console.log("Creating project:", newProjectData);
    },
    onSuccess: (data: CreateProjectResponse) => {
      queryClient.setQueryData<AssignedProjectMembership[]>(
        ["assigned-projects"],
        (oldMemberships) => {
          if (!oldMemberships) return [data.assignedProjectMembership];
          if (Array.isArray(oldMemberships)) {
            return [...oldMemberships, data.assignedProjectMembership];
          }
          return oldMemberships;
        },
      );
      console.log("Project created successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error creating project:", error);
    },
  });
};
export default useCreateProject;
