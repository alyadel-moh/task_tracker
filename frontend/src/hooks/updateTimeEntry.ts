import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { HistoryEntry, TimeEntry } from "../components/types";

export interface UpdateTimeEntryData {
  id: string;
  note?: string;
  estimatedMinutes?: number | null;
  entryDate?: string | null;
}

export interface UpdateTimeEntryResponse {
  timeEntry: Partial<TimeEntry>;
  status: string;
  message: string;
  historyEntries?: HistoryEntry[];
}
interface TimeEntriesCacheData {
  timeEntries: TimeEntry[];
  totalMinutes: number;
}

const useUpdateTimeEntry = (taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTimeEntryResponse, AxiosError, UpdateTimeEntryData>({
    mutationFn: (entryData: UpdateTimeEntryData) => {
      return axiosInstance
        .patch<UpdateTimeEntryResponse>(
          `time-entries/update/${taskId}/${entryData.id}`,
          entryData,
        )
        .then((response) => response.data);
    },
    onSuccess: (data, variables) => {
      const { id: _id, ...entryData } = variables;
      const updatedFields = data.timeEntry ?? entryData;

      queryClient.setQueryData<TimeEntriesCacheData>(
        ["time-entries", taskId],
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.timeEntries)) return oldData;

          const updatedEntries = oldData.timeEntries.map((entry) =>
            entry.id === variables.id
              ? {
                  ...entry,
                  ...updatedFields,
                  updatedAt: new Date().toISOString(),
                }
              : entry,
          );

          const newTotalMinutes = updatedEntries.reduce(
            (acc, entry) => acc + (Number(entry.durationMinutes) || 0),
            0,
          );

          return {
            ...oldData,
            timeEntries: updatedEntries,
            totalMinutes: newTotalMinutes,
          };
        },
      );
      queryClient.setQueriesData<HistoryEntry[]>(
        { queryKey: ["task_history", taskId] },
        (oldHistory) => {
          if (!oldHistory) return oldHistory;
          if (data.historyEntries && data.historyEntries.length > 0) {
            return [...data.historyEntries, ...oldHistory];
          }
          return oldHistory;
        },
      );
      console.log("Time entry updated successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error updating time entry:", error);
    },
  });
};

export default useUpdateTimeEntry;
