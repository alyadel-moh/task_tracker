import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

interface VerifyUpdatedEmailPayload {
  newEmail: string;
  otp: string;
  token: string;
}

interface VerifyUpdatedEmailResponse {
  message: string;
}

const verifyUpdatedEmailRequest = async (
  payload: VerifyUpdatedEmailPayload,
): Promise<VerifyUpdatedEmailResponse> => {
  const { data } = await axiosInstance.post<VerifyUpdatedEmailResponse>(
    "auth/verify-updated-email",
    payload,
  );
  return data;
};

export const useVerifyUpdatedEmailOtp = () => {
  const queryClient = useQueryClient();

  return useMutation<
    VerifyUpdatedEmailResponse,
    AxiosError<{ message: string }>,
    VerifyUpdatedEmailPayload
  >({
    mutationFn: verifyUpdatedEmailRequest,
    onSuccess: (_data, variables: VerifyUpdatedEmailPayload) => {
      queryClient.setQueryData(["user"], (oldUser: any) => {
        if (oldUser) {
          return { ...oldUser, email: variables.newEmail };
        }
        return oldUser;
      });
    },
  });
};
