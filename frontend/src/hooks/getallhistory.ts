import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { HistoryEntry } from "../components/types";

const useGetTaskHistory = (taskId: string) => {
  return useQuery<HistoryEntry[], AxiosError>({
    queryKey: ["task_history", taskId],
    queryFn: async () => {
      const response = await axiosInstance.get<HistoryEntry[]>(
        `task_history/${taskId}`,
      );
      return response.data;
    },
    enabled: !!localStorage.getItem("token") && Boolean(taskId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
export default useGetTaskHistory;
