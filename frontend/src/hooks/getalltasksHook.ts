import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { type Priority, type Status } from "../components/types";

interface Task {
  id: string;
  projectId: string;
  name: string;
  priority: Priority;
  dueDate?: string;
  estimate?: string;
  status: Status;
}

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
