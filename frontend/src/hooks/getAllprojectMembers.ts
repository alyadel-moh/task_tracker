import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { type ProjectMember } from "../components/types";

const useGetProjectMembers = (projectId: string) => {
  return useQuery<ProjectMember[], AxiosError>({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const response = await axiosInstance.get<ProjectMember[]>(
        `projects/${projectId}/members`,
      );
      return response.data;
    },
    enabled: !!localStorage.getItem("token") && !!projectId,
    retry: false,
  });
};
export default useGetProjectMembers;
