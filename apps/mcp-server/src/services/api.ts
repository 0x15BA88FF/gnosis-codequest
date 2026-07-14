import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
import { getBackendToken } from "../utils/auth.js";
import { ProblemDetail } from "../types/api.js";

dotenv.config();

const BASE_URL = process.env.BACKEND_API_URL;

if (!BASE_URL) {
  throw new Error("BACKEND_API_URL is not defined in .env");
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

const staticToken = getBackendToken();
if (staticToken) {
  api.defaults.headers.common.Authorization = `Bearer ${staticToken}`;
}

/** Manually override the bearer token used for outgoing requests. */
export function setAccessToken(token: string) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

/**
 * Extracts a human-readable message from a failed backend request.
 * The Gnosis API returns RFC7807 ProblemDetail bodies on errors
 * (400/404/etc, see openapi.yml components.schemas.ProblemDetail),
 * so we surface `detail`/`title` when present instead of a generic
 * "something went wrong" message. This matters because these tool
 * results are read by an LLM, which needs the real reason to respond
 * usefully to the user.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ProblemDetail & { message?: string }>;
    const data = axiosError.response?.data;

    if (data && typeof data === "object") {
      if (data.detail) return data.detail;
      if (data.message) return data.message;
      if (data.title) return data.title;
    }

    if (axiosError.response?.status) {
      return `${fallback} (HTTP ${axiosError.response.status})`;
    }

    if (axiosError.code === "ECONNREFUSED" || axiosError.code === "ENOTFOUND") {
      return `${fallback}: could not reach backend API at ${BASE_URL}`;
    }
  }

  if (error instanceof Error) {
    return `${fallback}: ${error.message}`;
  }

  return fallback;
}

/** Backend health check (GET /hello). Returns the plain-text body. */
export async function checkBackendHealth(): Promise<string> {
  const response = await api.get<string>("/hello");
  return response.data;
}
