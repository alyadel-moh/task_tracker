import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

interface DeleteProjectResponse {
  status: string;
  message: string;
}
const useDeleteProject = () => {
  return useMutation<DeleteProjectResponse, AxiosError, string>({
    mutationFn: (id: string) => {
      return axiosInstance
        .delete<DeleteProjectResponse>(`projects/delete/${id}`)
        .then((response) => response.data);
    },
    onSuccess: (data: DeleteProjectResponse) => {
      console.log("Project deleted successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting project:", error);
    },
  });
};
export default useDeleteProject;
