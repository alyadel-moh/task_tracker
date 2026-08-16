import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Task } from "../components/types";

const useGetTask = (projectId: string, taskId: string) => {
  return useQuery<Task, AxiosError>({
    queryKey: ["task", projectId, taskId],
    queryFn: async () => {
      const response = await axiosInstance.get<Task>(
        `tasks/${projectId}/${taskId}`,
      );
      return response.data;
    },
    enabled: !!localStorage.getItem("token"),
    retry: false,
  });
};
export default useGetTask;
