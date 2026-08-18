import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Statuss } from "../components/types";

interface DeleteStatusResponse {
  status: string;
  message: string;
}

const useDeleteStatus = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<DeleteStatusResponse, AxiosError, string>({
    mutationFn: (statusId: string) => {
      return axiosInstance
        .delete<DeleteStatusResponse>(
          `/projects/statuses/${projectId}/${statusId}`,
        )
        .then((response) => response.data);
    },
    onSuccess: (data, deletedStatusId) => {
      queryClient.setQueryData<Statuss[]>(
        ["statuses", projectId],
        (oldStatuses) => {
          if (!oldStatuses) return [];
          return oldStatuses.filter((status) => status.id !== deletedStatusId);
        },
      );
      console.log("Status deleted successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting status:", error);
    },
  });
};

export default useDeleteStatus;
