import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { ProjectMember } from "../components/types";

interface AddMemberData {
  email: string;
  role: "OWNER" | "MEMBER";
}

interface AddMemberResponse {
  projectMember: ProjectMember;
  status: string;
  message: string;
}
interface ErrorResponse {
  message?: string;
  error?: string;
}

const useAddMember = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation<
    AddMemberResponse,
    AxiosError<ErrorResponse>,
    AddMemberData
  >({
    mutationFn: async (addMemberData: AddMemberData) => {
      const response = await axiosInstance.post<AddMemberResponse>(
        `projects/${projectId}/members`,
        addMemberData,
      );
      return response.data;
    },
    onMutate: async (addMemberData: AddMemberData) => {
      console.log("Adding member:", addMemberData);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["project-members", projectId],
        (oldData: ProjectMember[] | undefined) => {
          if (!oldData) return [data.projectMember];
          return [...oldData, data.projectMember];
        },
      );
      queryClient.setQueryData(
        ["project-members-active", projectId],
        (oldData: ProjectMember[] | undefined) => {
          if (!oldData) return [data.projectMember];
          return [...oldData, data.projectMember];
        },
      );
      console.log("Member added successfully:", data.message);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const serverMessage = error.response?.data?.message || error.message;
      console.error("Error adding member:", serverMessage);
    },
  });
};

export default useAddMember;
