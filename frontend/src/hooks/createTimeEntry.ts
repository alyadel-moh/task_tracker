import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { HistoryEntry, TimeEntry } from "../components/types";

interface CreateTimeEntryData {
  note?: string;
  durationMinutes?: number | null;
  entryDate?: string | null;
  taskId: string;
}

interface CreateTimeEntryResponse {
  timeEntry: TimeEntry;
  status: string;
  message: string;
  historyEntry?: HistoryEntry;
}

const useCreateTimeEntry = (taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CreateTimeEntryResponse, AxiosError, CreateTimeEntryData>({
    mutationFn: (newTimeEntryData: CreateTimeEntryData) => {
      return axiosInstance
        .post<CreateTimeEntryResponse>(
          `time-entries/create/${taskId}`,
          newTimeEntryData,
        )
        .then((response) => response.data);
    },
    onMutate: async (newTimeEntryData: CreateTimeEntryData) => {
      console.log("Creating time entry:", newTimeEntryData);
    },
    onSuccess: (data: CreateTimeEntryResponse) => {
      console.log("Time entry created successfully:", data);

      queryClient.setQueriesData<TimeEntry[]>(
        { queryKey: ["time-entries", taskId] },
        (oldTimeEntries) => {
          if (!oldTimeEntries)
            return {
              timeEntries: [data.timeEntry],
              totalMinutes: data.timeEntry.durationMinutes || 0,
            };

          if (Array.isArray((oldTimeEntries as any).timeEntries)) {
            return {
              ...(oldTimeEntries as any),
              timeEntries: [
                ...(oldTimeEntries as any).timeEntries,
                data.timeEntry,
              ],
              totalMinutes:
                (oldTimeEntries as any).totalMinutes +
                (data.timeEntry.durationMinutes || 0),
            };
          }

          return oldTimeEntries;
        },
      );
      queryClient.setQueryData<HistoryEntry[]>(
        ["task_history", taskId],
        (oldHistory) => {
          if (!oldHistory) return oldHistory;
          if (data.historyEntry) {
            return [data.historyEntry, ...oldHistory];
          }
          return oldHistory;
        },
      );
    },
    onError: (error: AxiosError) => {
      console.error("Error creating time entry:", error);
    },
  });
};

export default useCreateTimeEntry;
