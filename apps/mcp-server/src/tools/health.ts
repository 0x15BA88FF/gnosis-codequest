import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkBackendHealth } from "../services/api.js";
import { success, failure } from "../utils/mcpResponse.js";

export function registerHealthTool(server: McpServer) {
  server.registerTool(
    "health",
    {
      title: "Health Check",
      description: "Checks whether the Gnosis MCP server and backend API are running.",
      inputSchema: {},
    },
    async () => {
      try {
        const backendStatus = await checkBackendHealth();
        return success({
          mcpServer: "ok",
          backendApi: backendStatus,
        });
      } catch (error) {
        return failure(
          error instanceof Error
            ? `MCP server is running, but the backend API is unreachable: ${error.message}`
            : "MCP server is running, but the backend API is unreachable."
        );
      }
    }
  );
}
