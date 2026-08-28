import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { AssignedProjectMembership, ProjectMember } from "../components/types";

interface leaveProjectResponse {
  status?: string;
  message: string;
}

const useLeaveProject = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    leaveProjectResponse,
    AxiosError<leaveProjectResponse>,
    string
  >({
    mutationFn: async () => {
      const response = await axiosInstance.delete<leaveProjectResponse>(
        `projects/${projectId}/leave`,
      );
      return response.data;
    },
    onSuccess: (data: leaveProjectResponse) => {
      console.log("Member removed successfully:", data.message);

      queryClient.setQueryData<ProjectMember[]>(
        ["project-members", projectId],
        (oldMembers) => {
          if (!oldMembers) return [];
          return oldMembers.filter((member) => member.projectId !== projectId);
        },
      );

      queryClient.setQueryData<AssignedProjectMembership[]>(
        ["assigned-projects"],
        (oldProjects) => {
          if (!oldProjects) return [];
          return oldProjects.filter(
            (project) => project.project.id !== projectId,
          );
        },
      );
    },
    onError: (error: AxiosError<leaveProjectResponse>) => {
      const serverMessage = error.response?.data?.message || error.message;
      console.error("Error leaving project:", serverMessage);
    },
  });
};

export default useLeaveProject;
