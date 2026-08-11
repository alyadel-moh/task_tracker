import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Task } from "../components/types";

interface DeleteTaskResponse {
  status: string;
  message: string;
}

const useDeleteTask = (projectId: string, taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation<DeleteTaskResponse, AxiosError<DeleteTaskResponse>, void>({
    mutationFn: () => {
      return axiosInstance
        .delete<DeleteTaskResponse>(`tasks/delete/${projectId}/${taskId}`)
        .then((response) => response.data);
    },
    onSuccess: (data: DeleteTaskResponse) => {
      console.log("Task deleted successfully:", data);

      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", projectId] },
        (oldTasks) => {
          if (!oldTasks) return oldTasks;

          if (Array.isArray(oldTasks)) {
            return oldTasks.filter((task) => task.id !== taskId);
          }

          return oldTasks;
        },
      );
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting task:", error);
    },
  });
};

export default useDeleteTask;
