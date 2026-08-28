import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { ProjectMember } from "../components/types";

interface RemoveMemberResponse {
  status?: string;
  message: string;
}

const useRemovePendingMember = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveMemberResponse,
    AxiosError<RemoveMemberResponse>,
    string
  >({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete<RemoveMemberResponse>(
        `projects/${projectId}/invitations/${id}`,
      );
      return response.data;
    },
    onSuccess: (data: RemoveMemberResponse, variables) => {
      console.log("Member removed successfully:", data.message);

      queryClient.setQueryData<ProjectMember[]>(
        ["project-members", projectId],
        (oldMembers) => {
          if (!oldMembers) return [];
          return oldMembers.filter((member) => member.id !== variables);
        },
      );
    },
    onError: (error: AxiosError<RemoveMemberResponse>) => {
      const serverMessage = error.response?.data?.message || error.message;
      console.error("Error removing member:", serverMessage);
    },
  });
};

export default useRemovePendingMember;
