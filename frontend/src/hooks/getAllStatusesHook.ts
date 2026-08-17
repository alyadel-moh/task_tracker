import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";
import { type Statuss } from "../components/types";

const useGetStatuses = (id: string) => {
  return useQuery<Statuss[], AxiosError>({
    queryKey: ["statuses", id],
    queryFn: async () => {
      const response = await axiosInstance.get<Statuss[]>(
        `projects/statuses/${id}`,
      );
      return response.data;
    },
    enabled: !!localStorage.getItem("token") && !!id,
    retry: false,
  });
};
export default useGetStatuses;
