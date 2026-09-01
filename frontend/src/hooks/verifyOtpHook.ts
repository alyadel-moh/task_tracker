import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../api-client";

interface VerifyOtpPayload {
  email: string;
  otp: string;
  token: string;
}

interface VerifyOtpResponse {
  message: string;
}

const verifyOtpRequest = async (
  payload: VerifyOtpPayload,
): Promise<VerifyOtpResponse> => {
  const { data } = await axiosInstance.post<VerifyOtpResponse>(
    "auth/verify-otp",
    payload,
  );
  return data;
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: verifyOtpRequest,
  });
};
