import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { ProjectMember, Task, User } from "../components/types";

export interface UpdateuserData {
  name?: string;
  email?: string;
  photoUrl?: string | null;
}

export interface UpdateUserResponse {
  user: Partial<User>;
  message: string;
  status: string;
}

const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<User>(["user"]);
  return useMutation<UpdateUserResponse, AxiosError, UpdateuserData>({
    mutationFn: (userData: UpdateuserData) => {
      return axiosInstance
        .patch<UpdateUserResponse>(`auth/update`, userData)
        .then((response) => response.data);
    },

    onSuccess: (data) => {
      queryClient.setQueryData<User>(["user"], (oldUser) => {
        if (!oldUser) return oldUser;
        return {
          ...oldUser,
          ...data.user,
          updatedAt: new Date().toISOString(),
        };
      });
      queryClient.setQueriesData<ProjectMember[]>(
        { queryKey: ["project-members"] },
        (member) => {
          if (!member) return member;
          return member.map((membership) => {
            if (membership.user.id === currentUser?.id) {
              return {
                ...membership,
                user: {
                  ...membership.user,
                  ...data.user,
                  updatedAt: new Date().toISOString(),
                },
              };
            }
            return membership;
          });
        },
      );
      queryClient.setQueriesData<Task>({ queryKey: ["task"] }, (oldTask) => {
        if (!oldTask) return oldTask;

        const isCreator = oldTask.creator?.id === currentUser?.id;
        const isAssignee =
          Array.isArray(oldTask.assignees) &&
          oldTask.assignees.some((a) => a.id === currentUser?.id);
        if (!isCreator && !isAssignee) {
          return oldTask;
        }
        return {
          ...oldTask,
          creator: isCreator
            ? {
                ...oldTask.creator,
                ...data.user,
                updatedAt: new Date().toISOString(),
              }
            : oldTask.creator,
          assignees: isAssignee
            ? oldTask.assignees.map((assignee) =>
                assignee.id === currentUser?.id
                  ? {
                      ...assignee,
                      ...data.user,
                      updatedAt: new Date().toISOString(),
                    }
                  : assignee,
              )
            : oldTask.assignees,
        };
      });
      console.log("User updated successfully:");
    },
    onError: (error: AxiosError) => {
      console.error("Error updating user:", error);
    },
  });
};

export default useUpdateUser;
