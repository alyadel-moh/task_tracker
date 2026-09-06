import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { axiosInstance } from "../api-client";

describe("axiosInstance", () => {
  const originalGetItem = Storage.prototype.getItem;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    Storage.prototype.getItem = originalGetItem;
  });

  describe("Instance Configuration", () => {
    it("configures the default baseURL and headers", () => {
      expect(axiosInstance.defaults.baseURL).toBe(
        import.meta.env.VITE_API_BASE_URL,
      );
      expect(axiosInstance.defaults.headers["Content-Type"]).toBe(
        "application/json",
      );
      expect(axiosInstance.defaults.headers["Accept"]).toBe("application/json");
    });

    it("registers a request interceptor", () => {
      // @ts-expect-error accessing internal handlers array
      const handlers = axiosInstance.interceptors.request.handlers;
      expect(handlers.length).toBeGreaterThan(0);
      expect(handlers[0].fulfilled).toBeTypeOf("function");
    });
  });

  describe("Request Interceptor — Authorization Header", () => {
    it("attaches the Bearer token when a token exists in localStorage", async () => {
      const mockToken = "jwt-test-token-12345";
      localStorage.setItem("token", mockToken);

      // @ts-expect-error accessing internal interceptor handler
      const requestInterceptor =
        axiosInstance.interceptors.request.handlers[0].fulfilled;

      const mockConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const resultConfig = await requestInterceptor(mockConfig);
      expect(resultConfig.headers["Authorization"]).toBe(`Bearer ${mockToken}`);
    });

    it("does not attach the Authorization header when no token is present in localStorage", async () => {
      localStorage.removeItem("token");

      // @ts-expect-error accessing internal interceptor handler
      const requestInterceptor =
        axiosInstance.interceptors.request.handlers[0].fulfilled;

      const mockConfig = {
        headers: {},
      } as InternalAxiosRequestConfig;

      const resultConfig = await requestInterceptor(mockConfig);
      expect(resultConfig.headers["Authorization"]).toBeUndefined();
    });

    it("preserves custom headers while appending Authorization", async () => {
      const mockToken = "secure-jwt-token";
      localStorage.setItem("token", mockToken);

      // @ts-expect-error accessing internal interceptor handler
      const requestInterceptor =
        axiosInstance.interceptors.request.handlers[0].fulfilled;

      const mockConfig = {
        headers: {
          "X-Custom-Header": "CustomValue",
        },
      } as unknown as InternalAxiosRequestConfig;

      const resultConfig = await requestInterceptor(mockConfig);
      expect(resultConfig.headers["X-Custom-Header"]).toBe("CustomValue");
      expect(resultConfig.headers["Authorization"]).toBe(`Bearer ${mockToken}`);
    });
  });
});
