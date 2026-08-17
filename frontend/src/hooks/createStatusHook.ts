import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { Statuss, Status } from "../components/types";
interface CreateStatusData {
  name: string;
  mappedStatus: Status | null;
}
interface CreateStatusResponse {
  newStatus: Statuss;
  status: string;
  message: string;
}
const useCreateStatus = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation<CreateStatusResponse, AxiosError, CreateStatusData>({
    mutationFn: (newStatusData: CreateStatusData) => {
      return axiosInstance
        .post<CreateStatusResponse>(
          `/projects/statuses/${projectId}`,
          newStatusData,
        )
        .then((response) => response.data);
    },
    onMutate: async (newStatusData: CreateStatusData) => {
      console.log("Creating status:", newStatusData);
    },
    onSuccess: (data: CreateStatusResponse) => {
      const createdStatus = data.newStatus;
      queryClient.setQueryData<Statuss[]>(
        ["statuses", projectId],
        (oldStatuses) => {
          if (!oldStatuses) return [createdStatus];
          if (Array.isArray(oldStatuses)) {
            return [...oldStatuses, createdStatus];
          }
          return oldStatuses;
        },
      );
      console.log("Status created successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error creating status:", error);
    },
  });
};
export default useCreateStatus;
