import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { axiosInstance } from "../api-client";

// =======================
// Types & DTOs
// =======================

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  resetToken: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ApiErrorResponse {
  message?: string;
}

// =======================
// API Client
// =======================

export const authApi = {
  forgotPassword: async (
    data: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResponse> => {
    const response = await axiosInstance.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      data,
    );
    return response.data;
  },

  resetPassword: async (
    data: ResetPasswordPayload,
  ): Promise<ResetPasswordResponse> => {
    const response = await axiosInstance.post<ResetPasswordResponse>(
      "/auth/reset-password",
      data,
    );
    return response.data;
  },
};

// =======================
// TanStack Query Hooks
// =======================

export const useForgotPassword = () => {
  return useMutation<
    ForgotPasswordResponse,
    AxiosError<ApiErrorResponse>,
    ForgotPasswordPayload
  >({
    mutationFn: authApi.forgotPassword,
  });
};

export const useResetPassword = () => {
  return useMutation<
    ResetPasswordResponse,
    AxiosError<ApiErrorResponse>,
    ResetPasswordPayload
  >({
    mutationFn: authApi.resetPassword,
  });
};
