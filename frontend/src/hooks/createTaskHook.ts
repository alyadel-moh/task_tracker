import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Task } from "../components/types";

interface CreateTaskData {
  name: string;
  description: string;
  statusId: string;
  priority: string;
  estimatedTime: number | null;
  dueDate: string | null;
  assignees: string[];
}

interface CreateTaskResponse {
  newTask: Task;
  status: string;
  message: string;
}

const useCreateTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CreateTaskResponse, AxiosError, CreateTaskData>({
    mutationFn: (newTaskData: CreateTaskData) => {
      return axiosInstance
        .post<CreateTaskResponse>(`tasks/${projectId}`, newTaskData)
        .then((response) => response.data);
    },
    onSuccess: (data: CreateTaskResponse) => {
      const createdTask = data.newTask;
      console.log("Task created successfully:", data);

      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", projectId] },
        (oldTasks) => {
          if (!oldTasks) return [createdTask];

          if (Array.isArray(oldTasks)) {
            return [...oldTasks, createdTask];
          }

          return oldTasks;
        },
      );
    },
    onError: (error: AxiosError) => {
      console.error("Error creating task:", error);
    },
  });
};

export default useCreateTask;
