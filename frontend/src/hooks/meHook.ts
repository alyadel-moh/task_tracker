import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

interface User {
  id: string;
  name: string;
  email: string;
}

const useGetUser = () => {
  return useQuery<User, AxiosError>({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await axiosInstance.get<User>("auth/me");
      return response.data;
    },
    enabled: !!localStorage.getItem("token"),
    retry: false,
  });
};
export default useGetUser;
