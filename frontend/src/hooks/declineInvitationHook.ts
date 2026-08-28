import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { pendingProjectMembership } from "../components/types";
interface RemoveInvitationResponse {
  status?: string;
  message: string;
}

const useDeclineInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveInvitationResponse,
    AxiosError<RemoveInvitationResponse>,
    string
  >({
    mutationFn: async (projectId: string) => {
      const response = await axiosInstance.delete<RemoveInvitationResponse>(
        `/projects/invitations/${projectId}/decline`,
      );
      return response.data;
    },
    onSuccess: (data: RemoveInvitationResponse, variables: string) => {
      console.log("Invitation declined successfully:", data.message);

      queryClient.setQueryData<pendingProjectMembership[]>(
        ["pending-invitations"],
        (oldInvitations) => {
          if (!oldInvitations) return [];
          return oldInvitations.filter((inv) => inv.project.id !== variables);
        },
      );
    },
    onError: (error: AxiosError<RemoveInvitationResponse>) => {
      const serverMessage = error.response?.data?.message || error.message;
      console.error("Error declining invitation:", serverMessage);
    },
  });
};

export default useDeclineInvitation;
