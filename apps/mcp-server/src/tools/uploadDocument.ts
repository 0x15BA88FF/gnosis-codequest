import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { uploadDocument } from "../services/documents.js";
import { success, failure } from "../utils/mcpResponse.js";

export function registerUploadDocumentTool(server: McpServer) {
    server.registerTool(
        "upload_document",
        {
            title: "Upload Document",
            description: "Uploads a document to a mind.",
            inputSchema: {
                mindId: z
                    .string()
                    .uuid()
                    .describe("Mind ID"),

                filePath: z
                    .string()
                    .describe("Path to the file on disk")
            }
        },
        async ({ mindId, filePath }) => {
            try {
                const document = await uploadDocument(
                    mindId,
                    filePath
                );

                return success(document);
            } catch (error) {
                return failure(
                    error instanceof Error
                        ? error.message
                        : "Failed to upload document."
                );
            }
        }
    );
}