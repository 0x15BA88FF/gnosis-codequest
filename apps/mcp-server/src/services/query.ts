import { api, extractErrorMessage } from "./api.js";
import { QueryRequest, QueryResponse } from "../types/api.js";

export async function queryMinds(
    request: QueryRequest
): Promise<QueryResponse> {
    try {
        const response = await api.post(
            "/api/v1/query",
            request
        );

        return response.data;
    } catch (error) {
        throw new Error(extractErrorMessage(error, "Failed to query minds"));
    }
}
