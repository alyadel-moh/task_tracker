import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
interface createTaskData {
  name: string;
  description: string;
  status: string;
  priority: string;
  estimatedTime: number | null;
  dueDate: string | null;
}
interface CreateTaskResponse {
  status: string;
  message: string;
}
const useCreateTask = (projectId: string) => {
  return useMutation<CreateTaskResponse, AxiosError, createTaskData>({
    mutationFn: (newTaskData: createTaskData) => {
      return axiosInstance
        .post<CreateTaskResponse>(`tasks/create/${projectId}`, newTaskData)
        .then((response) => response.data);
    },
    onMutate: async (newTaskData: createTaskData) => {
      console.log("Creating task:", newTaskData);
    },
    onSuccess: (data: CreateTaskResponse) => {
      console.log("Task created successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error creating task:", error);
    },
  });
};
export default useCreateTask;
