import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { type Priority, type Status } from "../components/types";
import { type Task } from "../components/types";

const useGetTasks = (projectId?: string | null) => {
  return useQuery<Task[], AxiosError>({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get<Task[]>(`tasks/${projectId}`);
      return response.data;
    },
    enabled: !!projectId && !!localStorage.getItem("token"),
    retry: false,
  });
};
export default useGetTasks;
