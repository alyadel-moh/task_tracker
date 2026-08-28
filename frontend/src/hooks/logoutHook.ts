import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

interface LogoutResponse {
  status: string;
  message: string;
}

const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<LogoutResponse, AxiosError>({
    mutationFn: () => {
      return axiosInstance
        .post<LogoutResponse>("auth/logout")
        .then((response) => response.data);
    },
    onMutate: () => {
      localStorage.removeItem("token");
      queryClient.clear();
    },
    onSuccess: (data: LogoutResponse) => {
      console.log("User logged out successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error logging out user:", error);
    },
  });
};

export default useLogout;
