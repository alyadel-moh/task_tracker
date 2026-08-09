import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { TimeEntry } from "../components/types";

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
}
interface TimeEntriesCacheData {
  timeEntries: TimeEntry[];
  totalMinutes: number;
}

const useUpdateTimeEntry = (taskId: string, projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTimeEntryResponse, AxiosError, UpdateTimeEntryData>({
    mutationFn: ({ id, ...entryData }: UpdateTimeEntryData) => {
      return axiosInstance
        .patch<UpdateTimeEntryResponse>(
          `time-entries/update/${taskId}/${id}`,
          entryData,
        )
        .then((response) => response.data);
    },
    onSuccess: (data, variables) => {
      const { id, ...entryData } = variables;
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
      console.log("Time entry updated successfully:", data);
    },
    onError: (error: AxiosError) => {
      console.error("Error updating time entry:", error);
    },
  });
};

export default useUpdateTimeEntry;
