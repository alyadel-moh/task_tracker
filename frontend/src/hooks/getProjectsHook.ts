import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { AssignedProjectMembership } from "../components/types";
const useGetAssignedProjects = () => {
  return useQuery<
    AssignedProjectMembership[],
    AxiosError<{ message?: string }>
  >({
    queryKey: ["assigned-projects"],
    queryFn: async () => {
      const response = await axiosInstance.get<AssignedProjectMembership[]>(
        "projects/assigned", // Update route path to match your Express router
      );
      return response.data;
    },
    enabled: !!localStorage.getItem("token"),
  });
};

export default useGetAssignedProjects;
