import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { ProjectMember, Task } from "../components/types";

interface RemoveMemberResponse {
  status?: string;
  message: string;
}
interface RemoveMemberVariables {
  id: string;
  userId: string;
}
const useRemoveMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveMemberResponse,
    AxiosError<RemoveMemberResponse>,
    RemoveMemberVariables
  >({
    mutationFn: async (variables: RemoveMemberVariables) => {
      const response = await axiosInstance.delete<RemoveMemberResponse>(
        `projects/${projectId}/members/${variables.id}`,
      );
      return response.data;
    },
    onSuccess: (data: RemoveMemberResponse, variables) => {
      console.log("Member removed successfully:", data.message);

      queryClient.setQueriesData<Task>(
        { queryKey: ["task", projectId], exact: false },
        (oldTask) => {
          if (!oldTask || !oldTask.assignees) return oldTask;
          return {
            ...oldTask,
            assignees: oldTask.assignees.filter(
              (assignee: any) =>
                assignee.id !== variables.userId &&
                assignee.userId !== variables.userId,
            ),
          };
        },
      );
      queryClient.setQueryData<ProjectMember[]>(
        ["project-members-active", projectId],
        (oldMembers) => {
          if (!oldMembers) return [];
          return oldMembers.filter((member) => member.id !== variables.id);
        },
      );
      queryClient.setQueryData<ProjectMember[]>(
        ["project-members", projectId],
        (oldMembers) => {
          if (!oldMembers) return [];
          return oldMembers.filter((member) => member.id !== variables.id);
        },
      );
    },
    onError: (error: AxiosError<RemoveMemberResponse>) => {
      const serverMessage = error.response?.data?.message || error.message;
      console.error("Error removing member:", serverMessage);
    },
  });
};

export default useRemoveMember;
