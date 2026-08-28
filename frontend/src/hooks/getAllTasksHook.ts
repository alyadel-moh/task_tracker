import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { type Task } from "../components/types";

export interface GetTasksRequestParams {
  projectId?: string | null;
  search?: string | null;
  statusId?: string[] | string | null;
  priority?: string[] | string | null;
  assigneeId?: string | null;
  overdue?: boolean | null;
}

const useGetTasks = (params?: GetTasksRequestParams) => {
  const { projectId, search, statusId, priority, assigneeId, overdue } =
    params ?? {};

  return useQuery<Task[], AxiosError>({
    queryKey: [
      "tasks",
      projectId,
      search ?? "",
      statusId ?? [],
      priority ?? [],
      assigneeId,
      overdue ?? false,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<Task[]>(`tasks/${projectId}`, {
        params: {
          search,
          statusId,
          priority,
          overdue,
          assigneeId,
        },
        paramsSerializer: (paramsToSerialize) => {
          const searchParams = new URLSearchParams();

          for (const key in paramsToSerialize) {
            const value = paramsToSerialize[key];

            if (value !== undefined && value !== null && value !== "") {
              if (Array.isArray(value)) {
                value.forEach((item) => {
                  if (item) searchParams.append(key, item);
                });
              } else {
                searchParams.append(key, String(value));
              }
            }
          }
          return searchParams.toString();
        },
      });
      return response.data;
    },
    enabled: !!projectId && !!localStorage.getItem("token"),
    retry: false,
  });
};

export default useGetTasks;
