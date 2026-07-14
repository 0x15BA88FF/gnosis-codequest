import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMind } from "../services/minds.js";
import { success, failure } from "../utils/mcpResponse.js";

export function registerCreateMindTool(server: McpServer) {
    server.registerTool(
        "create_mind",
        {
            title: "Create Mind",
            description: "Creates a new mind in an organization.",
            inputSchema: {
                orgId: z.string().uuid().describe("Organization ID"),
                name: z
                    .string()
                    .min(1)
                    .max(255)
                    .describe("Name of the mind"),
                description: z
                    .string()
                    .optional()
                    .describe("Description of the mind"),
                storageQuotaMb: z
                    .number()
                    .int()
                    .positive()
                    .optional()
                    .describe("Storage quota in MB"),
            },
        },
        async ({ orgId, name, description, storageQuotaMb }) => {
            try {
                const mind = await createMind(orgId, {
                    name,
                    description,
                    storageQuotaMb,
                });

                return success(mind);
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to create mind."
                );
            }
        }
    );
}