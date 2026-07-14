import { api, extractErrorMessage } from "./api.js";
import { Organization, CreateOrganizationRequest } from "../types/api.js";

export async function createOrganization(
    request: CreateOrganizationRequest
): Promise<Organization> {
    try {
        const response = await api.post(
            "/api/v1/organizations",
            request
        );

        return response.data;
    } catch (error) {
        throw new Error(
            extractErrorMessage(
                error,
                "Failed to create organization"
            )
        );
    }
}