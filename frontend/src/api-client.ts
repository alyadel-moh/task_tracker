import axios, { InternalAxiosRequestConfig } from "axios";
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
