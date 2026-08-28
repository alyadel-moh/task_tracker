import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Statuss } from "../components/types";

interface UpdateStatusData {
  status: Partial<Statuss>;
}

interface UpdateStatusResponse {
  newStatus: Partial<Statuss>;
  status: string;
  message: string;
}

const useUpdateStatus = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateStatusResponse, AxiosError, UpdateStatusData>({
    mutationFn: (statusData: UpdateStatusData) => {
      const { id, ...rest } = statusData.status;
      return axiosInstance
        .patch<UpdateStatusResponse>(
          `projects/statuses/${projectId}/${id}`,
          rest,
        )
        .then((response) => response.data);
    },
    onSuccess: (data, variables) => {
      const updatedStatus = data.newStatus;

      queryClient.setQueryData<Statuss[]>(
        ["statuses", projectId],
        (oldStatuses) => {
          if (!oldStatuses) return [];
          return oldStatuses.map((status) =>
            status.id === variables.status.id
              ? { ...status, ...updatedStatus }
              : status,
          );
        },
      );
    },
    onError: (error: AxiosError) => {
      console.error("Error updating status:", error);
    },
  });
};

export default useUpdateStatus;
