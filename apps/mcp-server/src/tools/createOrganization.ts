import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { createOrganization } from "../services/organizations.js";
import { success, failure } from "../utils/mcpResponse.js";

export function registerCreateOrganizationTool(server: McpServer) {
    server.registerTool(
        "create_organization",
        {
            title: "Create Organization",
            description: "Creates a new organization.",
            inputSchema: {
                name: z
                    .string()
                    .min(1)
                    .max(255)
                    .describe("Organization name"),
            },
        },
        async ({ name }) => {
            try {
                const organization = await createOrganization({
                    name,
                });

                return success(organization);
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to create organization."
                );
            }
        }
    );
}