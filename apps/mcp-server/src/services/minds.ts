import { api, extractErrorMessage } from "./api.js";
import { Mind, CreateMindRequest } from "../types/api.js";


export async function listMinds(orgId: string): Promise<Mind[]> {
    try {
        const response = await api.get(
            `/api/v1/organizations/${orgId}/minds`
        );

        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Failed to list minds"));
    }
}

export async function getMind(mindId: string): Promise<Mind> {
    try {
        const response = await api.get(
            `/api/v1/minds/${mindId}`
        );

        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Failed to fetch mind"));
    }
}

export async function createMind(
    orgId: string,
    request: CreateMindRequest
): Promise<Mind> {
    try {
        const response = await api.post(
            `/api/v1/organizations/${orgId}/minds`,
            request
        );

        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Failed to create mind"));
    }
}