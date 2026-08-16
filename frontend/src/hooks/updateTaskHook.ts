import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
interface updateTaskData {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  estimatedTime: number | null;
  dueDate: string | null;
}
interface UpdateTaskResponse {
  status: string;
  message: string;
}
const useUpdateTask = (projectId: string) => {
  return useMutation<UpdateTaskResponse, AxiosError, updateTaskData>({
    mutationFn: ({ id, ...taskData }: updateTaskData) => {
      return axiosInstance
        .put<UpdateTaskResponse>(`tasks/update/${projectId}/${id}`, taskData)
        .then((response) => response.data);
    },
    onMutate: async (newTaskData: updateTaskData) => {
      console.log("Updating task:", newTaskData);
    },
    onSuccess: (data: UpdateTaskResponse) => {
      console.log("Task updated successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error updating task:", error);
    },
  });
};
export default useUpdateTask;
