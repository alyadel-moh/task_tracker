import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const useGetProjects = () => {
  return useQuery<Project[], AxiosError>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await axiosInstance.get<Project[]>("projects");
      return response.data;
    },
    enabled: !!localStorage.getItem("token"),
    retry: false,
  });
};
export default useGetProjects;
