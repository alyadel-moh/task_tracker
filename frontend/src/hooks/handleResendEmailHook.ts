import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../api-client";

interface ResendPayload {
  email: string;
}

interface ResendResponse {
  message: string;
}

const resendVerificationRequest = async (
  payload: ResendPayload,
): Promise<ResendResponse> => {
  const { data } = await axiosInstance.post<ResendResponse>(
    "auth/resend-verification",
    payload,
  );
  return data;
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: resendVerificationRequest,
  });
};
