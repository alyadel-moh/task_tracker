import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { TimeEntry } from "../components/types";

interface DeleteTimeEntryResponse {
  status: string;
  message: string;
}

interface GetTimeEntriesCacheShape {
  timeEntries: TimeEntry[];
  totalMinutes: number;
}

const useDeleteTimeEntry = (taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteTimeEntryResponse,
    AxiosError<DeleteTimeEntryResponse>,
    string
  >({
    mutationFn: (entryId: string) => {
      return axiosInstance
        .delete<DeleteTimeEntryResponse>(
          `time-entries/delete/${taskId}/${entryId}`,
        )
        .then((response) => response.data);
    },
    onSuccess: (data, entryId) => {
      console.log("Time entry deleted successfully:", data);

      queryClient.setQueriesData<GetTimeEntriesCacheShape>(
        { queryKey: ["time-entries", taskId] },
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.timeEntries)) {
            return oldData;
          }

          const deletedEntry = oldData.timeEntries.find(
            (e) => e.id === entryId,
          );
          const updatedEntries = oldData.timeEntries.filter(
            (entry) => entry.id !== entryId,
          );

          return {
            ...oldData,
            timeEntries: updatedEntries,
            totalMinutes: deletedEntry?.durationMinutes
              ? Math.max(0, oldData.totalMinutes - deletedEntry.durationMinutes)
              : oldData.totalMinutes,
          };
        },
      );
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting time entry:", error);
    },
  });
};

export default useDeleteTimeEntry;
