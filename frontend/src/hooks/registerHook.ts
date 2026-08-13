import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
interface RegisterUserData {
  name: string;
  email: string;
  photoUrl?: string | null;
  password: string;
}
interface RegisterUserResponse {
  status: string;
  message: string;
}
const useRegister = () => {
  return useMutation<
    RegisterUserResponse,
    AxiosError<RegisterUserResponse>,
    RegisterUserData
  >({
    mutationFn: (newUserData: RegisterUserData) => {
      return axiosInstance
        .post<RegisterUserResponse>("auth/register", newUserData)
        .then((response) => response.data);
    },
    onMutate: async (newUserData: RegisterUserData) => {
      console.log("Registering user:", newUserData);
    },
    onSuccess: (data: RegisterUserResponse) => {
      console.log("User registered successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error registering user:", error);
    },
  });
};
export default useRegister;
