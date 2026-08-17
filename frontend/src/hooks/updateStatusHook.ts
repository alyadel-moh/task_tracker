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

const useUpdateStatus = (projectId: string, columnId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateStatusData, AxiosError, UpdateStatusResponse>({
    mutationFn: (statusdata: UpdateStatusData) => {
      return axiosInstance
        .patch<UpdateStatusResponse>(
          `projects/statuses/update/${projectId}/${columnId}`,
          statusdata,
        )
        .then((response) => response.data);
    },
    onMutate: async (newStatusData: UpdateStatusData) => {
      console.log("Updating project:", newStatusData);
    },
    onSuccess: (data) => {
      const updatedFields = data.newStatus;
      console.log("Status updated successfully:", data);

      queryClient.setQueryData<Statuss[]>(
        ["status", projectId],
        (oldProjects) => {
          if (!oldProjects) return oldProjects;
          return oldProjects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  ...updatedFields,
                  updatedAt: new Date().toISOString(),
                }
              : project,
          );
        },
      );
    },
    onError: (error: AxiosError) => {
      console.error("Error updating project:", error);
    },
  });
};

export default useUpdateStatus;
