import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDocument } from "../services/documents.js";
import { success, failure } from "../utils/mcpResponse.js";


export function registerGetDocumentTool(server: McpServer) {
    server.registerTool(
        "get_document",
        {
            title: "Get Document",
            description: "Returns information about a specific document.",
            inputSchema: {
                documentId: z.string().uuid().describe("Document ID")
            }
        },
        async ({ documentId }) => {
            try {
                const document = await getDocument(documentId);
                return success(document);
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch document."
                );
            }
        }
    );
}
