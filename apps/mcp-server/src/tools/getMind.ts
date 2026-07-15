import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMind } from "../services/minds.js";
import { success, failure } from "../utils/mcpResponse.js";

export function registerGetMindTool(server: McpServer) {
    server.registerTool(
        "get_mind",
        {
            title: "Get Mind",
            description: "Returns information about a specific mind.",
            inputSchema: {
                mindId: z.string().uuid().describe("Mind ID")
            }
        },
        async ({ mindId }) => {
            try {
                const mind = await getMind(mindId);
                return success(mind);
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch mind."
                );
            }
        }
    );
}