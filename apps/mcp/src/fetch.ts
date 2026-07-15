import ky, { isHTTPError } from "ky";

const BASE_URL = process.env.BACKEND_API_URL;
const TOKEN = process.env.BACKEND_API_TOKEN;

if (!BASE_URL) throw new Error("BACKEND_API_URL is not defined");
if (!TOKEN) throw new Error("BACKEND_API_TOKEN is not defined");

const api = ky.create({
  prefix: BASE_URL,
  headers: { Authorization: `Bearer ${TOKEN}` },
  timeout: 10000,
  retry: 0,
  hooks: {
    beforeError: [
      (state) => {
        const { error } = state;
        if (isHTTPError(error) && error.data && typeof error.data === "object") {
          const body = error.data as { detail?: string; message?: string; title?: string };
          error.message = body.detail ?? body.message ?? body.title ?? error.message;
        }
        return error;
      },
    ],
  },
});

export async function checkHealth(): Promise<string> {
  const res = await api.get("hello");
  return res.text();
}

export async function createOrganization(data: { name: string }) {
  return api.post("api/v1/organizations", { json: data }).json();
}

export async function listMinds(orgId: string) {
  return api.get(`api/v1/organizations/${orgId}/minds`).json();
}

export async function createMind(
  orgId: string,
  data: { name: string; description?: string; storageQuotaMb?: number },
) {
  return api.post(`api/v1/organizations/${orgId}/minds`, { json: data }).json();
}

export async function getMind(mindId: string) {
  return api.get(`api/v1/minds/${mindId}`).json();
}

export async function listMindDocuments(mindId: string) {
  return api.get(`api/v1/minds/${mindId}/documents`).json();
}

export async function getDocument(documentId: string) {
  return api.get(`api/v1/documents/${documentId}`).json();
}

export async function uploadDocument(mindId: string, filePath: string) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const fileBuffer = await fs.readFile(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer]), path.basename(filePath));
  return api.post(`api/v1/minds/${mindId}/documents`, { body: formData }).json();
}

export async function queryMinds(data: { query: string; mindIds: string[]; topK?: number }) {
  return api.post("api/v1/query", { json: data }).json();
}
