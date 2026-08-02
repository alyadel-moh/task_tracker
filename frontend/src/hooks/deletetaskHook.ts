import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

interface DeleteTaskResponse {
  status: string;
  message: string;
}
const useDeleteTask = (projectId: string, taskId: string) => {
  return useMutation<DeleteTaskResponse, AxiosError<DeleteTaskResponse>, void>({
    mutationFn: () => {
      return axiosInstance
        .delete<DeleteTaskResponse>(`tasks/delete/${projectId}/${taskId}`)
        .then((response) => response.data);
    },
    onSuccess: (data: DeleteTaskResponse) => {
      console.log("Task deleted successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting task:", error);
    },
  });
};
export default useDeleteTask;
