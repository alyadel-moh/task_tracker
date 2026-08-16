import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
interface LoginUserData {
  email: string;
  password: string;
}

interface LoginResponse {
  status: string;
  message: string;
  token: string;
}
const useLogin = () => {
  return useMutation<LoginResponse, AxiosError<LoginResponse>, LoginUserData>({
    mutationFn: (loginData: LoginUserData) => {
      return axiosInstance
        .post<LoginResponse>("auth/login", loginData)
        .then((response) => response.data);
    },
    onMutate: async (loginData: LoginUserData) => {
      console.log("Logging in user:", loginData);
    },
    onSuccess: (data: LoginResponse) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      console.log("User logged in successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error logging in user:", error);
    },
  });
};
export default useLogin;
