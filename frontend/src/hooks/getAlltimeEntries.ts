import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { type TimeEntry } from "../components/types";

const useGetTimeEntries = (taskId?: string | null) => {
  return useQuery<
    { timeEntries: TimeEntry[]; totalMinutes: number },
    AxiosError
  >({
    queryKey: ["time-entries", taskId],
    queryFn: async () => {
      const response = await axiosInstance.get<{
        timeEntries: TimeEntry[];
        totalMinutes: number;
      }>(`time-entries/${taskId}`);
      return response.data;
    },
    enabled: !!taskId && !!localStorage.getItem("token"),
    retry: false,
  });
};
export default useGetTimeEntries;
