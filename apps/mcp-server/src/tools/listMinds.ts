import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listMinds } from "../services/minds.js";
import { success, failure } from "../utils/mcpResponse.js";

export function registerListMindsTool(server: McpServer) {
    server.registerTool(
        "list_minds",
        {
            title: "List Minds",
            description: "Lists all minds in an organization.",
            inputSchema: {
                orgId: z.string().uuid().describe("Organization ID")
            }
        },
        async ({ orgId }) => {
            try {
                const minds = await listMinds(orgId);
                return success(minds);
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to list minds."
                );
            }
        }
    );
}
