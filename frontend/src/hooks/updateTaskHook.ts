import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../api-client";
import { Task } from "../components/types";

interface UpdateTaskPayload {
  id: string;
  [key: string]: any;
}

interface UpdateTaskResponse {
  task: Partial<Task>;
  status: string;
  message: string;
}

const useUpdateTask = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: UpdateTaskPayload) => {
      const { id, ...rest } = taskData;
      return axiosInstance
        .patch<UpdateTaskResponse>(`tasks/update/${projectId}/${id}`, rest)
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
              task.id === variables.id
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
        ["task", projectId, variables.id],
        (oldTask) => {
          if (!oldTask) return oldTask;
          return {
            ...oldTask,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
          };
        },
      );

      console.log("Task updated successfully:", data);
    },
  });
};

export default useUpdateTask;
