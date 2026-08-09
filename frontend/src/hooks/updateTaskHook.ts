import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../api-client";
import { HistoryEntry, Task } from "../components/types";

interface UpdateTaskPayload {
  task: Partial<Task>;
}

interface UpdateTaskResponse {
  task: Partial<Task>;
  status: string;
  message: string;
  historyEntries?: HistoryEntry[];
}

const useUpdateTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: UpdateTaskPayload) => {
      return axiosInstance
        .patch<UpdateTaskResponse>(
          `tasks/update/${projectId}/${taskData.task.id}`,
          taskData.task,
        )
        .then((response) => response.data);
    },
    onSuccess: (data, variables) => {
      const updatedFields = data.task;

      queryClient.setQueriesData<Task[]>(
        { queryKey: ["tasks", projectId] },
        (oldTasks) => {
          if (!oldTasks) return oldTasks;

          if (Array.isArray(oldTasks)) {
            return oldTasks.map((task) =>
              task.id === variables.task.id
                ? {
                    ...task,
                    ...updatedFields,
                    updatedAt:
                      updatedFields.updatedAt ?? new Date().toISOString(),
                  }
                : task,
            );
          }

          return oldTasks;
        },
      );

      queryClient.setQueryData<Task>(
        ["task", projectId, variables.task.id],
        (oldTask) => {
          if (!oldTask) return oldTask;
          return {
            ...oldTask,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
          };
        },
      );

      queryClient.setQueryData<HistoryEntry[]>(
        ["task_history", variables.task.id],
        (oldHistory) => {
          if (!oldHistory) return oldHistory;
          if (data.historyEntries && data.historyEntries.length > 0) {
            return [...data.historyEntries, ...oldHistory];
          }
          return oldHistory;
        },
      );

      console.log("Task updated successfully:", data);
    },
  });
};

export default useUpdateTask;
