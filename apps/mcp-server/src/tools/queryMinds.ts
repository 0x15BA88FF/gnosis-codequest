import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryMinds } from "../services/query.js";
import { success, failure } from "../utils/mcpResponse.js"

export function registerQueryMindsTool(server: McpServer) {
    server.registerTool(
        "query_minds",
        {
            title: "Query Minds",
            description:
                "Searches one or more minds and returns an AI-generated answer with citations.",
            inputSchema: {
                query: z.string().describe("Question to ask"),
                mindIds: z.array(z.string().uuid())
                    .min(1)
                    .describe("Mind IDs to search"),
                topK: z.number()
                    .int()
                    .max(20)
                    .optional()
                    .describe("Maximum number of retrieved chunks (max 20, default 10)")
            }
        },
        async ({ query, mindIds, topK }) => {
            try {
                const result = await queryMinds({
                    query,
                    mindIds,
                    topK
                });

                return success(result);

            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to query minds."
                );
            }
        }
    );
}
