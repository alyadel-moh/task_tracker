import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { pendingProjectMembership } from "../components/types";
const useGetPendingInvitations = () => {
  return useQuery<pendingProjectMembership[], AxiosError<{ message?: string }>>(
    {
      queryKey: ["pending-invitations"],
      queryFn: async () => {
        const response =
          await axiosInstance.get<pendingProjectMembership[]>(
            "projects/pending",
          );
        return response.data;
      },
      enabled: !!localStorage.getItem("token"),
    },
  );
};

export default useGetPendingInvitations;
