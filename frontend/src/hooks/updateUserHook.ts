import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

export interface UpdateuserData {
  name?: string;
  email?: string;
  photoUrl?: string | null;
}

export interface UpdateUserResponse {
  message: string;
  status: string;
}

const useUpdateTimeEntry = () => {
  return useMutation<UpdateUserResponse, AxiosError, UpdateuserData>({
    mutationFn: (userData: UpdateuserData) => {
      return axiosInstance
        .patch<UpdateUserResponse>(`auth/update`, userData)
        .then((response) => response.data);
    },
    onSuccess: () => {
      console.log("User updated successfully:");
    },
    onError: (error: AxiosError) => {
      console.error("Error updating user:", error);
    },
  });
};

export default useUpdateTimeEntry;
