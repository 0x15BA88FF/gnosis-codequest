import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHealthTool } from "./health.js";
import { registerListMindsTool } from "./listMinds.js";
import { registerGetMindTool } from "./getMind.js";
import { registerListMindDocumentsTool } from "./listDocuments.js";
import { registerGetDocumentTool } from "./getDocument.js";
import { registerQueryMindsTool } from "./queryMinds.js";
import { registerCreateMindTool } from "./createMind.js";
import { registerCreateOrganizationTool } from "./createOrganization.js";
import { registerUploadDocumentTool } from "./uploadDocument.js";

export function registerTools(server: McpServer) {
  registerHealthTool(server);

  registerListMindsTool(server);
  registerGetMindTool(server);

  registerListMindDocumentsTool(server);
  registerGetDocumentTool(server);

  registerQueryMindsTool(server);

  registerCreateMindTool(server);

  registerCreateOrganizationTool(server);

  registerUploadDocumentTool(server);
}