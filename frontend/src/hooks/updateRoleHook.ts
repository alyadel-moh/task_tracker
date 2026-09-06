import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { ProjectMember, Role } from "../components/types";

interface UpdateRoleResponse {
  message: string;
  member: ProjectMember;
}

interface UpdateRoleParams {
  id: string;
  role: Role;
}

const useUpdateRole = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateRoleResponse,
    AxiosError<{ message?: string }>,
    UpdateRoleParams
  >({
    mutationFn: async ({ id, role }) => {
      const response = await axiosInstance.patch<UpdateRoleResponse>(
        `projects/${projectId}/members/${id}`,
        { role },
      );
      return response.data;
    },
    onSuccess: (data, { id, role }) => {
      console.log("Role updated successfully:", data.message);

      queryClient.setQueryData<ProjectMember[]>(
        ["project-members", projectId],
        (oldMembers) => {
          if (!oldMembers) return [];
          return oldMembers.map((m) => (m.id === id ? { ...m, role } : m));
        },
      );

      queryClient.invalidateQueries({
        queryKey: ["project-members", projectId],
      });
    },
    onError: (error) => {
      console.error(
        "Error updating role:",
        error.response?.data?.message || error.message,
      );
    },
  });
};

export default useUpdateRole;
