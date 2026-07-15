import { api, extractErrorMessage } from "./api.js";
import { Document } from "../types/api.js";
import fs from "node:fs/promises";
import path from "node:path";
import mime from "mime-types";

export async function listMindDocuments(
    mindId: string
): Promise<Document[]> {
    try {
        const response = await api.get(
            `/api/v1/minds/${mindId}/documents`
        );

        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Failed to list documents"));
    }
}

export async function getDocument(
    documentId: string
): Promise<Document> {
    try {
        const response = await api.get(
            `/api/v1/documents/${documentId}`
        );

        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Failed to fetch document"));
    }
}
export async function uploadDocument(
    mindId: string,
    filePath: string
): Promise<Document> {
    try {
        const fileBuffer = await fs.readFile(filePath);

        const formData = new FormData();

        formData.append(
            "file",
            new Blob([fileBuffer], {
                type: mime.lookup(filePath) || "application/octet-stream",
            }),
            path.basename(filePath)
        );

        const response = await api.post(
            `/api/v1/minds/${mindId}/documents`,
            formData
        );

        return response.data;
    } catch (error) {
        throw new Error(
            extractErrorMessage(error, "Failed to upload document")
        );
    }
}
