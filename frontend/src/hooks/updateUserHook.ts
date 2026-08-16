import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { User } from "../components/types";

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

const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
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
      console.log("User updated successfully:");
    },
    onError: (error: AxiosError) => {
      console.error("Error updating user:", error);
    },
  });
};

export default useUpdateTimeEntry;
