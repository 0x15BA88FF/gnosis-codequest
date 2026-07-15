import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listMindDocuments } from "../services/documents.js";
import { success, failure } from "../utils/mcpResponse.js";

export function registerListMindDocumentsTool(server: McpServer) {
    server.registerTool(
        "list_mind_documents",
        {
            title: "List Mind Documents",
            description: "Lists all documents inside a mind.",
            inputSchema: {
                mindId: z.string().uuid().describe("Mind ID")
            }
        },
        async ({ mindId }) => {
            try {
                const documents = await listMindDocuments(mindId);
                return success(documents);
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to list documents."
                );
            }
        }
    );
}
