import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import {
  AssignedProjectMembership,
  pendingProjectMembership,
} from "../components/types";

interface AcceptingInvitationResponse {
  assignedprojectMembership: AssignedProjectMembership;
  status: string;
  message: string;
}
const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation<AcceptingInvitationResponse, AxiosError, string>({
    mutationFn: (projectId) => {
      return axiosInstance
        .patch<AcceptingInvitationResponse>(
          `projects/invitations/${projectId}/accept`,
        )
        .then((response) => response.data);
    },
    onMutate: async (projectId: string) => {
      console.log("Accepting invitation for project:", projectId);
    },
    onSuccess: (data: AcceptingInvitationResponse) => {
      queryClient.setQueryData<AssignedProjectMembership[]>(
        ["assigned-projects"],
        (oldMemberships) => {
          if (!oldMemberships) return [data.assignedprojectMembership];
          if (Array.isArray(oldMemberships)) {
            return [...oldMemberships, data.assignedprojectMembership];
          }
          return oldMemberships;
        },
      );
      queryClient.setQueryData<pendingProjectMembership[]>(
        ["pending-invitations"],
        (oldInvitations) => {
          if (!oldInvitations) return [];
          return oldInvitations.filter(
            (inv) =>
              inv.project.id !== data.assignedprojectMembership.project.id,
          );
        },
      );
      console.log("Project invitation accepted successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error accepting invitation for project:", error);
    },
  });
};
export default useAcceptInvitation;
